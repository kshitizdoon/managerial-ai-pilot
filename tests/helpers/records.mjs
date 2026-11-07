/* Builds response records shaped like the ones survey.js saves, for
   dashboard and export tests.
   opts: pid, condition (0-3), done, firsts (how many caselets have first
   answers), finals (how many have final answers), first (an action, or
   "pref" for the preferred action on every decision), final ("first",
   "ai", or an action), schema (schemaVersion; defaults to current),
   advice ("mixed": half right at random, seeded by pid and seed;
   "right" or "wrong": all advice right or wrong). */
import { plain } from "./load.mjs";

export function makeRecord(site, opts = {}){
  const o = { pid: "p", seed: 0, done: true, firsts: 5, finals: 5, first: "pref", final: "first", advice: "mixed", ...opts };
  return plain(site.run(`(() => {
    const o = ${JSON.stringify(o)}, cases = {};
    let x = [...o.pid].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7 + o.seed);
    const rng = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
    const advice = drawAdvice(rng, o.advice === "mixed" ? null : o.advice);
    CASES.forEach((c, i) => {
      if(i >= o.firsts) return;
      const keys = c.decisions.map(d => d.k), ai = advice[c.id];
      const first = {}; keys.forEach(k => { first[k] = o.first === "pref" ? preferredAction(c.id, k) : o.first; });
      const rec = {pos:i+1, errA:0, errB:0, decisionOrder:keys, first, msA:90000,
                   tA:Object.fromEntries(keys.map((k, j) => [k, 1000 * (j + 1)]))};
      if(i < o.finals){
        const final = {}; keys.forEach(k => { final[k] = o.final === "first" ? first[k] : o.final === "ai" ? ai.actions[k] : o.final; });
        Object.assign(rec, {final, msB:60000, conf:3, reason:"", serverCheckpointed:true,
          tB:Object.fromEntries(keys.map((k, j) => [k, 500 * (j + 1)])),
          ai:{actions:ai.actions, why:ai.why, right:ai.right, rightCount:adviceRightCount(c.id, ai.actions),
              score:scorePlan(c.id, ai.actions).total}});
      }
      cases[c.id] = rec;
    });
    return {pid:o.pid, advice, aiRightShare:o.advice === "mixed" ? CONFIG.aiRightShare : (o.advice === "right" ? 1 : 0),
      started:"2026-10-01T10:00:00.000Z",
      bg:o.done ? {programme:"PGP year 1", experience:"None", managed:"No", aiUse:"Daily", undergrad:"Other"} : null,
      caseOrder:CASES.map(c => c.id), order:CASES.map((c, i) => i), at:o.finals, cases, msWelcome:5000, msIntro:20000,
      done:o.done, contact:o.contact ?? null, schemaVersion:o.schema ?? RECORD_SCHEMA, instrument:instrumentMeta(),
      consent:o.consent === undefined ? {version:3, reuseForEvaluation:true} : o.consent,
      saveSeq:1 + o.firsts + o.finals + (o.done ? 1 : 0), saveReason:o.done ? "finish" : "case_complete",
      status:o.done ? "complete" : "in_progress", receivedAt:"2026-10-01T10:30:00.000Z",
      ...(o.done ? {finished:"2026-10-01T10:30:00.000Z", totalMin:o.totalMin ?? 30, msEnd:20000} : {})};
  })()`));
}

/* a record as the earlier pilot (quotas, named delegates) saved it */
export function earlierPilotRecord(pid = "old1", done = true){
  return { pid, version: "A", deferMode: "split", done, saveSeq: 14, status: done ? "complete" : "in_progress",
    order: [0, 1, 2, 3, 4, 5], schemaVersion: 2,
    cases: { 1: { first: { own: "ops", del: { supplier: "arjun", retailer: "priya" }, wait: "marketing", hold: "quality" },
                  final: { own: "ops", del: { supplier: "arjun", retailer: "priya" }, wait: "marketing", hold: "quality" } } } };
}
