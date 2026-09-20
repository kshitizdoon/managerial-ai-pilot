/* =============================================================
   scoring.js — turns a plan into scores. Two modes.

   split   CaseScore = (Own + Delegate + Wait + Hold) / 4
   merged  CaseScore = (Own + Delegate + DeferSet) / 3
           DeferSet scores WHICH TWO issues were set aside, not which of
           the two got which label. The hold follow-up is scored on its
           own as holdScore, outside the case score.

   A plan looks like:
     {own:"quality", del:{supplier:"arjun", retailer:"priya"},
      wait:"marketing", hold:"quality"}            // split
     {own:"quality", del:{...}, defer:["marketing","retailer"],
      holdPick:"marketing"|null}                    // merged
   ============================================================= */

function caseById(id){ return CASES.find(c => c.id === id); }
function keyFor(id){ return KEY[id]; }

function delegateScore(id, issue, person){
  const k = keyFor(id).del[issue] || {};
  return (person != null && k[person] != null) ? k[person] : CONFIG.unlistedDelegateScore;
}

/* mean delegate score over the two delegations */
function delegatePart(id, del){
  const ks = Object.keys(del || {});
  if(!ks.length) return 0;
  return ks.reduce((s,i) => s + delegateScore(id, i, del[i]), 0) / ks.length;
}

/* best of the two ways to split a deferred pair between wait and hold */
function deferSetScore(id, pair){
  const K = keyFor(id);
  if(!pair || pair.length !== 2) return 0;
  const [a,b] = pair;
  const one = ((K.wait[a] ?? 0) + (K.hold[b] ?? 0)) / 2;
  const two = ((K.wait[b] ?? 0) + (K.hold[a] ?? 0)) / 2;
  return Math.max(one, two);
}

function scorePlan(id, plan, mode){
  const K = keyFor(id);
  const own = K.own[plan.own] ?? 0;
  const del = delegatePart(id, plan.del);

  if((mode || CONFIG.deferMode) === "merged"){
    const pair = plan.defer || [];
    const set = deferSetScore(id, pair);
    const hold = plan.holdPick ? (K.hold[plan.holdPick] ?? 0) : null;
    const parts = [own, del, set];
    if(CONFIG.includeHoldInCaseScore && hold != null) parts.push(hold);
    return {own, del, set, hold, wait:null,
            total: parts.reduce((a,b)=>a+b,0) / parts.length};
  }

  const wait = K.wait[plan.wait] ?? 0;
  const hold = K.hold[plan.hold] ?? 0;
  return {own, del, wait, hold, set:deferSetScore(id, [plan.wait, plan.hold]),
          total:(own + del + wait + hold) / 4};
}

/* the same plan scored the other way, so the dashboard can compare */
function scoreBothWays(id, plan){
  const split = plan.wait ? scorePlan(id, plan, "split") : null;
  const asPair = plan.defer || (plan.wait ? [plan.wait, plan.hold] : []);
  const merged = scorePlan(id, {own:plan.own, del:plan.del, defer:asPair,
                               holdPick:plan.holdPick ?? plan.hold}, "merged");
  return {split, merged};
}

/* did the wait/hold split match the key, given the pair chosen? */
function splitMatchesKey(id, pair, waitPick){
  const K = keyFor(id); if(!pair || pair.length !== 2) return null;
  const [a,b] = pair;
  const best = ((K.wait[a]??0)+(K.hold[b]??0)) >= ((K.wait[b]??0)+(K.hold[a]??0)) ? a : b;
  return waitPick === best;
}

/* how many case-score points the wait/hold split is worth, given the pair */
function splitSwing(id, pair){
  const K = keyFor(id); if(!pair || pair.length !== 2) return 0;
  const [a,b] = pair;
  return Math.abs(((K.wait[a]??0)+(K.hold[b]??0)) - ((K.wait[b]??0)+(K.hold[a]??0))) / 4;
}

/* the AI plan, in plan shape, for a given version.
   A case may carry a second set of plans under aiMerged, used when the
   deferral question is merged. Needed where a plan's only flaw is the
   wait/hold split, which merged scoring ignores. */
function activeMode(){
  return (typeof ST !== "undefined" && ST && ST.deferMode) || CONFIG.deferMode;
}
function aiPlan(c, version, mode){
  const m = mode || activeMode();
  const a = (m === "merged" && c.aiMerged && c.aiMerged[version]) ? c.aiMerged[version] : c.ai[version];
  return {own:a.own, del:{...a.del}, wait:a.wait, hold:a.hold,
          defer:a.defer ? [...a.defer] : [a.wait, a.hold],
          holdPick:a.holdPick !== undefined ? a.holdPick : a.hold, why:a.why};
}

/* how far apart the good and the bad plan are, in the mode you are fielding */
function aiQualityGaps(mode){
  const m = mode || activeMode();
  return CASES.map(c => {
    const badV = c.goodVersion === "A" ? "B" : "A";
    const good = scorePlan(c.id, aiPlan(c, c.goodVersion, m), m).total;
    const bad  = scorePlan(c.id, aiPlan(c, badV, m), m).total;
    return {id:c.id, name:c.name, good, bad, gap:good - bad};
  });
}
const aiIsGood = (c, version) => c.goodVersion === version;

/* sanity check on load: every issue must be in the key */
function checkKey(){
  const problems = [];
  CASES.forEach(c => {
    const K = KEY[c.id];
    if(!K){ problems.push(`case ${c.id}: no key`); return; }
    c.issues.forEach(i => {
      ["own","wait","hold"].forEach(sl => {
        if(K[sl][i.k] == null) problems.push(`case ${c.id}: ${sl} score missing for "${i.k}"`);
      });
      if(!K.del[i.k]) problems.push(`case ${c.id}: delegate scores missing for "${i.k}"`);
    });
    ["A","B"].forEach(v => { if(!c.ai[v]) problems.push(`case ${c.id}: no version ${v} AI plan`); });
  });
  aiQualityGaps().forEach(g => {
    if(g.gap < 15) problems.push(`case ${g.id} (${g.name}): in "${activeMode()}" mode the good and bad AI plans are only ${g.gap.toFixed(1)} points apart. The manipulation is too weak to estimate anything from. Give this case an aiMerged plan in cases.js.`);
  });
  problems.push(...checkOrderRules());
  if(problems.length){
    console.error("Instrument check failed:\n" + problems.join("\n"));
    try{
      const b = document.createElement("div");
      b.className = "devwarn";
      b.innerHTML = "<b>Instrument check failed \u2014 fix before fielding</b><ul>" +
        problems.map(p => "<li>" + p + "</li>").join("") + "</ul>";
      document.body.insertBefore(b, document.body.firstChild);
    }catch(e){}
  }
  return problems;
}
