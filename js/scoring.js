/* =============================================================
   scoring.js — turns answers into scores, and checks the key.

   A plan is one action per decision:
     {escalation:"delegate", expansion:"hold", recommendation:"own", ...}
   A decision scores KEY[caseId][decision][action], 0 to 20.
   A case score is the sum over its five decisions, 0 to 100.
   The AI advice is a plan too, and is scored the same way.
   ============================================================= */

function caseById(id){ return CASES.find(c => c.id === id); }
const ACTION_KEYS = ["own", "delegate", "wait", "hold"];
const AI_LEVELS = ["high", "moderate", "low", "very_low"];

/* ---- instrument version ---------------------------------------------
   instrumentMeta() is stamped once on every new response (survey.js) and
   never changed after that. The fingerprints follow cases.js and key.js
   by themselves; SCORING_VERSION is the one to bump by hand when the
   rules in this file change. RECORD_SCHEMA is the shape of a saved
   response: records without a schemaVersion field are version 1, the
   earlier pilot with quotas and named delegates is version 2. */
const SCORING_VERSION = 2;
const RECORD_SCHEMA = 3;

/* JSON with sorted object keys, so the same content always hashes the same */
function stableJSON(x){
  if(Array.isArray(x)) return "[" + x.map(stableJSON).join(",") + "]";
  if(x && typeof x === "object")
    return "{" + Object.keys(x).sort().filter(k => x[k] !== undefined)
      .map(k => JSON.stringify(k) + ":" + stableJSON(x[k])).join(",") + "}";
  return JSON.stringify(x === undefined ? null : x);
}
/* FNV-1a, 32 bits, as 8 hex digits. A change detector, not security. */
function fingerprint(x){
  const s = stableJSON(x);
  let h = 0x811c9dc5;
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return ("0000000" + h.toString(16)).slice(-8);
}
function instrumentMeta(){
  const aiScores = {};
  CASES.forEach(c => { aiScores[c.id] = {}; AI_LEVELS.forEach(l => { aiScores[c.id][l] = aiPlanScore(c, l); }); });
  return {
    instrumentVersion: CONFIG.instrumentVersion || null,
    scoringVersion: SCORING_VERSION,
    casesHash: fingerprint(CASES),
    keyHash: fingerprint(KEY),
    scoringConfig: {decisionMax: 20, caseMax: 100},
    caseIds: CASES.map(c => c.id),
    decisionIds: Object.fromEntries(CASES.map(c => [c.id, c.decisions.map(d => d.k)])),
    aiLevels: AI_LEVELS,
    aiConditions: CONFIG.aiConditions,
    aiScores
  };
}
/* Was this record made with the cases, key and scoring deployed now?
   true, false, or null when the record predates version stamping. */
function sameInstrument(meta){
  if(!meta) return null;
  const now = instrumentMeta();
  return meta.casesHash === now.casesHash && meta.keyHash === now.keyHash &&
         meta.scoringVersion === now.scoringVersion &&
         stableJSON(meta.scoringConfig) === stableJSON(now.scoringConfig);
}

/* ---- scores ----------------------------------------------------------- */
function decisionScore(caseId, k, action){
  const row = (KEY[caseId] || {})[k];
  return row && row[action] != null ? row[action] : 0;
}
function preferredAction(caseId, k){
  const row = (KEY[caseId] || {})[k] || {};
  return ACTION_KEYS.reduce((best, a) => (row[a] ?? -1) > (row[best] ?? -1) ? a : best, ACTION_KEYS[0]);
}
/* {total 0-100, parts {k: 0-20}, matches: how many preferred actions} */
function scorePlan(caseId, plan){
  const c = caseById(caseId), parts = {};
  let total = 0, matches = 0;
  c.decisions.forEach(d => {
    const a = plan && plan[d.k];
    parts[d.k] = decisionScore(caseId, d.k, a);
    total += parts[d.k];
    if(a && a === preferredAction(caseId, d.k)) matches++;
  });
  return {total, parts, matches};
}

