/* The instrument against the 8 October 2026 manual, the key, scoring,
   the AI advice levels and their assignment. If one of these fails, the
   instrument or its scoring changed. Since November 2026 the survey uses
   five of the manual's six caselets and four of each one's five
   decisions (KEPT), and moves some AI actions (ADVICE_CHANGES). */
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
/* the manual's caselets and decisions the survey keeps, by title */
const KEPT = {
  "Monday Project Team": ["Project expansion", "Revised recommendation", "Delivery recovery", "Performance discussion"],
  "Strong Employee": ["Client presentation", "Financial commitment", "Partner request", "Performance review"],
  "Fest Week": ["Registration strategy", "Sponsor negotiation", "Venue commitment", "Festival programming"],
  "Friday Support Team": ["Customer escalation", "Service commitment", "Process improvement", "Client recovery plan"],
  "Launch Morning": ["Corporate membership", "Opening announcement", "Opening readiness", "Customer experience"]
};
/* the manual, cut down to what the survey keeps; j indexes the kept decisions */
const KEPT_CASES = MANUAL.cases.filter(m => KEPT[m.name]).map(m => ({ ...m, decisions: m.decisions.filter(d => KEPT[m.name].includes(d.n)) }));
const keptKey = name => MANUAL.key[name].filter(d => KEPT[name].includes(d.n));
const keptAI = (name, l) => MANUAL.ai[name][l].filter(d => KEPT[name].includes(d.n));
/* AI actions moved in November 2026 so every caselet scores the same at each level */
const ADVICE_CHANGES = {
  "Fest Week/low/Registration strategy": "hold",
  "Launch Morning/moderate/Corporate membership": "delegate",
  "Launch Morning/moderate/Customer experience": "wait",
  "Launch Morning/low/Customer experience": "wait",
  "Monday Project Team/very_low/Revised recommendation": "delegate",
  "Monday Project Team/very_low/Delivery recovery": "hold",
  "Fest Week/very_low/Sponsor negotiation": "own",
  "Fest Week/very_low/Festival programming": "hold",
  "Friday Support Team/very_low/Customer escalation": "hold",
  "Friday Support Team/very_low/Process improvement": "hold",
  "Friday Support Team/very_low/Client recovery plan": "own"
};
/* the only places the text may differ from the manual (pilot feedback, 22 October 2026) */
const TEXT_CHANGES = { "Launch Morning/Opening readiness":
  ["the advertised class schedule.", "the group exercise classes advertised for this afternoon."] };
/* the manual's four generic reasons, which gave weak advice away */
const GENERIC = [
  "The potential consequences justify direct managerial involvement despite competing demands.",
  "A capable lead can take responsibility while the manager preserves attention for other commitments.",
  "The manager can revisit this decision after addressing more immediate matters.",
  "A further check would reduce the risk of committing too early."];

test("five caselets in the manual's order, with stable ids, four decisions each", () => {
  assert.deepEqual(run("CASES.map(c => [c.id, c.name])"), [
    [3, "Monday Project Team"], [2, "Strong Employee"], [5, "Fest Week"],
    [4, "Friday Support Team"], [1, "Launch Morning"]]);
  assert.deepEqual(run("CASES.map(c => c.decisions.length)"), [4, 4, 4, 4, 4]);
  assert.deepEqual(run("CASES.map(c => c.decisions.map(d => d.n))"), Object.values(KEPT));
});

test("caselet text matches the manual word for word, apart from the declared changes", () => {
  const cases = run("CASES");
  KEPT_CASES.forEach((m, i) => {
    const c = cases[i];
    assert.equal(c.name, m.name);
    assert.equal(c.when, m.when, m.name + " time");
    assert.equal(c.opening, m.opening, m.name + " opening");
    const want = m.decisions.map(d => {
      const ch = TEXT_CHANGES[m.name + "/" + d.n];
      return [d.n, ch ? d.t.replace(ch[0], ch[1]) : d.t];
    });
    assert.deepEqual(c.decisions.map(d => [d.n, d.t]), want, m.name + " decisions");
  });
  assert.match(run(`caseById(1).decisions.find(d => d.k === "readiness").t`), /group exercise classes advertised for this afternoon\.$/);
  assert.doesNotMatch(JSON.stringify(cases), /class schedule/);
});

test("every decision says what is to be decided", () => {
  const qs = run("CASES.flatMap(c => c.decisions.map(d => d.q))");
  assert.equal(qs.length, 20);
  assert.ok(qs.every(q => typeof q === "string" && q.length > 15 && /\.$/.test(q) && q[0] === q[0].toLowerCase()), "lower-case clauses ending in a full stop");
  assert.equal(new Set(qs).size, 20, "each one is different");
  assert.equal(run(`caseById(1).decisions.find(d => d.k === "readiness").q`), "whether to confirm the noon opening and this afternoon's classes as planned.");
  /* no label words that would point at an answer */
  assert.ok(qs.every(q => !/\b(own|delegate|wait|hold|urgent|later)\b/i.test(q)), "no action words in the questions");
});

