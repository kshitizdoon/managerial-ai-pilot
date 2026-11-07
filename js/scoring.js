/* =============================================================
   scoring.js — turns answers into scores, and checks the key.

   A plan is one action per decision:
     {escalation:"delegate", expansion:"hold", recommendation:"own", ...}
   A decision scores KEY[caseId][decision][action], 0 to 20.
   A case score is the sum over its four decisions, rescaled to 0 to 100
   (sum x 100 / 80), so it stays on the scale of earlier versions.
   The AI advice is a plan too, and is scored the same way.
   ============================================================= */

function caseById(id){ return CASES.find(c => c.id === id); }
const ACTION_KEYS = ["own", "delegate", "wait", "hold"];

/* ---- instrument version ---------------------------------------------
   instrumentMeta() is stamped once on every new response (survey.js) and
   never changed after that. The fingerprints follow cases.js and key.js
   by themselves; SCORING_VERSION is the one to bump by hand when the
   rules in this file change. RECORD_SCHEMA is the shape of a saved
   response: records without a schemaVersion field are version 1, the
   earlier pilot with quotas and named delegates is version 2, six
   caselets with five decisions each (October 2026) is version 3, and
   five caselets with four decisions each is version 4. */
const SCORING_VERSION = 3;  // unchanged: the AI advice design is in instrumentMeta().aiDesign
const RECORD_SCHEMA = 4;
const DECISIONS_PER_CASE = 4;
const DECISION_MAX = 20;

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
  return {
    instrumentVersion: CONFIG.instrumentVersion || null,
    scoringVersion: SCORING_VERSION,
    casesHash: fingerprint(CASES),
    keyHash: fingerprint(KEY),
    scoringConfig: {decisionMax: DECISION_MAX, caseMax: 100, decisionsPerCase: DECISIONS_PER_CASE},
    caseIds: CASES.map(c => c.id),
    decisionIds: Object.fromEntries(CASES.map(c => [c.id, c.decisions.map(d => d.k)])),
    aiDesign: {rightShare: CONFIG.aiRightShare, draw: "exact share of all decisions per respondent, at random"}
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
/* the sum of decision scores on the 0-100 case scale */
function toCaseScale(sum, n){ return Math.round(sum * 100 / (DECISION_MAX * n) * 100) / 100; }
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
  return {total: toCaseScale(total, c.decisions.length), parts, matches};
}

/* ---- AI advice --------------------------------------------------------
   Each decision has one piece of right advice (the preferred action under
   key.js, with its reason) and one or more pieces of wrong advice
   (another action, with its reason): cases.js, c.ai[k] = {right, wrong}.
   For each respondent, drawAdvice() makes the advice right on a random
   CONFIG.aiRightShare of all decisions (exactly half by default, so 10 of
   20) and wrong on the rest, picking one of the wrong options at random.
   The draw is made once, at Start, and stored with the response. */

/* the advice for one decision: right (true/false) and, if wrong, which option */
function adviceFor(c, k, right, wrongIndex){
  const a = c.ai[k];
  if(right) return {action: preferredAction(c.id, k), why: a.right, right: true};
  const w = a.wrong[(wrongIndex || 0) % a.wrong.length];
  return {action: w[0], why: w[1], right: false};
}

/* {caseId: {actions:{k}, why:{k}, right:{k: true/false}}} for one respondent.
   force: "right" or "wrong" makes every decision right or wrong (testing). */
function drawAdvice(rng, force){
  rng = rng || Math.random;
  const all = [];
  CASES.forEach(c => c.decisions.forEach(d => all.push([c, d.k])));
  for(let i = all.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const nRight = force === "right" ? all.length : force === "wrong" ? 0 : Math.round(all.length * CONFIG.aiRightShare);
  const out = {};
  CASES.forEach(c => { out[c.id] = {actions: {}, why: {}, right: {}}; });
  all.forEach(([c, k], i) => {
    const a = adviceFor(c, k, i < nRight, Math.floor(rng() * c.ai[k].wrong.length));
    out[c.id].actions[k] = a.action; out[c.id].why[k] = a.why; out[c.id].right[k] = a.right;
  });
  return out;
}

/* how many of a caselet's AI actions are the preferred ones */
function adviceRightCount(caseId, actions){
  return caseById(caseId).decisions.filter(d => actions && actions[d.k] === preferredAction(caseId, d.k)).length;
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
    if(keys.length !== DECISIONS_PER_CASE) problems.push(`case ${c.id}: ${keys.length} decisions, expected ${DECISIONS_PER_CASE}`);
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
    Object.keys(c.ai || {}).forEach(k => { if(!keys.includes(k)) problems.push(`case ${c.id}: AI advice for "${k}", which is not a decision`); });
    keys.forEach(k => {
      const a = c.ai && c.ai[k];
      if(!a || !String(a.right || "").trim()){ problems.push(`case ${c.id}: "${k}" needs a reason for the right AI advice`); return; }
      if(!Array.isArray(a.wrong) || !a.wrong.length){ problems.push(`case ${c.id}: "${k}" needs at least one wrong AI advice`); return; }
      const seen = [];
      a.wrong.forEach(w => {
        if(!Array.isArray(w) || !ACTION_KEYS.includes(w[0]) || !String(w[1] || "").trim())
          problems.push(`case ${c.id}: wrong AI advice for "${k}" needs an action and a reason`);
        else if(K[k] && w[0] === preferredAction(c.id, k))
          problems.push(`case ${c.id}: wrong AI advice for "${k}" recommends the preferred action`);
        else if(seen.includes(w[0])) problems.push(`case ${c.id}: wrong AI advice for "${k}" lists ${w[0]} twice`);
        seen.push(w && w[0]);
      });
    });
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
