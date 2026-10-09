/* Builds response records shaped like the ones survey.js saves, for
   dashboard and export tests.
   opts: pid, condition (0-3), done, firsts (how many caselets have first
   answers), finals (how many have final answers), first (an action, or
   "pref" for the preferred action on every decision), final ("first",
   "ai", or an action), schema (schemaVersion; defaults to current). */
import { plain } from "./load.mjs";

export function makeRecord(site, opts = {}){
  const o = { pid: "p", condition: 0, done: true, firsts: 6, finals: 6, first: "pref", final: "first", ...opts };
  return plain(site.run(`(() => {
    const o = ${JSON.stringify(o)}, cases = {}, levels = aiAssignment(o.condition);
    CASES.forEach((c, i) => {
      if(i >= o.firsts) return;
      const keys = c.decisions.map(d => d.k), ai = aiPlan(c, levels[c.id]);
      const first = {}; keys.forEach(k => { first[k] = o.first === "pref" ? preferredAction(c.id, k) : o.first; });
      const rec = {pos:i+1, errA:0, errB:0, decisionOrder:keys, first, msA:90000,
                   tA:Object.fromEntries(keys.map((k, j) => [k, 1000 * (j + 1)]))};
      if(i < o.finals){
        const final = {}; keys.forEach(k => { final[k] = o.final === "first" ? first[k] : o.final === "ai" ? ai.actions[k] : o.final; });
        Object.assign(rec, {final, msB:60000, conf:3, reason:"", serverCheckpointed:true,
          tB:Object.fromEntries(keys.map((k, j) => [k, 500 * (j + 1)])),
          ai:{condition:o.condition, level:levels[c.id], actions:ai.actions, why:ai.why, score:aiPlanScore(c, levels[c.id])}});
      }
      cases[c.id] = rec;
    });
    return {pid:o.pid, aiCondition:o.condition, aiLevels:levels, started:"2026-10-01T10:00:00.000Z",
      bg:{programme:"PGP year 1", experience:"None", managed:"No", aiUse:"Daily", undergrad:"Other"},
      caseOrder:CASES.map(c => c.id), order:[0,1,2,3,4,5], at:o.finals, cases, msBg:5000, msIntro:20000,
      practice:{answers:{a:"wait", b:"hold"}, correct:true, ms:30000, msFeedback:5000},
      done:o.done, contact:null, schemaVersion:o.schema ?? RECORD_SCHEMA, instrument:instrumentMeta(),
      saveSeq:1 + o.firsts + o.finals + (o.done ? 1 : 0), saveReason:o.done ? "finish" : "case_complete",
      status:o.done ? "complete" : "in_progress", receivedAt:"2026-10-01T10:30:00.000Z",
      ...(o.done ? {finished:"2026-10-01T10:30:00.000Z", totalMin:30,
        end:{aiHelp:"No", compare:"About the same", guess:"", cat:null},
        pilot:{hardest:"None stood out", waitHold:"Clear", obvious:"", hardToFit:"", length:"About right", other:""}} : {})};
  })()`));
}

/* a record as the earlier pilot (quotas, named delegates) saved it */
export function earlierPilotRecord(pid = "old1", done = true){
  return { pid, version: "A", deferMode: "split", done, saveSeq: 14, status: done ? "complete" : "in_progress",
    order: [0, 1, 2, 3, 4, 5], schemaVersion: 2,
    cases: { 1: { first: { own: "ops", del: { supplier: "arjun", retailer: "priya" }, wait: "marketing", hold: "quality" },
                  final: { own: "ops", del: { supplier: "arjun", retailer: "priya" }, wait: "marketing", hold: "quality" } } } };
}
