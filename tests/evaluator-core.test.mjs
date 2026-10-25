/* The Evaluator stage's selection rules (netlify/lib/eval-core.mjs):
   who is eligible, what ability they are scored at, how three targets
   and three conditions are chosen and balanced, and what the browser
   may see. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";
import { makeRecord, earlierPilotRecord } from "./helpers/records.mjs";
import * as core from "../netlify/lib/eval-core.mjs";

const site = loadSite();
const S = { enabled: true, minMinutes: 5, requireAttention: false, includeLegacyConsent: false, minTargets: 3 };
const FIRSTS = ["pref", "own", "delegate", "wait", "hold"];

/* a seeded random number generator, so assignments are reproducible */
function rng(seed = 1){ let x = seed; return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }

/* n eligible Producers with different abilities (different first answers) */
function pool(n, extra = {}){
  return Array.from({ length: n }, (_, i) => makeRecord(site, { pid: "prod" + i, condition: i % 4, first: FIRSTS[i % FIRSTS.length], final: i % 2 ? "ai" : "first", ...extra }));
}

test("pre-AI ability matches the dashboard's scoring, with and without the shown caselet", () => {
  for (const first of FIRSTS) {
    const r = makeRecord(site, { pid: "x", first });
    const per = plain(site.run(`personRows(${JSON.stringify([r])})`))[0];
    assert.equal(core.mda(r), per.mda, first);
    for (const c of per.cases) {
      assert.equal(core.caseFirstScore(r, c.id), c.first);
      const others = per.cases.filter(x => x.id !== c.id).map(x => x.first);
      assert.equal(core.mdaLoo(r, c.id), others.reduce((a, b) => a + b, 0) / 5);
    }
  }
  assert.equal(core.mda(makeRecord(site, { pid: "p", first: "pref" })), 100);
});

test("eligibility: only complete, valid, consented, unhurried records of this instrument; the attention check is not required", () => {
  const ok = makeRecord(site, { pid: "ok" });
  const cases = [
    [ok, true, undefined],
    [makeRecord(site, { pid: "prog", done: false }), false, "not_complete"],
    [makeRecord(site, { pid: "short", firsts: 5, finals: 5 }), false, "not_complete"],
    [earlierPilotRecord("old"), false, "earlier_instrument"],
    [makeRecord(site, { pid: "fast", totalMin: 4.9 }), false, "too_fast"],
    [makeRecord(site, { pid: "edge", totalMin: 5 }), true, undefined],
    [makeRecord(site, { pid: "inattentive", attention: false }), true, undefined],
    [makeRecord(site, { pid: "noconsent", consent: null }), false, "no_reuse_consent"],
    [makeRecord(site, { pid: "v1consent", consent: { version: 1, reuseForEvaluation: true } }), false, "no_reuse_consent"]
  ];
  for (const [r, want, reason] of cases) {
    const e = core.eligibility(r, S, null);
    assert.equal(e.ok, want, r.pid);
    assert.equal(e.reason, reason, r.pid);
  }
  const noAi = makeRecord(site, { pid: "noai" }); delete noAi.cases[3].ai;
  assert.equal(core.eligibility(noAi, S, null).reason, "no_ai_record");
  assert.equal(core.eligibility(ok, S, "ok").reason, "self", "never one's own record");
  assert.equal(core.eligibility(makeRecord(site, { pid: "nc", consent: null }), { ...S, includeLegacyConsent: true }, null).ok, true, "researcher can admit earlier consent");
  assert.equal(core.eligibility(makeRecord(site, { pid: "ia", attention: false }), { ...S, requireAttention: true }, null).reason, "failed_attention", "only if the researcher switches it on");
});

test("settings come from environment variables, off by default", () => {
  assert.deepEqual(core.settings({}), { enabled: false, minMinutes: 5, requireAttention: false, includeLegacyConsent: false, minTargets: 3 });
  assert.deepEqual(core.settings({ EVALUATOR_ENABLED: "1", EVALUATOR_MIN_PRODUCER_MINUTES: "8", EVALUATOR_REQUIRE_ATTENTION: "1",
    EVALUATOR_INCLUDE_LEGACY_CONSENT: "true", EVALUATOR_MIN_TARGETS: "12" }),
    { enabled: true, minMinutes: 8, requireAttention: true, includeLegacyConsent: true, minTargets: 12 });
  assert.equal(core.settings({ EVALUATOR_MIN_TARGETS: "1" }).minTargets, 3, "never fewer than three");
});

test("too few eligible records: nothing is made up", () => {
  const recs = [...pool(2), makeRecord(site, { pid: "fast", totalMin: 1 }), makeRecord(site, { pid: "prog", done: false })];
  const r = core.chooseAssignment(recs, [], "me", S, rng());
  assert.deepEqual(r, { notEnough: { eligible: 2, needed: 3 } });
  assert.equal(r.assignment, undefined);
  /* the evaluator's own record does not count towards the pool */
  const three = pool(3);
  assert.ok(core.chooseAssignment(three, [], "outsider", S, rng()).assignment);
  assert.ok(core.chooseAssignment(three, [], "prod0", S, rng()).notEnough);
});

