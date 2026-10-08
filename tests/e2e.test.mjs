/* End to end in Chromium: the real pages, the real function behind
   /api/responses (in-memory store). Needs a Chromium; see helpers/browser.mjs. */
import test from "node:test";
import assert from "node:assert/strict";
import { setup, playSurvey } from "./helpers/browser.mjs";
import { loadSite, plain } from "./helpers/load.mjs";

const node = loadSite();
const nrun = s => plain(node.run(s));
const CASE_NAMES = ["Monday Project Team", "Strong Employee", "Fest Week", "Friday Support Team", "Launch Morning", "Day Before Travel"];

let env;
test.before(async () => { env = await setup(); });
test.after(async () => { if (env) await env.close(); });

test("page boots with no instrument warnings or script errors; welcome asks for one sitting", async () => {
  const page = await env.newPage();
  await page.goto(env.base + "/?new=1");
  await page.waitForSelector("#begin");
  assert.equal(await page.$(".devwarn"), null);
  const text = await page.textContent("#app");
  assert.match(text, /Managerial Decision Survey/);
  assert.match(text, /one sitting/);
  assert.doesNotMatch(text, /stop at any time/i);
  assert.doesNotMatch(text, /closing the page/i);
  assert.deepEqual(page.errors, []);
});

test("full run: six caselets, five decisions each in the manual's order, advice as assigned, checkpoints land", async () => {
  const page = await env.newPage();
  const before = env.api.posts.length;
  const { seen, record } = await playSurvey(page, env.base, { query: "?new=1&ai=1" });
  assert.deepEqual(page.errors, []);

  assert.deepEqual([...seen.map(s => s.name)].sort(), [...CASE_NAMES].sort());
  assert.equal(record.aiCondition, 1);
  assert.deepEqual(record.aiLevels, nrun("aiAssignment(1)"));

  for (const s of seen) {
    const id = nrun(`CASES.find(c => c.name === ${JSON.stringify(s.name)}).id`);
    const titles = nrun(`caseById(${id}).decisions.map(d => d.n)`);
    assert.deepEqual(s.first, titles, `${s.name}: first-answer screen in manual order`);
    assert.deepEqual(s.finalTitles, titles, `${s.name}: final screen in the same order`);
    /* the final screen shows the first answers and preselects them */
    assert.deepEqual(s.mine, s.keys.map(k => s.answers[k]));
    assert.deepEqual(s.preselected, s.keys.map(k => s.answers[k]));
    /* the advice shown is the assigned level's, action and reason */
    const ai = nrun(`aiPlan(caseById(${id}), ${JSON.stringify(record.aiLevels[id])})`);
    assert.deepEqual(s.advice, s.keys.map(k => ai.actions[k]), `${s.name}: advice actions`);
    assert.deepEqual(s.adviceText, s.keys.map(k => ai.why[k]), `${s.name}: advice text`);
    /* and the record keeps what was shown, and the answers given */
    const rec = record.cases[id];
    assert.deepEqual(rec.first, s.answers);
    assert.deepEqual(rec.final, s.final === "ai" ? ai.actions : s.answers);
    assert.deepEqual(rec.ai, { condition: 1, level: record.aiLevels[id], actions: ai.actions, why: ai.why,
      score: nrun(`aiPlanScore(caseById(${id}), ${JSON.stringify(record.aiLevels[id])})`) });
    assert.deepEqual(rec.decisionOrder, s.keys);
    assert.equal(rec.conf, 3);
    assert.equal(Object.keys(rec.tA).length, 5);
  }
  assert.deepEqual(record.practice.answers, { a: "wait", b: "hold" });
  assert.equal(record.practice.correct, true);

  const shownIds = seen.map(s => nrun(`CASES.find(c => c.name === ${JSON.stringify(s.name)}).id`));
  assert.deepEqual(record.caseOrder, shownIds);
  const posts = env.api.posts.slice(before);
  const expected = ["background_complete"];
  shownIds.forEach(id => expected.push(`case_${id}_first_plan`, `case_${id}_complete`));
  expected.push("finish");
  assert.deepEqual(posts.map(p => p.saveReason), expected);
  assert.deepEqual(posts.map(p => p.saveSeq), expected.map((_, i) => i + 1));
  assert.ok(posts.every(p => p.pid === record.pid), "one PID across all checkpoints");
  assert.deepEqual(posts.map(p => p.casesCompleted), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);

  const srv = env.fn.stored(record.pid);
  assert.equal(srv.status, "complete");
  assert.equal(srv.saveSeq, 14);
  assert.equal(record.savedVia, "function");
});

test("every respondent sees all four advice levels", async () => {
  const page = await env.newPage();
  const { record } = await playSurvey(page, env.base, { finish: false, stopAfterCases: 6 });
  const levels = Object.values(record.cases).map(c => c.ai.level);
  assert.deepEqual([...new Set(levels)].sort(), ["high", "low", "moderate", "very_low"]);
  assert.ok(record.aiCondition >= 0 && record.aiCondition < 4);
});

test("a wrong practice answer is kept, shown the explanation, and does not block", async () => {
  const page = await env.newPage();
  await playSurvey(page, env.base, { stopAfterCases: 0, finish: false, practice: ["hold", "wait"] });
  const rec = await page.evaluate(() => ST.practice);
  assert.deepEqual(rec.answers, { a: "hold", b: "wait" });
  assert.equal(rec.correct, false);
  assert.ok(await page.isVisible(".sit h2"), "moved on to the first caselet");
});

