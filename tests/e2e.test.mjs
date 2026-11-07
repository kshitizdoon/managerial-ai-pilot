/* End to end in Chromium: the real pages, the real function behind
   /api/responses (in-memory store). Needs a Chromium; see helpers/browser.mjs. */
import test from "node:test";
import assert from "node:assert/strict";
import { setup, playSurvey, aboutYou } from "./helpers/browser.mjs";
import { loadSite, plain } from "./helpers/load.mjs";

const node = loadSite();
const nrun = s => plain(node.run(s));
const CASE_NAMES = ["Monday Project Team", "Strong Employee", "Fest Week", "Friday Support Team", "Launch Morning"];

let env;
test.before(async () => { env = await setup(); });
test.after(async () => { if (env) await env.close(); });

test("page boots with no instrument warnings or script errors; the welcome text is short", async () => {
  const page = await env.newPage();
  await page.goto(env.base + "/?new=1");
  await page.waitForSelector("#begin");
  assert.equal(await page.$(".devwarn"), null);
  const text = await page.textContent("#app");
  assert.match(text, /Managerial Decision Survey/);
  assert.match(text, /You will be put in 5 situations, with 4 decisions in each\./);
  assert.match(text, /Own, Delegate, Wait or Hold/);
  assert.match(text, /an AI advisor will show its recommendations/);
  assert.match(text, /Try to answer honestly and spontaneously\./);
  assert.match(text, /prize draw\. It is optional\./);
  assert.match(text, /shown anonymously to other participants/);
  assert.doesNotMatch(text, /IIM Ahmedabad|no trick questions/);
  assert.doesNotMatch(text, /stop at any time/i);
  assert.doesNotMatch(text, /closing the page/i);
  assert.deepEqual(page.errors, []);
});