/* ---- AI advice -------------------------------------------------------- */
/* the advice for one caselet at one level: {actions:{k}, why:{k}} */
function aiPlan(c, level){
  const a = c.ai[level], actions = {}, why = {};
  c.decisions.forEach(d => { actions[d.k] = a[d.k][0]; why[d.k] = a[d.k][1]; });
  return {level, actions, why};
}
function aiPlanScore(c, level){ return scorePlan(c.id, aiPlan(c, level).actions).total; }

/* The level each caselet gets under one condition. Caselet i, in
   cases.js order, gets AI_LEVELS[(i + condition) mod 4]. */
function aiAssignment(condition){
  const out = {};
  CASES.forEach((c, i) => { out[c.id] = AI_LEVELS[(i + condition) % AI_LEVELS.length]; });
  return out;
}

/* ---- load-time check -------------------------------------------------- */
function checkKey(){
  const problems = [];
  const ids = CASES.map(c => c.id);
  ids.forEach((id, i) => { if(ids.indexOf(id) !== i) problems.push(`case id ${id} is used twice`); });
  CASES.forEach(c => {
    const K = KEY[c.id];
    if(!K){ problems.push(`case ${c.id}: no key`); return; }
    const keys = c.decisions.map(d => d.k);
    if(keys.length !== 5) problems.push(`case ${c.id}: ${keys.length} decisions, expected 5`);
    keys.forEach((k, i) => { if(keys.indexOf(k) !== i) problems.push(`case ${c.id}: decision id "${k}" is used twice`); });
    Object.keys(K).forEach(k => { if(!keys.includes(k)) problems.push(`case ${c.id}: key scores "${k}", which is not a decision`); });
    let ownPreferred = 0;
    keys.forEach(k => {
      const row = K[k];
      if(!row){ problems.push(`case ${c.id}: no scores for "${k}"`); return; }
      const v = ACTION_KEYS.map(a => row[a]);
      if(v.some(x => typeof x !== "number" || x < 0 || x > 20)) problems.push(`case ${c.id}: "${k}" needs four scores from 0 to 20`);
      else if(v.filter(x => x === 20).length !== 1) problems.push(`case ${c.id}: "${k}" must have exactly one action scoring 20`);
      else if(preferredAction(c.id, k) === "own") ownPreferred++;
    });
    if(ownPreferred > 2) problems.push(`case ${c.id}: ${ownPreferred} decisions prefer Own; the design allows at most two`);
    AI_LEVELS.forEach(l => {
      const a = c.ai && c.ai[l];
      if(!a){ problems.push(`case ${c.id}: no ${l} AI advice`); return; }
      keys.forEach(k => {
        const x = a[k];
        if(!x || !ACTION_KEYS.includes(x[0]) || !String(x[1] || "").trim())
          problems.push(`case ${c.id}: ${l} AI advice needs an action and a reason for "${k}"`);
      });
    });
    if(!problems.some(p => p.startsWith(`case ${c.id}:`))){
      const s = AI_LEVELS.map(l => aiPlanScore(c, l));
      for(let i = 1; i < s.length; i++)
        if(!(s[i] < s[i - 1])) problems.push(`case ${c.id} (${c.name}): AI advice must get weaker level by level, but scores ${s.join(", ")}`);
    }
  });
  problems.push(...checkOrderRules());
  if(problems.length){
    console.error("Instrument check failed:\n" + problems.join("\n"));
    try{
      const b = document.createElement("div");
      b.className = "devwarn";
      b.innerHTML = "<b>Instrument check failed — fix before fielding</b><ul>" +
        problems.map(p => "<li>" + p + "</li>").join("") + "</ul>";
      document.body.insertBefore(b, document.body.firstChild);
    }catch(e){}
  }
  return problems;
}