test("saving with a decision unanswered is blocked and points at it", async () => {
  const page = await env.newPage();
  await playSurvey(page, env.base, { stopAfterCases: 0, finish: false });
  const keys = await page.$$eval(".decision", e => e.map(x => x.dataset.k));
  for (const k of keys.slice(0, 4)) await page.click(`input[name="a-${k}"][value=own]`);
  await page.click("#next");
  assert.match(await page.textContent("#e"), /Choose an action for/);
  assert.deepEqual(await page.$$eval(".decision.missing", e => e.map(x => x.dataset.k)), [keys[4]]);
  assert.equal(await page.evaluate(() => Object.values(ST.cases)[0].errA), 1);
  await page.click(`input[name="a-${keys[4]}"][value=hold]`);
  await page.click("#next");
  await page.waitForSelector(".compare");
});

test("confidence and reason are optional", async () => {
  const page = await env.newPage();
  const { record, seen } = await playSurvey(page, env.base, { stopAfterCases: 1, finish: false, conf: 0 });
  const id = nrun(`CASES.find(c => c.name === ${JSON.stringify(seen[0].name)}).id`);
  assert.equal(record.cases[id].conf, null);
  assert.equal(record.cases[id].reason, "");
});

test("a failed final save shows Try again, and the retry reaches the server", async () => {
  const page = await env.newPage();
  const { record: partial } = await playSurvey(page, env.base, { finish: false });
  for (const id of ["e1", "e2", "f1", "f2", "f5"]) await page.selectOption("#" + id, { index: 1 });
  env.api.failPosts = 3;
  await page.click("#next");
  await page.waitForSelector("h1:text('Thank you')");
  assert.ok(await page.isVisible("#retry"));
  assert.notEqual(env.fn.stored(partial.pid).status, "complete");
  const dumped = JSON.parse(await page.inputValue("#dump"));
  assert.equal(dumped.pid, partial.pid);
  assert.equal(dumped.done, true);
  await page.click("#retry");
  await page.waitForSelector("text=Your answers were saved.");
  const srv = env.fn.stored(partial.pid);
  assert.equal(srv.status, "complete");
  assert.equal(srv.saveReason, "finish_retry");
});

test("a finished but unsaved response retries by itself when the page is reopened", async () => {
  const page = await env.newPage();
  const { record: partial } = await playSurvey(page, env.base, { finish: false });
  for (const id of ["e1", "e2", "f1", "f2", "f5"]) await page.selectOption("#" + id, { index: 1 });
  env.api.failPosts = 3;
  await page.click("#next");
  await page.waitForSelector("#retry");
  const before = env.api.posts.length;
  await page.goto(env.base + "/");
  await page.waitForSelector("text=Your answers were saved.");
  assert.equal(env.api.posts[before].saveReason, "finish_retry");
  assert.equal(env.fn.stored(partial.pid).status, "complete");
});

test("reload mid-survey asks to resume, keeps the same PID, and returns to the same screen", async () => {
  const page = await env.newPage();
  const { record } = await playSurvey(page, env.base, { stopAfterCases: 2, finish: false });
  await page.reload();
  await page.waitForSelector("#cont");
  assert.match(await page.textContent("#app"), /2 of 6 situations completed/);
  await page.click("#cont");
  await page.waitForSelector("text=Situation 3 of 6");
  assert.equal(await page.evaluate(() => ST.pid), record.pid);
  assert.equal(env.fn.stored(record.pid).status, "in_progress");
});

test("starting a new response archives the old one and keeps its server record in progress", async () => {
  const page = await env.newPage();
  const { record } = await playSurvey(page, env.base, { stopAfterCases: 1, finish: false });
  await page.goto(env.base + "/?new=1");
  await page.waitForSelector("#begin");
  const archive = await page.evaluate(() => archivedRows().map(r => r.pid));
  assert.ok(archive.includes(record.pid));
  const srv = env.fn.stored(record.pid);
  assert.equal(srv.status, "in_progress");
  assert.equal(srv.saveReason, "left_unfinished_on_device");
});

test("an unfinished response from the earlier survey is kept and a fresh one starts", async () => {
  const page = await env.newPage();
  await page.goto(env.base + "/?new=1");
  const old = { pid: "oldpilot1", version: "A", deferMode: "split", order: [0, 1, 2, 3, 4, 5], at: 2, done: false,
    cases: { 1: { first: { own: "ops", del: {}, wait: "a", hold: "b" } } }, saveSeq: 3, schemaVersion: 2 };
  await page.evaluate(r => localStorage.setItem("inbasket_pilot_v2", JSON.stringify(r)), old);
  await page.goto(env.base + "/");
  await page.waitForSelector("#begin");
  assert.deepEqual(page.errors, []);
  assert.ok((await page.evaluate(() => archivedRows().map(r => r.pid))).includes("oldpilot1"));
  for (let i = 0; i < 50 && !env.fn.stored("oldpilot1"); i++) await new Promise(r => setTimeout(r, 100));
  const srv = env.fn.stored("oldpilot1");
  assert.equal(srv.saveReason, "left_unfinished_instrument_changed");
  assert.equal(srv.saveSeq, 4);
  assert.deepEqual(srv.cases, old.cases, "old answers sent unchanged");
});
