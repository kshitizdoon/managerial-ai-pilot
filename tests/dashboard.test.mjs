/* Researcher dashboard arithmetic (dashboard.js, stats.js): which
   records reach the statistics, person and decision rows, and the CSV. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";
import { makeRecord, earlierPilotRecord } from "./helpers/records.mjs";

const site = loadSite();
const J = x => JSON.stringify(x);
const rows = recs => plain(site.run(`personRows(${J(recs)})`));

test("only finished records of this instrument with every decision answered enter the statistics", () => {
  const recs = [
    makeRecord(site, { pid: "done6" }),
    makeRecord(site, { pid: "prog6", done: false }),
    makeRecord(site, { pid: "prog2", done: false, firsts: 3, finals: 2 }),
    makeRecord(site, { pid: "bg", done: false, firsts: 0, finals: 0 }),
    makeRecord(site, { pid: "short", firsts: 5, finals: 5 }),
    makeRecord(site, { pid: "nofinal", finals: 5 }),
    earlierPilotRecord("old")
  ];
  assert.deepEqual(rows(recs).map(p => p.pid), ["done6"]);
});

test("a record missing one decision's final answer is not complete", () => {
  const r = makeRecord(site, { pid: "gap" });
  delete r.cases[3].final.career;
  assert.equal(plain(site.run(`recordState(${J(r)})`)), "anomalous");
  assert.deepEqual(rows([r]), []);
});

test("preferred answers everywhere score 100 per caselet; AI levels follow the condition", () => {
  const [p] = rows([makeRecord(site, { pid: "a", condition: 0 })]);
  assert.equal(p.cases.length, 6);
  assert.deepEqual(p.cases.map(c => c.first), [100, 100, 100, 100, 100, 100]);
  assert.deepEqual(p.cases.map(c => c.final), [100, 100, 100, 100, 100, 100]);
  assert.equal(p.mda, 100);
  assert.deepEqual(p.cases.map(c => [c.id, c.level, c.aiScore]),
    [[3, "high", 94], [2, "moderate", 74], [5, "low", 48], [4, "very_low", 22], [1, "high", 94], [6, "moderate", 74]]);
  assert.equal(p.practiceCorrect, true);
  assert.equal(p.totalMin, 30);
});

test("taking all the AI advice moves the final score to the advice score", () => {
  const [p] = rows([makeRecord(site, { pid: "b", condition: 2, first: "own", final: "ai" })]);
  for (const c of p.cases) {
    assert.equal(c.final, c.aiScore);
    assert.equal(c.gain, c.final - c.first);
    for (const d of c.decisions) {
      assert.equal(d.final, d.ai);
      assert.equal(d.tookAI, d.first !== d.ai);
      assert.equal(d.changed, d.first !== d.final);
    }
  }
  /* every Own first answer: Monday scores 15+4+20+20+11 */
  assert.equal(p.cases.find(c => c.id === 3).first, 70);
});

test("decision rows: one per person and decision, with the leave-one-out ability", () => {
  const per = plain(site.run(`personRows(${J([makeRecord(site, { pid: "a" }), makeRecord(site, { pid: "b", first: "wait" })])})`));
  const dr = plain(site.run(`decisionRows(${J(per)}).map(r => [r.p.pid, r.c.id, r.d.k, r.loo])`));
  assert.equal(dr.length, 60);
  assert.ok(dr.filter(r => r[0] === "a").every(r => r[3] === 100));
});

test("CSV: one row per person and decision, with the manual's fields", () => {
  const per = [makeRecord(site, { pid: "a" }), makeRecord(site, { pid: "b", condition: 3 })];
  const csv = plain(site.run(`toCSV(personRows(${J(per)}))`)).split("\n");
  assert.equal(csv.length, 1 + 60);
  const head = csv[0].split(",");
  for (const col of ["pid", "case_id", "decision_id", "first_action", "final_action", "ai_action", "ai_condition", "ai_level",
                     "ai_text", "decision_ms_first", "decision_ms_final", "confidence", "instrument_version", "recorded_key_hash"])
    assert.ok(head.includes(col), "missing column " + col);
  /* a row parses back to the right decision */
  const parse = line => { const out = []; let cur = "", q = false;
    for (const ch of line) { if (q) { if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === ",") { out.push(cur); cur = ""; } else cur += ch; }
    out.push(cur); return out; };
  const row = Object.fromEntries(head.map((h, i) => [h, parse(csv[1])[i]]));
  assert.equal(row.pid, "a");
  assert.equal(row.case_id, "3");
  assert.equal(row.decision_id, "escalation");
  assert.equal(row.first_action, "delegate");
  assert.equal(row.ai_level, "high");
  assert.equal(row.ai_action, "delegate");
  assert.match(row.ai_text, /^Lead has the most direct knowledge/);
  assert.equal(row.first_score, "20");
  assert.equal(row.instrument_version, "survey-2026-10-round2");
});

test("CSV quotes values with commas, quotes and newlines", () => {
  const r = makeRecord(site, { pid: "q" });
  r.cases[3].reason = 'kept, "mostly"\nchanged one';
  const csv = plain(site.run(`toCSV(personRows(${J([r])}))`));
  assert.ok(csv.includes('"kept, ""mostly""\nchanged one"'));
});

test("stats helpers", () => {
  assert.equal(plain(site.run("mean([1,2,3])")), 2);
  assert.equal(plain(site.run("sd([2,4,4,4,5,5,7,9])")).toFixed(4), "2.1381");
  assert.equal(plain(site.run("med([3,1,2,4])")), 2.5);
  assert.equal(plain(site.run("corr([1,2,3],[2,4,6])")), 1);
  const a = plain(site.run("alphaOf([[1,2,3],[2,3,4],[3,4,5],[1,1,2]])"));
  assert.ok(a > 0.9 && a <= 1);
  assert.equal(plain(site.run("nNeeded(5, 10, 0.5)")), Math.ceil(Math.pow(2.802 * 10 / (5 * Math.sqrt(0.5)), 2)));
});
