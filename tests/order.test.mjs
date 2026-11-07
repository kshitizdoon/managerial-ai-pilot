/* Caselet and decision order. Both are randomised per respondent.
   Declared constraints must always hold. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";

const site = loadSite();
const run = src => plain(site.run(src));

test("no order constraints are declared, and the checker is clean", () => {
  assert.deepEqual(run("CASES.map(c => cardEdges(c).length)"), [0, 0, 0, 0, 0]);
  assert.deepEqual(run("caseEdges()"), []);
  assert.deepEqual(run("checkOrderRules()"), []);
});

test("caselet order and decision order are both randomised", () => {
  assert.equal(run("CONFIG.randomiseCaseOrder"), true);
  assert.equal(run("CONFIG.randomiseDecisionOrder"), true);
});

test("decision order is a permutation and every decision reaches every position", () => {
  const res = run(`CASES.map(c => { const seen = {}, orders = {}; let bad = 0;
    for(let t = 0; t < 3000; t++){ const o = decisionOrderFor(c);
      if(o.length !== 4 || new Set(o).size !== 4 || o.some(k => !c.decisions.some(d => d.k === k))) bad++;
      o.forEach((k, i) => { seen[k + ":" + i] = 1; }); orders[o.join()] = 1; }
    return [bad, Object.keys(seen).length, Object.keys(orders).length]; })`);
  assert.deepEqual(res, Array(5).fill([0, 16, 24]));
});

test("caselet order is a permutation and reaches every order position for every caselet", () => {
  const res = run(`(() => { const seen = {}; let bad = 0;
    for(let t = 0; t < 4000; t++){
      const o = caseOrder();
      if(o.length !== 5 || new Set(o).size !== 5 || o.some(i => !CASES[i])) bad++;
      o.forEach((i, pos) => { seen[CASES[i].id + ":" + pos] = 1; });
    }
    return {bad, cells: Object.keys(seen).length}; })()`);
  assert.deepEqual(res, { bad: 0, cells: 25 });
});

test("fixedOrder keeps the declared order and moves only what a constraint needs", () => {
  assert.deepEqual(run(`fixedOrder(["a","b","c","d"], [])`), ["a", "b", "c", "d"]);
  assert.deepEqual(run(`fixedOrder(["a","b","c","d"], [["d","b"]])`), ["a", "c", "d", "b"]);
  assert.deepEqual(run(`fixedOrder(["a","b"], [["a","b"],["b","a"]])`), ["a", "b"]);
});

test("with randomisation on, decision constraints still hold and every valid order appears", () => {
  const s = loadSite();
  s.run(`CONFIG.randomiseDecisionOrder = true; caseById(5).decisions[3].after = ["registration"];`);
  const r = plain(s.run(`(() => { const c = caseById(5), e = cardEdges(c), seen = {}; let broken = 0;
    for(let t = 0; t < 6000; t++){ const o = decisionOrderFor(c); if(!orderHolds(o, e)) broken++; seen[o.join()] = 1; }
    return {broken, distinct: Object.keys(seen).length}; })()`));
  assert.deepEqual(r, { broken: 0, distinct: 12 });
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
  s.run(`caseById(1).decisions[0].after = ["nope"]; caseById(2).decisions[0].after = [caseById(2).decisions[1].k];
         caseById(2).decisions[1].after = [caseById(2).decisions[0].k];`);
  const p = plain(s.run("checkOrderRules()")).join("\n");
  assert.match(p, /case 1: .* must follow "nope"/);
  assert.match(p, /case 2: the card order constraints form a loop/);
});
