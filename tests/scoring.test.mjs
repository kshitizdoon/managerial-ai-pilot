/* Scoring, the key, and the AI-plan manipulation. These pin today's
   values: if one of them fails, the instrument or its scoring changed. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";

const site = loadSite();
const run = src => plain(site.run(src));

/* [caseId, goodVersion, {A:[splitTotal, mergedTotal], B:[...]}] */
const EXPECTED_AI_TOTALS = [
  [1, "A", { A: [100, 100], B: [43.75, 67.5] }],
  [2, "B", { A: [51.25, 80], B: [100, 100] }],
  [3, "A", { A: [100, 100], B: [68.75, 69.16666666666667] }],
  [4, "B", { A: [42.5, 59.166666666666664], B: [100, 100] }],
  [5, "A", { A: [100, 100], B: [46.875, 62.5] }],
  [6, "B", { A: [46.25, 68.33333333333333], B: [100, 100] }]
];
/* split-mode component scores of every weak plan */
const EXPECTED_WEAK_PARTS = {
  1: { own: 45, del: 100, wait: 0, hold: 30, set: 57.5 },
  2: { own: 70, del: 100, wait: 20, hold: 15, set: 70 },
  3: { own: 55, del: 85, wait: 100, hold: 35, set: 67.5 },
  4: { own: 55, del: 60, wait: 45, hold: 10, set: 62.5 },
  5: { own: 55, del: 72.5, wait: 45, hold: 15, set: 60 },
  6: { own: 55, del: 50, wait: 70, hold: 10, set: 100 }
};
/* the AI plans as written in cases.js */
const EXPECTED_AI_PLANS = {
  1: { A: ["ops", { supplier: "arjun", retailer: "priya" }, "marketing", "quality"],
       B: ["retailer", { supplier: "arjun", marketing: "kabir" }, "quality", "ops"] }
};