test("an assignment: one caselet, three of its decisions, three different real people, A, B and C once each", () => {
  const recs = pool(9);
  const { assignment: a } = core.chooseAssignment(recs, [], "evaluator1", S, rng(7));
  assert.ok(Object.keys(core.triples(a.caseId).reduce((m, t) => (m[t.join()] = 1, m), {})).includes(a.decisionIds.join()));
  assert.equal(a.slots.length, 3);
  assert.deepEqual(a.slots.map(s => s.condition).sort(), ["A", "B", "C"]);
  assert.deepEqual(a.slots.map(s => s.position), [1, 2, 3]);
  assert.deepEqual(a.slots.map(s => s.condition), a.order);
  assert.deepEqual(a.slots.map(s => s.stratum).sort(), ["high", "low", "middle"]);
  assert.equal(new Set(a.slots.map(s => s.target.pid)).size, 3, "three different people");
  assert.ok(a.slots.every(s => s.target.pid !== "evaluator1"));
  assert.equal(new Set(a.slots.map(s => s.token)).size, 3);
  /* the high third is no lower in leave-one-out ability than the low third */
  const by = Object.fromEntries(a.slots.map(s => [s.stratum, s.target.mdaLoo]));
  assert.ok(by.high >= by.middle && by.middle >= by.low);
});

test("what is shown is copied from the target's own record, decision by decision", () => {
  const recs = pool(9);
  for (let seed = 1; seed <= 20; seed++) {
    const { assignment: a } = core.chooseAssignment(recs, [], "ev" + seed, S, rng(seed));
    for (const s of a.slots) {
      const rec = recs.find(r => r.pid === s.target.pid).cases[a.caseId];
      assert.deepEqual(s.display.decisions.map(d => d.k), a.decisionIds);
      for (const d of s.display.decisions) {
        assert.equal(d.final, rec.final[d.k]);
        if (s.condition === "A") assert.deepEqual(Object.keys(d).sort(), ["final", "k"]);
        if (s.condition === "B") { assert.deepEqual(Object.keys(d).sort(), ["ai", "final", "k"]); }
        if (s.condition === "C") { assert.deepEqual(Object.keys(d).sort(), ["ai", "final", "first", "k"]); assert.equal(d.first, rec.first[d.k]); }
        if (d.ai) assert.deepEqual(d.ai, { action: rec.ai.actions[d.k], why: rec.ai.why[d.k] }, "exact advice the target saw");
      }
      assert.equal(s.target.aiLevel, rec.ai.level);
      assert.equal(s.target.mda, core.mda(recs.find(r => r.pid === s.target.pid)));
    }
  }
});

test("the browser's view holds no identity, ability, advice level or condition label", () => {
  const recs = pool(6, { contact: { name: "Asha Rao", mobile: "9876543210" } });
  const { assignment: a } = core.chooseAssignment(recs, [], "ev", S, rng(3));
  const view = core.clientView(a);
  const text = JSON.stringify(view);
  for (const bad of ["Asha", "9876543210", "prod", "PGP", "programme", "evaluator1", "ev\""])
    assert.ok(!text.includes(bad), "client view leaks " + bad);
  /* no field anywhere in it names a person, a score, a level or a condition */
  const keys = new Set();
  (function walk(x){ if (x && typeof x === "object") Object.entries(x).forEach(([k, v]) => { keys.add(k); walk(v); }); })(view);
  for (const bad of ["pid", "target", "mda", "mdaLoo", "stratum", "condition", "aiLevel", "level", "score", "evaluatorPid", "contact", "bg"])
    assert.ok(!keys.has(bad), "client view has a field " + bad);
  assert.deepEqual(Object.keys(view).sort(), ["assignmentId", "caseId", "decisionIds", "items"]);
  assert.ok(view.items.every(i => Object.keys(i).sort().join() === "decisions,position,token"));
});

test("balance over evaluators: conditions by ability third, orders, caselets, triples, target exposure", () => {
  const recs = pool(12);
  const prior = [];
  for (let i = 0; i < 60; i++) prior.push(core.chooseAssignment(recs, prior, "ev" + i, S, rng(i + 11)).assignment);
  const count = f => prior.reduce((m, a) => { [].concat(f(a)).forEach(k => m[k] = (m[k] || 0) + 1); return m; }, {});
  /* each condition meets each ability third exactly 20 times in 60 */
  const cs = count(a => a.slots.map(s => s.condition + ":" + s.stratum));
  assert.deepEqual(Object.values(cs), Array(9).fill(20));
  assert.deepEqual(Object.values(count(a => a.orderIndex)), Array(6).fill(10), "orders");
  assert.deepEqual(Object.values(count(a => a.caseId)), Array(6).fill(10), "caselets");
  const tr = Object.values(count(a => a.caseId + ":" + a.decisionIds.join()));
  assert.ok(Math.max(...tr) - Math.min(...tr) <= 1, "decision triples within one of each other");
  const exposure = Object.values(count(a => a.slots.map(s => s.target.pid)));
  assert.ok(Math.max(...exposure) - Math.min(...exposure) <= 6, "no target shown far more than another: " + exposure);
  /* every condition appears exactly once per evaluator, and every position too */
  assert.ok(prior.every(a => a.slots.map(s => s.condition).sort().join() === "A,B,C"));
});