test("every caselet shows two or three key numbers, Fest Week as asked", () => {
  const f = run("CASES.map(c => [c.name, c.facts])");
  f.forEach(([n, facts]) => assert.ok(facts.length >= 2 && facts.length <= 3, n));
  assert.deepEqual(f.find(x => x[0] === "Fest Week")[1],
    [["3 weeks", "festival opens"], ["Next week", "registrations close"], ["3 hours", "available today for involvement"]]);
});

test("shorter instructions; the four definitions match the manual", () => {
  const ins = run("INSTRUCTIONS");
  assert.ok(ins.length < MANUAL.instructions.length * 0.6, "much shorter than the manual's");
  assert.match(ins, /choose Own/);
  assert.match(ins, /Choose Delegate only if a team member should make the decision instead of you/);
  assert.deepEqual(run("ACTIONS.map(a => [a[1], a[3]])"), MANUAL.definitions);
  assert.deepEqual(run("ACTIONS.map(a => a[0])"), ["own", "delegate", "wait", "hold"]);
});

test("key matches the manual for all 20 kept decisions", () => {
  KEPT_CASES.forEach((m, i) => {
    const id = run(`CASES[${i}].id`);
    const rows = run(`CASES[${i}].decisions.map(d => [d.n, KEY[${id}][d.k], preferredAction(${id}, d.k)])`);
    assert.deepEqual(run(`Object.keys(KEY[${id}])`), run(`CASES[${i}].decisions.map(d => d.k)`), m.name + ": the key scores only the kept decisions");
    rows.forEach(([n, k, pref], j) => {
      const want = keptKey(m.name)[j];
      assert.equal(n, want.n);
      assert.deepEqual(k, { own: want.own, delegate: want.delegate, wait: want.wait, hold: want.hold }, `${m.name} / ${n}`);
      assert.equal(pref, want.preferred, `${m.name} / ${n} preferred`);
    });
  });
});

test("AI advice: the manual's action except the declared moves, and its reason wherever the action is the preferred one", () => {
  let moved = 0;
  KEPT_CASES.forEach((m, i) => {
    for (const l of Object.keys(LEVEL)) {
      const got = run(`(() => { const c = CASES[${i}], p = aiPlan(c, "${l}"); return c.decisions.map(d => [d.n, p.actions[d.k], p.why[d.k]]); })()`);
      keptAI(m.name, l).forEach((x, j) => {
        assert.equal(got[j][0], x.n);
        const change = ADVICE_CHANGES[`${m.name}/${l}/${x.n}`];
        if (change) moved++;
        assert.equal(got[j][1], change || x.action, `${m.name} ${l} ${x.n} action`);
        if (!change && x.action === keptKey(m.name)[j].preferred) assert.equal(got[j][2], x.why, `${m.name} ${l} ${x.n} reason`);
        if (change) assert.notEqual(change, keptKey(m.name)[j].preferred, "a moved action is never the preferred one");
      });
    }
  });
  assert.equal(moved, Object.keys(ADVICE_CHANGES).length);
});

test("weak advice is as specific as good advice: no generic reasons, one reason per decision and action", () => {
  const all = run(`CASES.flatMap(c => c.decisions.flatMap(d => AI_LEVELS.map(l => [c.id, d.k, c.ai[l][d.k][0], c.ai[l][d.k][1], preferredAction(c.id, d.k)])))`);
  for (const g of GENERIC) assert.ok(!all.some(x => x[3] === g), "generic reason still used: " + g);
  /* the same decision and action always get the same reason, at every level */
  const byPair = {};
  all.forEach(([id, k, a, why]) => { const key = id + k + a; (byPair[key] = byPair[key] || new Set()).add(why); });
  assert.ok(Object.values(byPair).every(s => s.size === 1));
  /* different decisions never share a reason */
  const reasons = Object.values(byPair).map(s => [...s][0]);
  assert.equal(new Set(reasons).size, reasons.length);
  /* lengths: wrong reasons are never shorter than right ones, so length
     does not give weak advice away. On the 20 kept decisions they are in
     fact longer on average (about 27 words against 21). */
  const words = t => t.split(/\s+/).length;
  const right = all.filter(x => x[2] === x[4]).map(x => words(x[3])), wrong = all.filter(x => x[2] !== x[4]).map(x => words(x[3]));
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  assert.ok(Math.min(...wrong) >= Math.min(...right), "no wrong reason shorter than the shortest right one");
  assert.ok(mean(wrong) > mean(right) - 6, `mean length right ${mean(right).toFixed(1)}, wrong ${mean(wrong).toFixed(1)}`);
});

test("instructions: who decides and when, with no Own-versus-Delegate example", () => {
  assert.deepEqual(run("ACTIONS.map(a => [a[1], a[4], a[5]])"), [
    ["Own", "You", "Now"], ["Delegate", "A team member, not you", "Now"],
    ["Wait", "You", "Later. Nothing is missing"], ["Hold", "No one yet", "Once something missing is in place"]]);
  assert.equal(run("typeof OWN_VS_DELEGATE"), "undefined");
  assert.deepEqual(run("ACTIONS.map(a => a[2])"), ["you decide, now", "a team member decides, now", "you decide, later", "not yet, something essential is missing"]);
});