test("six cases with ids 1-6 and five issues each", () => {
  assert.deepEqual(run("CASES.map(c => c.id)"), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(run("CASES.map(c => c.issues.length)"), [5, 5, 5, 5, 5, 5]);
  assert.deepEqual(run("CASES.map(c => c.people.length)"), [4, 4, 4, 4, 4, 4]);
});

test("AI-plan totals are unchanged in both modes", () => {
  for (const [id, good, totals] of EXPECTED_AI_TOTALS) {
    assert.equal(run(`caseById(${id}).goodVersion`), good, `case ${id} good version`);
    for (const v of ["A", "B"]) {
      const split = run(`scorePlan(${id}, aiPlan(caseById(${id}), "${v}", "split"), "split").total`);
      const merged = run(`scorePlan(${id}, aiPlan(caseById(${id}), "${v}", "merged"), "merged").total`);
      assert.equal(split, totals[v][0], `case ${id} version ${v} split`);
      assert.equal(merged, totals[v][1], `case ${id} version ${v} merged`);
    }
  }
});

test("weak AI plans keep their component scores", () => {
  for (const [id, parts] of Object.entries(EXPECTED_WEAK_PARTS)) {
    const bad = run(`caseById(${id}).goodVersion === "A" ? "B" : "A"`);
    const s = run(`scorePlan(${id}, aiPlan(caseById(${id}), "${bad}", "split"), "split")`);
    for (const k of Object.keys(parts)) assert.equal(s[k], parts[k], `case ${id} ${k}`);
  }
});

test("case 1 AI plans are as written", () => {
  for (const v of ["A", "B"]) {
    const p = run(`aiPlan(caseById(1), "${v}", "split")`);
    const [own, del, wait, hold] = EXPECTED_AI_PLANS[1][v];
    assert.deepEqual([p.own, p.del, p.wait, p.hold], [own, del, wait, hold]);
  }
});

test("no case carries a merged-only AI plan (aiMerged)", () => {
  assert.deepEqual(run("CASES.filter(c => c.aiMerged).map(c => c.id)"), []);
});

test("each version gives exactly three good and three weak AI plans", () => {
  for (const v of ["A", "B"]) {
    const good = run(`CASES.filter(c => aiIsGood(c, "${v}")).length`);
    assert.equal(good, 3, `version ${v}`);
  }
  /* and the two versions are mirror images: every case is good in exactly one */
  assert.deepEqual(run(`CASES.map(c => aiIsGood(c, "A") !== aiIsGood(c, "B"))`), [true, true, true, true, true, true]);
});

test("the good plan beats the weak plan by at least 15 points in both modes", () => {
  for (const mode of ["split", "merged"]) {
    for (const g of run(`aiQualityGaps("${mode}")`)) assert.ok(g.gap >= 15, `case ${g.id} ${mode} gap ${g.gap}`);
  }
});

test("checkKey passes on the shipped instrument in both modes", () => {
  assert.deepEqual(run("checkKey()"), []);
  const s2 = loadSite();
  s2.run('CONFIG.deferMode = "merged"');
  assert.deepEqual(plain(s2.run("checkKey()")), []);
});

test("checkKey reports missing key entries and a weak manipulation", () => {
  const s = loadSite();
  s.run("delete KEY[2].hold.data; delete KEY[3].del.event;");
  const problems = plain(s.run("checkKey()")).join("\n");
  assert.match(problems, /case 2: hold score missing for "data"/);
  assert.match(problems, /case 3: delegate scores missing for "event"/);
  const w = loadSite();
  /* make case 1's weak plan score the same as its good plan */
  w.run(`caseById(1).ai.B = {...caseById(1).ai.A}`);
  assert.match(plain(w.run("checkKey()")).join("\n"), /case 1 \(Launch morning\).*only 0\.0 points apart/);
});

test("key: every issue keys own, wait, hold and all four roster people", () => {
  const gaps = run(`CASES.flatMap(c => c.issues.flatMap(i => {
    const K = KEY[c.id], out = [];
    ["own","wait","hold"].forEach(s => { if(typeof K[s][i.k] !== "number") out.push(c.id+":"+s+":"+i.k); });
    c.people.forEach(p => { if(typeof K.del[i.k][p[0]] !== "number") out.push(c.id+":del:"+i.k+":"+p[0]); });
    return out; }))`);
  assert.deepEqual(gaps, []);
});

test("key: no issue scores 100 on both own and hold", () => {
  assert.deepEqual(run(`CASES.flatMap(c => c.issues.filter(i => KEY[c.id].own[i.k] === 100 && KEY[c.id].hold[i.k] === 100).map(i => c.id + ":" + i.k))`), []);
});

test("key: every score is within 0-100", () => {
  const bad = run(`Object.entries(KEY).flatMap(([id,K]) => [
    ...["own","wait","hold"].flatMap(s => Object.entries(K[s]).filter(([,v]) => v < 0 || v > 100).map(([k]) => id+":"+s+":"+k)),
    ...Object.entries(K.del).flatMap(([i,m]) => Object.entries(m).filter(([,v]) => v < 0 || v > 100).map(([p]) => id+":del:"+i+":"+p))])`);
  assert.deepEqual(bad, []);
});

test("split score is the mean of own, delegate, wait and hold", () => {
  const s = run(`scorePlan(1, {own:"quality", del:{supplier:"meera", ops:"arjun"}, wait:"retailer", hold:"marketing"}, "split")`);
  assert.equal(s.own, 75);
  assert.equal(s.del, (45 + 60) / 2);
  assert.equal(s.wait, 45);
  assert.equal(s.hold, 10);
  assert.equal(s.total, (75 + 52.5 + 45 + 10) / 4);
});

test("merged score uses the better wait/hold split of the pair and leaves the hold pick out", () => {
  const s = run(`scorePlan(1, {own:"ops", del:{supplier:"arjun", retailer:"priya"}, defer:["quality","marketing"], holdPick:null}, "merged")`);
  assert.equal(s.set, 100);
  assert.equal(s.hold, null);
  assert.equal(s.total, 100);
  const h = run(`scorePlan(1, {own:"ops", del:{supplier:"arjun", retailer:"priya"}, defer:["quality","marketing"], holdPick:"marketing"}, "merged")`);
  assert.equal(h.hold, 10);
  assert.equal(h.total, 100, "hold pick is outside the case score by default");
});

test("an unlisted delegate falls back to CONFIG.unlistedDelegateScore (0)", () => {
  assert.equal(run("CONFIG.unlistedDelegateScore"), 0);
  assert.equal(run(`delegateScore(1, "supplier", "nobody")`), 0);
  assert.equal(run(`delegatePart(1, {})`), 0);
});

test("samePlan compares scored parts, not menu labels", () => {
  assert.equal(run(`samePlan(aiPlan(caseById(1),"A","split"), {own:"ops", del:{retailer:"priya", supplier:"arjun"}, wait:"marketing", hold:"quality"}, "split")`), true);
  assert.equal(run(`samePlan(aiPlan(caseById(1),"A","split"), {own:"ops", del:{retailer:"priya", supplier:"arjun"}, wait:"quality", hold:"marketing"}, "split")`), false);
  assert.equal(run(`samePlan({own:"ops", del:{a:"x"}, defer:["m","q"], holdPick:null}, {own:"ops", del:{a:"x"}, defer:["q","m"], holdPick:null}, "merged")`), true);
});