test("full run: five caselets, four decisions each in a shuffled order, advice as drawn, About you last, checkpoints land", async () => {
  const page = await env.newPage();
  const before = env.api.posts.length;
  const { seen, record } = await playSurvey(page, env.base);
  assert.deepEqual(page.errors, []);

  assert.deepEqual([...seen.map(s => s.name)].sort(), [...CASE_NAMES].sort());
  assert.equal(record.aiCondition, undefined);
  assert.equal(record.aiLevels, undefined);
  assert.equal(record.aiRightShare, 0.5);
  /* advice right on exactly 10 of the 20 decisions */
  assert.equal([].concat(...Object.values(record.advice).map(a => Object.values(a.right))).filter(Boolean).length, 10);

  for (const s of seen) {
    const id = nrun(`CASES.find(c => c.name === ${JSON.stringify(s.name)}).id`);
    const rec = record.cases[id];
    const titles = rec.decisionOrder.map(k => nrun(`caseById(${id}).decisions.find(d => d.k === ${JSON.stringify(k)}).n`));
    assert.deepEqual([...rec.decisionOrder].sort(), nrun(`caseById(${id}).decisions.map(d => d.k)`).sort());
    assert.deepEqual(s.first, titles, `${s.name}: first-answer screen in the stored order`);
    assert.deepEqual(s.finalTitles, titles, `${s.name}: final screen in the same order`);
    /* the final screen shows the first answers and preselects them */
    assert.deepEqual(s.mine, s.keys.map(k => s.answers[k]));
    assert.deepEqual(s.preselected, s.keys.map(k => s.answers[k]));
    /* the advice shown is the drawn advice, action and reason */
    const ai = record.advice[id];
    assert.deepEqual(s.advice, s.keys.map(k => ai.actions[k]), `${s.name}: advice actions`);
    assert.deepEqual(s.adviceText, s.keys.map(k => ai.why[k]), `${s.name}: advice text`);
    for (const k of s.keys) assert.equal(ai.right[k], ai.actions[k] === nrun(`preferredAction(${id}, ${JSON.stringify(k)})`));
    /* and the record keeps what was shown, and the answers given */
    assert.deepEqual(rec.first, s.answers);
    assert.deepEqual(rec.final, s.final === "ai" ? ai.actions : s.answers);
    assert.deepEqual(rec.ai, { actions: ai.actions, why: ai.why, right: ai.right,
      rightCount: nrun(`adviceRightCount(${id}, ${JSON.stringify(ai.actions)})`),
      score: nrun(`scorePlan(${id}, ${JSON.stringify(ai.actions)}).total`) });
    assert.deepEqual(rec.decisionOrder, s.keys);
    assert.equal(rec.conf, 3);
    assert.equal(Object.keys(rec.tA).length, 4);
  }
  assert.equal(record.practice, undefined, "no practice questions");
  assert.equal(record.end, undefined, "no last-few-questions block");
  assert.equal(record.pilot, undefined, "no help-us-fix block");
  assert.deepEqual(Object.keys(record.bg), ["programme", "experience", "managed", "aiUse", "undergrad"]);
  assert.equal(record.consent.version, 3);

  const shownIds = seen.map(s => nrun(`CASES.find(c => c.name === ${JSON.stringify(s.name)}).id`));
  assert.deepEqual(record.caseOrder, shownIds);
  const posts = env.api.posts.slice(before);
  const expected = ["start"];
  shownIds.forEach(id => expected.push(`case_${id}_first_plan`, `case_${id}_complete`));
  expected.push("finish");
  assert.deepEqual(posts.map(p => p.saveReason), expected);
  assert.deepEqual(posts.map(p => p.saveSeq), expected.map((_, i) => i + 1));
  assert.ok(posts.every(p => p.pid === record.pid), "one PID across all checkpoints");
  assert.deepEqual(posts.map(p => p.casesCompleted), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  assert.equal(posts[0].bg, null, "About you is not asked at the start");
  assert.ok(posts[posts.length - 1].bg && posts[posts.length - 1].bg.programme, "it arrives with the finished response");

  const srv = env.fn.stored(record.pid);
  assert.equal(srv.status, "complete");
  assert.equal(srv.saveSeq, 12);
  assert.equal(record.savedVia, "function");
});

test("?ai=right and ?ai=wrong make all advice right or all wrong", async () => {
  for (const f of ["right", "wrong"]) {
    const page = await env.newPage();
    const { record } = await playSurvey(page, env.base, { finish: false, query: "?new=1&ai=" + f });
    const counts = Object.values(record.cases).map(c => c.ai.rightCount);
    assert.deepEqual(counts, Array(5).fill(f === "right" ? 4 : 0));
  }
});

test("two respondents get different advice and different decision orders", async () => {
  const a = (await playSurvey(await env.newPage(), env.base, { finish: false, stopAfterCases: 1 })).record;
  const b = (await playSurvey(await env.newPage(), env.base, { finish: false, stopAfterCases: 1 })).record;
  assert.notDeepEqual(a.advice, b.advice);
});

test("no practice screen: how it works leads straight to the first caselet", async () => {
  const page = await env.newPage();
  await playSurvey(page, env.base, { stopAfterCases: 0, finish: false });
  assert.ok(await page.isVisible(".sit h2"), "on the first caselet");
  assert.match(await page.textContent("#step"), /Situation 1 of 5/);
  assert.equal(await page.evaluate(() => ST.practice), undefined);
});

test("the last page asks only About you and the prize draw, and needs all five answers", async () => {
  const page = await env.newPage();
  await playSurvey(page, env.base, { finish: false });
  const text = await page.textContent("#app");
  assert.match(text, /About you/);
  assert.match(text, /For the prize draw/);
  assert.doesNotMatch(text, /Help us fix the survey|Last few questions|CAT overall percentile|ChatGPT or another AI tool/);
  assert.equal(await page.$$eval("select", e => e.length), 5);
  await page.click("#next");
  assert.match(await page.textContent("#e"), /answer all five/);
  await aboutYou(page);
  await page.fill("#nm", "A Person");
  await page.click("#next");
  await page.waitForSelector("h1:text('Thank you')");
  const rec = await page.evaluate(() => ST);
  assert.equal(rec.done, true);
  assert.equal(rec.contact.name, "A Person");
  assert.equal(rec.bg.programme, "PGP year 1");
});

test("saving with a decision unanswered is blocked and points at it", async () => {
  const page = await env.newPage();
  await playSurvey(page, env.base, { stopAfterCases: 0, finish: false });
  const keys = await page.$$eval(".decision", e => e.map(x => x.dataset.k));
  for (const k of keys.slice(0, 3)) await page.click(`input[name="a-${k}"][value=own]`);
  await page.click("#next");
  assert.match(await page.textContent("#e"), /Choose an action for/);
  assert.deepEqual(await page.$$eval(".decision.missing", e => e.map(x => x.dataset.k)), [keys[3]]);
  assert.equal(await page.evaluate(() => Object.values(ST.cases)[0].errA), 1);
  await page.click(`input[name="a-${keys[3]}"][value=hold]`);
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
  await aboutYou(page);
  env.api.failPosts = 3;
  await page.click("#next");
  await page.waitForSelector("h1:text('Thank you')");
  assert.ok(await page.isVisible("#retry"));
  assert.equal(await page.textContent("#failwhy"), "Technical detail: function 500: test failure");
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
  await aboutYou(page);
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
  assert.match(await page.textContent("#app"), /2 of 5 situations completed/);
  await page.click("#cont");
  await page.waitForSelector("text=Situation 3 of 5");
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

test("how it works comes right after the welcome: short instructions, who decides and when, no example", async () => {
  const page = await env.newPage();
  await page.goto(env.base + "/?new=1");
  await page.click("#begin");
  await page.waitForSelector(".whowhen");
  assert.match(await page.textContent("h2"), /How it works/);
  const rows = await page.$$eval(".whowhen tbody tr", t => t.map(r => [...r.children].map(c => c.textContent)));
  assert.deepEqual(rows, [["Own", "You", "Now"], ["Delegate", "A team member, not you", "Now"],
    ["Wait", "You", "Later. Nothing is missing"], ["Hold", "No one yet", "Once something missing is in place"]]);
  assert.equal(await page.$(".example"), null);
  assert.doesNotMatch(await page.textContent("#app"), /refund/);
});

test("each caselet shows its key numbers and, under every decision, what is to be decided", async () => {
  const page = await env.newPage();
  await playSurvey(page, env.base, { stopAfterCases: 0, finish: false });
  const name = await page.textContent(".sit h2");
  const c = nrun(`(() => { const c = CASES.find(c => c.name === ${JSON.stringify(name)}); return {facts: c.facts, q: Object.fromEntries(c.decisions.map(d => [d.k, d.q]))}; })()`);
  assert.deepEqual(await page.$$eval(".facts li", e => e.map(x => [x.querySelector("b").textContent, x.querySelector("span").textContent])), c.facts);
  const shown = await page.$$eval(".decision", e => e.map(x => [x.dataset.k, x.querySelector(".ask").textContent]));
  assert.equal(shown.length, 4);
  for (const [k, ask] of shown) assert.equal(ask, "To decide: " + c.q[k]);
});

test("the four actions look the same when selected: no colour per action", async () => {
  const page = await env.newPage();
  await playSurvey(page, env.base, { stopAfterCases: 0, finish: false });
  const keys = await page.$$eval(".decision", e => e.map(x => x.dataset.k));
  const acts = ["own", "delegate", "wait", "hold"];
  for (let i = 0; i < 4; i++) await page.click(`input[name="a-${keys[i]}"][value=${acts[i]}]`);
  await page.waitForTimeout(400);                              // let the 0.12 s style transition finish
  const styles = await page.$$eval(".act.on", e => e.map(x => { const s = getComputedStyle(x), b = getComputedStyle(x.querySelector("b"));
    return [s.backgroundColor, s.borderTopColor, s.boxShadow, b.color].join("|"); }));
  assert.equal(styles.length, 4);
  assert.equal(new Set(styles).size, 1, "selected options differ by action: " + styles.join(" / "));
  const unselected = await page.$$eval(".decision:nth-child(1) .act:not(.on) b", e => e.map(x => getComputedStyle(x).color));
  assert.equal(new Set(unselected).size, 1);
});