test("AI advice scores 92.5 / 67.5 / 35 / 27.5 with 3 / 2 / 1 / 0 preferred actions in every caselet", () => {
  const got = run(`CASES.map(c => AI_LEVELS.map(l => { const s = scorePlan(c.id, aiPlan(c, l).actions); return [s.total, s.matches]; }))`);
  got.forEach(row => assert.deepEqual(row, [[92.5, 3], [67.5, 2], [35, 1], [27.5, 0]]));
});

test("preferred actions over the 20 kept decisions: 6 Own, 4 Delegate, 4 Wait, 6 Hold", () => {
  const counts = run(`CASES.map(c => { const n = {own:0, delegate:0, wait:0, hold:0}; c.decisions.forEach(d => n[preferredAction(c.id, d.k)]++); return n; })`);
  assert.deepEqual(counts.map(n => [n.own, n.delegate, n.wait, n.hold]),
    [[2, 0, 1, 1], [1, 1, 1, 1], [1, 0, 1, 2], [1, 1, 1, 1], [1, 2, 0, 1]]);
});

test("scorePlan sums decision scores and rescales to 0-100; a missing answer scores 0", () => {
  const all = a => run(`(() => { const p = {}; caseById(3).decisions.forEach(d => p[d.k] = "${a}"); return scorePlan(3, p); })()`);
  assert.equal(all("own").total, (4 + 20 + 20 + 11) * 100 / 80);
  assert.equal(all("hold").total, (20 + 3 + 4 + 0) * 100 / 80);
  assert.deepEqual(all("own").parts, { expansion: 4, recommendation: 20, recovery: 20, career: 11 });
  assert.equal(all("own").matches, 2);
  assert.equal(run(`scorePlan(3, {expansion:"hold"}).total`), 25);
  assert.equal(run(`decisionScore(3, "expansion", "nonsense")`), 0);
  const best = run(`(() => { const p = {}; CASES.forEach(c => c.decisions.forEach(d => p[c.id + d.k] = scorePlan(c.id, {[d.k]: preferredAction(c.id, d.k)}).total)); return Object.values(p); })()`);
  assert.ok(best.every(x => x === 25));
  const top = run(`CASES.map(c => scorePlan(c.id, Object.fromEntries(c.decisions.map(d => [d.k, preferredAction(c.id, d.k)]))).total)`);
  assert.ok(top.every(x => x === 100));
});

test("AI assignment: four conditions, every respondent sees all four levels, every caselet every level once", () => {
  const a = run("[0,1,2,3].map(aiAssignment)");
  for (const cond of a) {
    const levels = Object.values(cond);
    assert.equal(levels.length, 5);
    assert.deepEqual([...new Set(levels)].sort(), ["high", "low", "moderate", "very_low"]);
    const n = l => levels.filter(x => x === l).length;
    assert.deepEqual(["high", "moderate", "low", "very_low"].map(n).sort(), [1, 1, 1, 2]);
  }
  for (const id of [1, 2, 3, 4, 5]) assert.deepEqual(a.map(c => c[id]).sort(), ["high", "low", "moderate", "very_low"]);
  assert.equal(run("CONFIG.aiConditions"), 4);
});

test("checkKey passes on the shipped instrument", () => {
  assert.deepEqual(run("checkKey()"), []);
});

test("checkKey catches a broken key or advice", () => {
  const cases = [
    ["KEY[3].expansion.own = 20", /"expansion" must have exactly one action scoring 20/],
    ["KEY[3].expansion.wait = 25", /"expansion" needs four scores from 0 to 20/],
    ["delete KEY[2].funding", /no scores for "funding"/],
    ["KEY[2].extra = {own:1, delegate:1, wait:1, hold:20}", /key scores "extra", which is not a decision/],
    ["delete caseById(5).ai.low", /no low AI advice/],
    ["caseById(5).ai.high.venue = ['own', '']", /high AI advice needs an action and a reason for "venue"/],
    ["caseById(4).ai.moderate = caseById(4).ai.high", /AI advice must get weaker level by level/],
    ["caseById(1).id = 5", /case id 5 is used twice/],
    ["caseById(2).decisions.pop()", /case 2: 3 decisions, expected 4/],
    ["KEY[1].announcement = {own:20, delegate:14, wait:0, hold:4}; KEY[1].trainers = {own:20, delegate:14, wait:0, hold:4}", /3 decisions prefer Own; the design allows at most two/]
  ];
  for (const [mutate, want] of cases) {
    const s = loadSite();
    s.run(mutate);
    assert.match(plain(s.run("checkKey()")).join("\n"), want, mutate);
  }
});

test("no practice questions", () => {
  assert.equal(run("typeof PRACTICE"), "undefined");
});

test("every caselet has an illustration", () => {
  assert.deepEqual(run("CASES.filter(c => !ART[c.art] || !ART[c.art].startsWith('<svg')).map(c => c.id)"), []);
});
