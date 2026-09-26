/* End to end in Chromium: the real pages, the real function behind
   /api/responses (in-memory store). Needs a Chromium; see helpers/browser.mjs. */
import test from "node:test";
import assert from "node:assert/strict";
import { setup, playSurvey } from "./helpers/browser.mjs";

let env;
test.before(async () => { env = await setup(); });
test.after(async () => { if (env) await env.close(); });

const CASE_NAMES = ["Launch morning", "Strong employee", "Monday project team", "Friday support team", "Fest week", "Day before travel"];

test("page boots with no instrument warnings or script errors", async () => {
  const page = await env.newPage();
  await page.goto(env.base + "/?new=1");
  await page.waitForSelector("#begin");
  assert.equal(await page.$(".devwarn"), null);
  assert.deepEqual(page.errors, []);
});

test("full run: all six cases render, card order holds on every screen, checkpoints land", async () => {
  const page = await env.newPage();
  const before = env.api.posts.length;
  const { seen, record } = await playSurvey(page, env.base, { menus: Array(6).fill("edit_mine") });
  assert.deepEqual(page.errors, []);

  /* all six situations, once each */
  assert.deepEqual([...seen.map(s => s.name)].sort(), [...CASE_NAMES].sort());

  /* the same card order on the first plan, the recap and the final plan */
  for (const s of seen) {
    assert.equal(s.board.length, 5, s.name);
    assert.deepEqual(s.recap, s.board, `${s.name}: recap order`);
    assert.deepEqual(s.final, s.board, `${s.name}: final-plan order`);
  }

  /* the stored card order is what was shown, and it keeps the constraints */
  const byName = Object.fromEntries(seen.map(s => [s.name, s]));
  const cases = await page.evaluate(() => CASES.map(c => ({ id: c.id, name: c.name, issues: c.issues.map(i => [i.k, i.n]) })));
  for (const c of cases) {
    const names = record.cases[c.id].cardOrder.map(k => c.issues.find(i => i[0] === k)[1]);
    assert.deepEqual(names, byName[c.name].board, `${c.name}: stored cardOrder`);
  }
  const o4 = record.cases[4].cardOrder, o5 = record.cases[5].cardOrder;
  assert.ok(o4.indexOf("complaint") < o4.indexOf("warning"));
  assert.ok(o5.indexOf("drop") < o5.indexOf("diagnosis") && o5.indexOf("drop") < o5.indexOf("coordinator"));

  /* stored case order matches what was shown */
  const shownIds = seen.map(s => cases.find(c => c.name === s.name).id);
  assert.deepEqual(record.order.map(i => cases[i].id), shownIds);

  /* 3 good and 3 weak AI plans for this respondent */
  const goods = await page.evaluate(v => CASES.filter(c => aiIsGood(c, v)).length, record.version);
  assert.equal(goods, 3);

  /* the checkpoint sequence: About you, then first plan + case complete per case, then Finish */
  const posts = env.api.posts.slice(before);
  const expected = ["background_complete"];
  shownIds.forEach(id => expected.push(`case_${id}_first_plan`, `case_${id}_complete`));
  expected.push("finish");
  assert.deepEqual(posts.map(p => p.saveReason), expected);
  assert.deepEqual(posts.map(p => p.saveSeq), expected.map((_, i) => i + 1));
  assert.ok(posts.every(p => p.pid === record.pid), "one PID across all checkpoints");
  assert.deepEqual(posts.map(p => p.firstPlans), [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6]);
  assert.deepEqual(posts.map(p => p.casesCompleted), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);

  /* the server holds the one finished record */
  const srv = env.fn.stored(record.pid);
  assert.equal(srv.status, "complete");
  assert.equal(srv.saveSeq, 14);
  assert.equal(record.savedVia, "function");
});

test("menus keep, use_ai and edit_mine produce the right final plans", async () => {
  const page = await env.newPage();
  const { record, seen } = await playSurvey(page, env.base, { menus: ["keep", "use_ai", "edit_mine", "use_ai", "keep", "edit_mine"] });
  const ids = await page.evaluate(names => names.map(n => CASES.find(c => c.name === n).id), seen.map(s => s.name));
  for (let i = 0; i < 6; i++) {
    const rec = record.cases[ids[i]];
    assert.equal(rec.menu, seen[i].menu);
    if (seen[i].menu === "keep" || seen[i].menu === "edit_mine") assert.deepEqual(rec.final, rec.first);
    if (seen[i].menu === "use_ai") {
      const same = await page.evaluate(([id, v, fin]) => samePlan(fin, aiPlan(caseById(id), v, "split"), "split"), [ids[i], record.version, rec.final]);
      assert.equal(same, true);
    }
  }
});

test("a failed final save shows Try again, and the retry reaches the server", async () => {
  const page = await env.newPage();
  const { record: partial } = await playSurvey(page, env.base, { stopAfterCases: 6, finish: false });
  for (const id of ["e1", "e2", "f1", "f2", "f5"]) await page.selectOption("#" + id, { index: 1 });
  env.api.failPosts = 3;
  await page.click("#next");
  await page.waitForSelector("h1:text('Thank you')");
  assert.ok(await page.isVisible("#retry"));
  assert.ok(await page.isVisible("#dump"));
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

test("reload mid-survey asks to resume and keeps the same PID", async () => {
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