test("evaluator records are checked against their assignment", () => {
  const { assignment: a } = core.chooseAssignment(pool(6), [], "ev", S, rng(5));
  const [t1, t2, t3] = a.slots.map(s => s.token);
  const ok = core.cleanEvaluation({ pid: "ev", assignmentId: a.id, items: { [t1]: { rating: 70, conf: 4, why: "x", ms: 1000 } }, saveSeq: 2, junk: "dropped" }, a);
  assert.equal(ok.record.items[t1].rating, 70);
  assert.equal(ok.record.junk, undefined);
  assert.equal(core.cleanEvaluation({ pid: "ev", assignmentId: "other", items: {} }, a).error, "assignment mismatch");
  assert.equal(core.cleanEvaluation({ pid: "ev", assignmentId: a.id, items: { tFAKE: { rating: 1, conf: 1 } } }, a).error, "unknown item");
  assert.match(core.cleanEvaluation({ pid: "ev", assignmentId: a.id, items: { [t1]: { rating: 101, conf: 1 } } }, a).error, /0 to 100/);
  assert.match(core.cleanEvaluation({ pid: "ev", assignmentId: a.id, items: { [t1]: { rating: 50.5, conf: 1 } } }, a).error, /whole number/);
  assert.match(core.cleanEvaluation({ pid: "ev", assignmentId: a.id, items: { [t1]: { rating: 50, conf: 6 } } }, a).error, /1 to 5/);
  assert.match(core.cleanEvaluation({ pid: "ev", assignmentId: a.id, done: true, items: { [t1]: { rating: 50, conf: 3 } } }, a).error, /finished evaluation needs/);
  const full = { [t1]: { rating: 50, conf: 3 }, [t2]: { rating: 0, conf: 1 }, [t3]: { rating: 100, conf: 5 } };
  const done = core.cleanEvaluation({ pid: "ev", assignmentId: a.id, done: true, items: full }, a).record;
  assert.equal(core.evaluationState(done, a), "complete");
  assert.equal(core.evaluationState({ ...done, done: false }, a), "in_progress");
  assert.equal(core.evaluationState({ ...done, items: { [t1]: full[t1] } }, a), "anomalous");
});

test("dashboard: only complete evaluations become ratings; stats per condition", () => {
  const recs = pool(9);
  const prior = [];
  const evs = [];
  for (let i = 0; i < 4; i++) {
    const a = core.chooseAssignment(recs, prior, "ev" + i, S, rng(i + 3)).assignment; prior.push(a);
    const items = Object.fromEntries(a.slots.map((s, j) => [s.token, { rating: 20 + 30 * j, conf: 3, ms: 30000 }]));
    if (i === 2) delete items[a.slots[2].token];                 // marked finished, but one person unrated
    evs.push({ pid: "ev" + i, assignmentId: a.id, done: i !== 3, items, totalMin: 4 });   // ev3 still in progress
  }
  const ev = { ok: true, settings: { enabled: true }, pool: null, assignments: prior, evaluations: evs };
  const rows = plain(site.run(`evaluatorRows(${JSON.stringify(ev)})`));
  assert.equal(rows.length, 6, "two complete evaluators, three ratings each");
  assert.deepEqual([...new Set(rows.map(r => r.evaluatorPid))].sort(), ["ev0", "ev1"]);
  assert.deepEqual(plain(site.run(`evaluationState(${JSON.stringify(evs[2])}, ${JSON.stringify(prior[2])})`)), "anomalous");
  assert.deepEqual(plain(site.run(`evaluationState(${JSON.stringify(evs[3])}, ${JSON.stringify(prior[3])})`)), "in_progress");
  /* each row carries the target's ability from the assignment, not from the browser */
  rows.forEach(r => { const s = prior.find(a => a.id === r.assignmentId).slots.find(x => x.condition === r.condition);
    assert.equal(r.mdaLoo, s.target.mdaLoo); assert.equal(r.targetPid, s.target.pid); });
  const stats = plain(site.run(`evaluatorStats(${JSON.stringify(rows)})`));
  assert.deepEqual(stats.map(x => [x.cond, x.n]), [["A", 2], ["B", 2], ["C", 2]]);
  const csv = plain(site.run(`toEvaluatorCSV(evaluatorRows(${JSON.stringify(ev)}))`)).split("\n");
  assert.equal(csv.length, 7);
  const html = plain(site.run(`evaluatorSection(${JSON.stringify(ev)})`));
  assert.match(html, /2 completed evaluators; 2 unfinished/);
  assert.match(html, /marked finished, but incomplete/);
});
