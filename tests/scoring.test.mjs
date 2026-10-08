/* The instrument against the 8 October 2026 manual, the key, scoring,
   the AI advice levels and their assignment. If one of these fails, the
   instrument or its scoring changed. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadSite, plain, ROOT } from "./helpers/load.mjs";

const site = loadSite();
const run = src => plain(site.run(src));
/* parsed from Managerial_Decision_Survey_Manual_v3_round2 (tracked changes accepted) */
const MANUAL = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/manual-2026-10-08.json"), "utf8"));
const LEVEL = { high: "high", moderate: "moderate", low: "low", very_low: "very_low" };

test("six caselets in the manual's order, with stable ids", () => {
  assert.deepEqual(run("CASES.map(c => [c.id, c.name])"), [
    [3, "Monday Project Team"], [2, "Strong Employee"], [5, "Fest Week"],
    [4, "Friday Support Team"], [1, "Launch Morning"], [6, "Day Before Travel"]]);
  assert.deepEqual(run("CASES.map(c => c.decisions.length)"), [5, 5, 5, 5, 5, 5]);
});

test("caselet text matches the manual word for word", () => {
  const cases = run("CASES");
  MANUAL.cases.forEach((m, i) => {
    const c = cases[i];
    assert.equal(c.name, m.name);
    assert.equal(c.when, m.when, m.name + " time");
    assert.equal(c.opening, m.opening, m.name + " opening");
    assert.deepEqual(c.decisions.map(d => [d.n, d.t]), m.decisions.map(d => [d.n, d.t]), m.name + " decisions");
  });
});

test("instructions and the four definitions match the manual", () => {
  assert.equal(run("INSTRUCTIONS"), MANUAL.instructions);
  assert.deepEqual(run("ACTIONS.map(a => [a[1], a[3]])"), MANUAL.definitions);
  assert.deepEqual(run("ACTIONS.map(a => a[0])"), ["own", "delegate", "wait", "hold"]);
});

test("key matches the manual for all 30 decisions", () => {
  MANUAL.cases.forEach((m, i) => {
    const id = run(`CASES[${i}].id`);
    const rows = run(`CASES[${i}].decisions.map(d => [d.n, KEY[${id}][d.k], preferredAction(${id}, d.k)])`);
    rows.forEach(([n, k, pref], j) => {
      const want = MANUAL.key[m.name][j];
      assert.equal(n, want.n);
      assert.deepEqual(k, { own: want.own, delegate: want.delegate, wait: want.wait, hold: want.hold }, `${m.name} / ${n}`);
      assert.equal(pref, want.preferred, `${m.name} / ${n} preferred`);
    });
  });
});

test("AI advice matches the manual: action and reason, every level, every decision", () => {
  MANUAL.cases.forEach((m, i) => {
    for (const l of Object.keys(LEVEL)) {
      const got = run(`(() => { const c = CASES[${i}], p = aiPlan(c, "${l}"); return c.decisions.map(d => [d.n, p.actions[d.k], p.why[d.k]]); })()`);
      assert.deepEqual(got, MANUAL.ai[m.name][l].map(x => [x.n, x.action, x.why]), `${m.name} ${l}`);
    }
  });
});

test("AI advice scores 94 / 74 / 48 / 22 with 4 / 3 / 2 / 0 preferred actions in every caselet", () => {
  const got = run(`CASES.map(c => AI_LEVELS.map(l => { const s = scorePlan(c.id, aiPlan(c, l).actions); return [s.total, s.matches]; }))`);
  got.forEach(row => assert.deepEqual(row, [[94, 4], [74, 3], [48, 2], [22, 0]]));
  MANUAL.cases.forEach((m, i) => {
    for (const l of Object.keys(LEVEL)) assert.equal(got[i][Object.keys(LEVEL).indexOf(l)][0], MANUAL.ai[m.name].table[l].score);
  });
});

