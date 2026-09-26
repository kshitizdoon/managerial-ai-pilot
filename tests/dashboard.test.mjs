/* Researcher dashboard arithmetic (dashboard.js, stats.js): which
   records reach the statistics, and the analytical CSV. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";
import { makeRecord } from "./helpers/records.mjs";

const site = loadSite();
const rows = recs => plain(site.run(`personRows(${JSON.stringify(recs)})`));

test("only finished records with all six cases enter the statistics", () => {
  const recs = [
    makeRecord(site, { pid: "done6" }),
    makeRecord(site, { pid: "prog6", done: false }),
    makeRecord(site, { pid: "prog2", done: false, firsts: 3, finals: 2 }),
    makeRecord(site, { pid: "bg", done: false, firsts: 0, finals: 0 })
  ];
  assert.deepEqual(rows(recs).map(p => p.pid), ["done6"]);
});

test("a finished record with fewer than six completed cases never enters the statistics", () => {
  assert.deepEqual(rows([makeRecord(site, { pid: "short", firsts: 5, finals: 5 })]), []);
});

test("person rows score first and final plans with the key", () => {
  const [p] = rows([makeRecord(site, { pid: "a", version: "A" })]);
  assert.equal(p.cases.length, 6);
  assert.deepEqual(p.cases.map(c => c.id), [1, 2, 3, 4, 5, 6]);
  /* first plans alternate the B and A AI plans; version A is good on 1, 3, 5 */
  assert.deepEqual(p.cases.map(c => c.good), [true, false, true, false, true, false]);
  const expectFirst = plain(site.run(`CASES.map((c,i) => scorePlan(c.id, aiPlan(c, i % 2 ? "A" : "B", "split"), "split").total)`));
  assert.deepEqual(p.cases.map(c => c.first), expectFirst);
  assert.deepEqual(p.cases.map(c => c.final), expectFirst, "kept plans score the same");
  assert.equal(p.mda, expectFirst.reduce((a, b) => a + b) / 6);
  assert.equal(p.totalMin, 20);
});

test("CSV has one row per person and case, with a fixed header", () => {
  const per = [makeRecord(site, { pid: "a" }), makeRecord(site, { pid: "b", version: "B" })];
  const csv = plain(site.run(`toCSV(personRows(${JSON.stringify(per)}))`)).split("\n");
  assert.equal(csv.length, 1 + 12);
  assert.deepEqual(csv[0].split(",").slice(0, 16), ["pid", "version", "defer_mode", "programme", "experience", "managed",
    "ai_use", "undergrad", "cat", "case_id", "case_name", "position", "ai_quality", "first_score", "final_score", "ai_plan_score"]);
  assert.ok(csv.slice(1).every(l => l.startsWith("a,") || l.startsWith("b,")));
});

test("CSV quotes values with commas and quotes", () => {
  const r = makeRecord(site, { pid: "q" });
  r.bg.programme = 'PGP, "year" 1';
  const line = plain(site.run(`toCSV(personRows(${JSON.stringify([r])}))`)).split("\n")[1];
  assert.ok(line.includes('"PGP, ""year"" 1"'));
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
