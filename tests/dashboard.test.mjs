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
    makeRecord(site, { pid: "done5" }),
    makeRecord(site, { pid: "prog5", done: false }),
    makeRecord(site, { pid: "prog2", done: false, firsts: 3, finals: 2 }),
    makeRecord(site, { pid: "start", done: false, firsts: 0, finals: 0 }),
    makeRecord(site, { pid: "short", firsts: 4, finals: 4 }),
    makeRecord(site, { pid: "nofinal", finals: 4 }),
    makeRecord(site, { pid: "six", schema: 3 }),
    earlierPilotRecord("old")
  ];
  assert.deepEqual(rows(recs).map(p => p.pid), ["done5"]);
});

test("a record missing one decision's final answer is not complete", () => {
  const r = makeRecord(site, { pid: "gap" });
  delete r.cases[3].final.career;
  assert.equal(plain(site.run(`recordState(${J(r)})`)), "anomalous");
  assert.deepEqual(rows([r]), []);
});

test("preferred answers everywhere score 100 per caselet; advice is right on exactly half the decisions", () => {
  const rec = makeRecord(site, { pid: "a" });
  const [p] = rows([rec]);
  assert.equal(p.cases.length, 5);
  assert.deepEqual(p.cases.map(c => c.first), [100, 100, 100, 100, 100]);
  assert.deepEqual(p.cases.map(c => c.final), [100, 100, 100, 100, 100]);
  assert.equal(p.mda, 100);
  const ds = [].concat(...p.cases.map(c => c.decisions));
  assert.equal(ds.filter(d => d.aiRight).length, 10);
  for (const c of p.cases) {
    assert.equal(c.aiRight, c.decisions.filter(d => d.aiRight).length);
    assert.equal(c.aiScore, rec.cases[c.id].ai.score);
    for (const d of c.decisions) assert.equal(d.aiRight, rec.cases[c.id].ai.right[d.k]);
  }
  /* all right and all wrong */
  const [r] = rows([makeRecord(site, { pid: "r", advice: "right" })]);
  assert.deepEqual(r.cases.map(c => [c.aiRight, c.aiScore]), Array(5).fill([4, 100]));
  const [w] = rows([makeRecord(site, { pid: "w", advice: "wrong" })]);
  assert.ok(w.cases.every(c => c.aiRight === 0 && c.aiScore < 100));
  assert.equal(p.totalMin, 30);
});

test("records from the four-level design are read from their stored advice", () => {
  const rec = makeRecord(site, { pid: "old4" });
  for (const id of Object.keys(rec.cases)) { delete rec.cases[id].ai.right; delete rec.cases[id].ai.rightCount; rec.cases[id].ai.level = "high"; }
  delete rec.advice; rec.aiCondition = 1;
  const [p] = rows([rec]);
  assert.equal([].concat(...p.cases.map(c => c.decisions)).filter(d => d.aiRight).length, 10);
  assert.equal(p.cases[0].level, "high");
  assert.equal(p.condition, 1);
});

test("taking all the AI advice moves the final score to the advice score", () => {
  const [p] = rows([makeRecord(site, { pid: "b", first: "own", final: "ai" })]);
  for (const c of p.cases) {
    assert.equal(c.final, c.aiScore);
    assert.equal(c.gain, c.final - c.first);
    for (const d of c.decisions) {
      assert.equal(d.final, d.ai);
      assert.equal(d.tookAI, d.first !== d.ai);
      assert.equal(d.changed, d.first !== d.final);
      assert.equal(d.gain, d.finalScore - d.firstScore);
    }
  }
  /* every Own first answer: Monday scores 4+20+20+11 out of 80 */
  assert.equal(p.cases.find(c => c.id === 3).first, 68.75);
});

test("decision rows: one per person and decision, with the leave-one-out ability", () => {
  const per = plain(site.run(`personRows(${J([makeRecord(site, { pid: "a" }), makeRecord(site, { pid: "b", first: "wait" })])})`));
  const dr = plain(site.run(`decisionRows(${J(per)}).map(r => [r.p.pid, r.c.id, r.d.k, r.loo])`));
  assert.equal(dr.length, 40);
  assert.ok(dr.filter(r => r[0] === "a").every(r => r[3] === 100));
});

test("CSV: one row per person and decision, with the manual's fields", () => {
  const per = [makeRecord(site, { pid: "a", advice: "right" }), makeRecord(site, { pid: "b" })];
  const csv = plain(site.run(`toCSV(personRows(${J(per)}))`)).split("\n");
  assert.equal(csv.length, 1 + 40);
  const head = csv[0].split(",");
  for (const col of ["pid", "case_id", "decision_id", "first_action", "final_action", "ai_action", "ai_right", "ai_condition", "ai_level", "case_ai_right",
                     "ai_text", "decision_ms_first", "decision_ms_final", "confidence", "instrument_version", "recorded_key_hash"])
    assert.ok(head.includes(col), "missing column " + col);
  /* a row parses back to the right decision */
  const parse = line => { const out = []; let cur = "", q = false;
    for (const ch of line) { if (q) { if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === ",") { out.push(cur); cur = ""; } else cur += ch; }
    out.push(cur); return out; };
  const row = Object.fromEntries(head.map((h, i) => [h, parse(csv[1])[i]]));
  assert.equal(row.pid, "a");
  assert.equal(row.case_id, "3");
  assert.equal(row.decision_id, "expansion");
  assert.equal(row.first_action, "hold");
  assert.equal(row.ai_right, "1");
  assert.equal(row.ai_level, "");
  assert.equal(row.case_ai_right, "4");
  assert.equal(row.ai_action, "hold");
  assert.match(row.ai_text, /^A binding scope and timeline promise/);
  assert.equal(row.first_score, "20");
  assert.equal(row.instrument_version, "survey-2026-11-5x4-r50");
  assert.ok(!head.includes("attention_check_passed") && !head.includes("cat"), "no columns for removed questions");
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
