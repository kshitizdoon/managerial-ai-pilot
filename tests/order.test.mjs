/* Case and card chronology. The declared constraints must always hold,
   every order that satisfies them must be reachable, and nothing else
   about the randomisation may change. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";

const site = loadSite();
const run = src => plain(site.run(src));

test("declared card constraints are exactly the three anaphora pairs", () => {
  assert.deepEqual(run("CASES.map(c => [c.id, cardEdges(c)])"), [
    [1, []], [2, []], [3, []],
    [4, [["complaint", "warning"]]],
    [5, [["drop", "diagnosis"], ["drop", "coordinator"]]],
    [6, []]
  ]);
  assert.deepEqual(run("caseEdges()"), [], "no case-level constraints");
  assert.deepEqual(run("checkOrderRules()"), []);
});

test("randomisation flags are on", () => {
  assert.equal(run("CONFIG.randomiseCaseOrder"), true);
  assert.equal(run("CONFIG.randomiseCardOrder"), true);
});

test("card orders always satisfy constraints and reach every valid order", () => {
  const N = 6000;
  const res = run(`CASES.map(c => {
    const keys = c.issues.map(i => i.k), e = cardEdges(c), seen = {};
    let broken = 0;
    for(let t = 0; t < ${N}; t++){
      const o = cardOrderFor(c);
      if(!orderHolds(o, e) || o.length !== 5 || new Set(o).size !== 5) broken++;
      seen[o.join()] = (seen[o.join()] || 0) + 1;
    }
    return {id: c.id, broken, distinct: Object.keys(seen).length, min: Math.min(...Object.values(seen))};
  })`);
  const expected = { 1: 120, 2: 120, 3: 120, 4: 60, 5: 40, 6: 120 };
  for (const r of res) {
    assert.equal(r.broken, 0, `case ${r.id} broke a constraint`);
    assert.equal(r.distinct, expected[r.id], `case ${r.id} distinct orders`);
    /* uniform: expected count per order is N/distinct; a missing tail would show as ~0 */
    assert.ok(r.min > (N / expected[r.id]) * 0.4, `case ${r.id} looks non-uniform (min ${r.min})`);
  }
});

test("case order is a permutation of all six cases and reaches every position", () => {
  const res = run(`(() => { const firsts = {}, lasts = {}; let bad = 0;
    for(let t = 0; t < 3000; t++){
      const o = caseOrder();
      if(o.length !== 6 || new Set(o).size !== 6 || o.some(i => !CASES[i])) bad++;
      firsts[o[0]] = 1; lasts[o[5]] = 1;
    }
    return {bad, firsts: Object.keys(firsts).length, lasts: Object.keys(lasts).length}; })()`);
  assert.deepEqual(res, { bad: 0, firsts: 6, lasts: 6 });
});

test("with a case constraint declared, the case order respects it", () => {
  const s = loadSite();
  s.run("CASE_AFTER[3] = [5]");
  const ok = plain(s.run(`(() => { for(let t = 0; t < 500; t++){ const ids = caseOrder().map(i => CASES[i].id);
    if(ids.indexOf(5) > ids.indexOf(3)) return false; } return true; })()`));
  assert.equal(ok, true);
});

test("order rule checker catches loops and unknown keys", () => {
  const s = loadSite();
  s.run(`caseById(1).issues[0].after = ["nope"]; caseById(2).issues[0].after = [caseById(2).issues[1].k];
         caseById(2).issues[1].after = [caseById(2).issues[0].k];`);
  const p = plain(s.run("checkOrderRules()")).join("\n");
  assert.match(p, /case 1: .* must follow "nope"/);
  assert.match(p, /case 2: the card order constraints form a loop/);
});