test("preferred-action distribution is the manual's audit: 8 Own, 9 Delegate, 6 Wait, 7 Hold", () => {
  const counts = run(`CASES.map(c => { const n = {own:0, delegate:0, wait:0, hold:0}; c.decisions.forEach(d => n[preferredAction(c.id, d.k)]++); return n; })`);
  assert.deepEqual(counts.map(n => [n.own, n.delegate, n.wait, n.hold]),
    [[2, 1, 1, 1], [2, 1, 1, 1], [1, 1, 1, 2], [1, 2, 1, 1], [1, 2, 1, 1], [1, 2, 1, 1]]);
});

test("scorePlan sums decision scores; a missing answer scores 0", () => {
  const all = a => run(`(() => { const p = {}; caseById(3).decisions.forEach(d => p[d.k] = "${a}"); return scorePlan(3, p); })()`);
  assert.equal(all("own").total, 15 + 4 + 20 + 20 + 11);
  assert.equal(all("hold").total, 3 + 20 + 3 + 4 + 0);
  assert.deepEqual(all("own").parts, { escalation: 15, expansion: 4, recommendation: 20, recovery: 20, career: 11 });
  assert.equal(all("own").matches, 2);
  assert.equal(run(`scorePlan(3, {escalation:"delegate"}).total`), 20);
  assert.equal(run(`decisionScore(3, "escalation", "nonsense")`), 0);
  const best = run(`(() => { const p = {}; CASES.forEach(c => c.decisions.forEach(d => p[c.id + d.k] = scorePlan(c.id, {[d.k]: preferredAction(c.id, d.k)}).total)); return Object.values(p); })()`);
  assert.ok(best.every(x => x === 20));
});

test("AI assignment: four conditions, every respondent sees all four levels, every caselet every level once", () => {
  const a = run("[0,1,2,3].map(aiAssignment)");
  for (const cond of a) {
    const levels = Object.values(cond);
    assert.equal(levels.length, 6);
    assert.deepEqual([...new Set(levels)].sort(), ["high", "low", "moderate", "very_low"]);
    const n = l => levels.filter(x => x === l).length;
    assert.deepEqual(["high", "moderate", "low", "very_low"].map(n).sort(), [1, 1, 2, 2]);
  }
  for (const id of [1, 2, 3, 4, 5, 6]) assert.deepEqual(a.map(c => c[id]).sort(), ["high", "low", "moderate", "very_low"]);
  assert.equal(run("CONFIG.aiConditions"), 4);
});

test("checkKey passes on the shipped instrument", () => {
  assert.deepEqual(run("checkKey()"), []);
});

test("checkKey catches a broken key or advice", () => {
  const cases = [
    ["KEY[3].escalation.own = 20", /"escalation" must have exactly one action scoring 20/],
    ["KEY[3].escalation.wait = 25", /"escalation" needs four scores from 0 to 20/],
    ["delete KEY[2].funding", /no scores for "funding"/],
    ["KEY[2].extra = {own:1, delegate:1, wait:1, hold:20}", /key scores "extra", which is not a decision/],
    ["delete caseById(5).ai.low", /no low AI advice/],
    ["caseById(5).ai.high.venue = ['own', '']", /high AI advice needs an action and a reason for "venue"/],
    ["caseById(4).ai.moderate = caseById(4).ai.high", /AI advice must get weaker level by level/],
    ["caseById(6).id = 5", /case id 5 is used twice/],
    ["KEY[1].announcement = {own:20, delegate:14, wait:0, hold:4}; KEY[1].trainers = {own:20, delegate:14, wait:0, hold:4}", /3 decisions prefer Own; the design allows at most two/]
  ];
  for (const [mutate, want] of cases) {
    const s = loadSite();
    s.run(mutate);
    assert.match(plain(s.run("checkKey()")).join("\n"), want, mutate);
  }
});

test("practice item expects Wait then Hold", () => {
  assert.deepEqual(run("PRACTICE.items.map(i => i.answer)"), ["wait", "hold"]);
});

test("every caselet has an illustration", () => {
  assert.deepEqual(run("CASES.filter(c => !ART[c.art] || !ART[c.art].startsWith('<svg')).map(c => c.id)"), []);
});
