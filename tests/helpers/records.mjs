/* Builds response records shaped like the ones survey.js saves, for
   dashboard and export tests. Plans are real, valid plans for each case. */
import { plain } from "./load.mjs";

/* opts: pid, version, done, firsts (how many cases have a first plan),
   finals (how many have a final plan), mode */
export function makeRecord(site, opts = {}){
  const o = { pid: "p", version: "A", done: true, firsts: 6, finals: 6, mode: "split", ...opts };
  return plain(site.run(`(() => {
    const o = ${JSON.stringify(o)}, cases = {};
    CASES.forEach((c, i) => {
      if(i >= o.firsts) return;
      const ai = aiPlan(c, i % 2 ? "A" : "B", o.mode);   // a mix of good and weak plans as first plans
      const first = {own:ai.own, del:{...ai.del}, wait:ai.wait, hold:ai.hold, defer:[], holdPick:null};
      const rec = {pos:i+1, errA:0, errC:0, cardOrder:c.issues.map(x => x.k), seen:true,
                   first, conf1:3, msIntro:1000, msA:60000};
      if(i < o.finals){ rec.menu = "keep"; rec.final = first; rec.msB = 20000; rec.serverCheckpointed = true; }
      cases[c.id] = rec;
    });
    return {pid:o.pid, version:o.version, deferMode:o.mode, started:"2026-09-01T10:00:00.000Z",
      bg:{programme:"PGP year 1", experience:"None", managed:"No", aiUse:"Daily", undergrad:"Other"},
      order:[0,1,2,3,4,5], at:o.finals, cases, msBg:5000, done:o.done, contact:null,
      saveSeq:1 + o.firsts + o.finals + (o.done ? 1 : 0), saveReason:o.done ? "finish" : "case_" + o.finals + "_complete",
      status:o.done ? "complete" : "in_progress", receivedAt:"2026-09-01T10:20:00.000Z",
      ...(o.done ? {finished:"2026-09-01T10:20:00.000Z", totalMin:20,
        end:{aiHelp:"No", compare:"About the same", guess:"", cat:null},
        pilot:{hardest:"None stood out", waitHold:"Clear", obvious:"", ruleBind:"", length:"About right", other:""}} : {})};
  })()`));
}
