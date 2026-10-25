/* End to end: Part 1 (Producer) then Part 2 (Evaluator) in one visit,
   against the real functions over in-memory stores seeded with real-shaped
   completed Producer records. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { setup, playSurvey } from "./helpers/browser.mjs";
import { loadSite, plain } from "./helpers/load.mjs";
import { makeRecord } from "./helpers/records.mjs";

const node = loadSite();
const FIRSTS = ["pref", "own", "delegate", "wait", "hold"];
const KEY = "ev-dash-key";
const VARS = ["EVALUATOR_ENABLED", "DASHBOARD_KEY", "EVALUATOR_MIN_PRODUCER_MINUTES"];
let savedEnv;
test.before(() => { savedEnv = Object.fromEntries(VARS.map(k => [k, process.env[k]])); });
test.after(() => VARS.forEach(k => { if (savedEnv[k] === undefined) delete process.env[k]; else process.env[k] = savedEnv[k]; }));
const on = () => { process.env.EVALUATOR_ENABLED = "1"; process.env.DASHBOARD_KEY = KEY; };

async function seeded(n){
  const env = await setup();
  for (let i = 0; i < n; i++)
    await env.fn.post(makeRecord(node, { pid: "seed" + i, condition: i % 4, first: FIRSTS[i % 5], final: i % 2 ? "ai" : "first",
                                         contact: { name: "Seed Person " + i, mobile: "91111111" + i } }));
  return env;
}
const stored = (env, store, id) => { const r = env.fn.all.db(store).get(id); return r ? JSON.parse(r.v) : null; };

/* finish Part 1 and land on the Part 2 offer */
async function finishPart1(env, page){
  const { record } = await playSurvey(page, env.base, { finish: false });
  for (const id of ["e1", "e2", "f1", "f2", "f5"]) await page.selectOption("#" + id, { index: 1 });
  await page.click("#next");
  return record;
}

/* what one Part 2 page shows, read from the DOM */
async function readPerson(page){
  return page.$$eval(".decision", cards => cards.map(c => ({
    k: c.dataset.k,
    rows: [...c.querySelectorAll(".evrow")].map(r => ({ tag: r.querySelector(".tag").textContent, action: r.querySelector("b").textContent,
      why: (r.querySelector("p") || {}).textContent || null, chg: (r.querySelector(".chg") || {}).textContent || null }))
  })));
}
async function rate(page, rating, conf, why){
  await page.fill("#rtn", String(rating));
  await page.click(`.seg input[value='${conf}']`, { force: true });
  if (why) await page.fill("#evw", why);
  await page.click("#next");
}
const label = a => plain(node.run(`actionLabel(${JSON.stringify(a)})`));

test("one visit: Part 1, then three real people under A, B and C, with resume, then the end", async () => {
  on();
  const env = await seeded(9);
  try {
    const page = await env.newPage();
    const me = await finishPart1(env, page);
    await page.waitForSelector("text=Part 1 is done");
    assert.doesNotMatch(await page.textContent("#app"), /not a live AI tool/, "no debrief before Part 2");
    const producerBefore = JSON.stringify(stored(env, "pilot-responses", me.pid));
    await page.click("#ev-go");
    await page.waitForSelector(".evrec");
    const a = stored(env, "evaluator-assignments", me.pid);
    assert.ok(a, "assignment stored under the same PID");
    assert.ok(a.slots.every(s => s.target.pid !== me.pid), "not one's own record");
    assert.equal(new Set(a.slots.map(s => s.target.pid)).size, 3);

    const c = plain(node.run(`caseById(${a.caseId})`));
    for (let i = 0; i < 3; i++) {
      if (i === 2) {
        /* reload before the last person: same person, same place */
        await page.reload();
        await page.waitForSelector(".evrec");
      }
      const slot = a.slots[i];
      assert.match(await page.textContent(".sit .kicker"), new RegExp(`Person ${i + 1} of 3`));
      assert.equal(await page.textContent(".sit h2"), c.name);
      const shown = await readPerson(page);
      const target = stored(env, "pilot-responses", slot.target.pid).cases[a.caseId];
      assert.deepEqual(shown.map(d => d.k), a.decisionIds, "the assigned three decisions, in order");
      for (const d of shown) {
        const tags = d.rows.map(r => r.tag);
        if (slot.condition === "A") assert.deepEqual(tags, ["Their decision"]);
        if (slot.condition === "B") assert.deepEqual(tags, ["AI advisor recommended", "Their decision"]);
        if (slot.condition === "C") assert.deepEqual(tags, ["First decision, before AI advice", "AI advisor recommended", "Final decision"]);
        const last = d.rows[d.rows.length - 1];
        assert.equal(last.action, label(target.final[d.k]), "final decision is the target's own");
        if (slot.condition !== "A") {
          const ai = d.rows.find(r => r.tag === "AI advisor recommended");
          assert.equal(ai.action, label(target.ai.actions[d.k]));
          assert.equal(ai.why, target.ai.why[d.k], "exact advice text the target saw");
        }
        if (slot.condition === "C") {
          assert.equal(d.rows[0].action, label(target.first[d.k]));
          assert.equal(last.chg, target.first[d.k] !== target.final[d.k] ? "Changed after the AI advice" : "Not changed after the AI advice");
        }
      }
      /* no rating until one is given */
      assert.equal(await page.inputValue("#rtn"), "");
      assert.ok(await page.$eval("#rt", x => x.classList.contains("unset")));
      assert.equal(await page.$("input[name=evc]:checked"), null);
      await page.click("#next");
      assert.match(await page.textContent("#e"), /rating from 0 to 100/);
      await rate(page, 30 + 20 * i, i + 2, i === 1 ? "they changed course" : "");
    }
    await page.waitForSelector("text=You have completed both parts.");
    assert.match(await page.textContent("#app"), /not a live AI tool/, "debrief at the very end");
    await page.waitForSelector("text=Your ratings were saved.");

    const e = stored(env, "evaluator-responses", me.pid);
    assert.equal(e.status, "complete");
    assert.equal(e.assignmentId, a.id);
    assert.deepEqual(a.slots.map(s => e.items[s.token].rating), [30, 50, 70]);
    assert.deepEqual(a.slots.map(s => e.items[s.token].conf), [2, 3, 4]);
    assert.equal(e.items[a.slots[1].token].why, "they changed course");
    assert.equal(JSON.stringify(stored(env, "pilot-responses", me.pid)), producerBefore, "Producer record untouched by Part 2");
    const reasons = env.api.evPosts.filter(p => p.action === "save").map(p => p.record.saveReason);
    assert.deepEqual(reasons, ["assignment_received", "person_1_rated", "person_2_rated", "person_3_rated", "finish"]);
    assert.ok(env.api.evPosts.filter(p => p.action === "save").every(p => !("view" in p.record)));

    /* coming back later: the end screen again, nothing new */
    await page.goto(env.base + "/");
    await page.waitForSelector("text=You have completed both parts.");
    assert.deepEqual(page.errors, []);
  } finally { await env.close(); }
});

test("switched off: Part 1 ends as before, with no Part 2", async () => {
  delete process.env.EVALUATOR_ENABLED;
  const env = await seeded(6);
  try {
    const page = await env.newPage();
    await finishPart1(env, page);
    await page.waitForSelector("h1:text('Thank you')");
    await page.waitForSelector("text=Your answers were saved.");
    assert.doesNotMatch(await page.textContent("#app"), /Part 2|part 2/);
    assert.equal(env.fn.all.db("evaluator-assignments").size, 0);
  } finally { await env.close(); }
});

test("not enough real records: Part 2 says so, nothing is assigned or invented", async () => {
  on();
  const env = await seeded(2);
  try {
    const page = await env.newPage();
    await finishPart1(env, page);
    await page.waitForSelector("#ev-go");
    await page.click("#ev-go");
    await page.waitForSelector("text=Part 2 cannot be offered yet");
    assert.match(await page.textContent("#app"), /not a live AI tool/);
    assert.equal(env.fn.all.db("evaluator-assignments").size, 0);
    assert.equal(env.fn.all.db("evaluator-responses").size, 0);
  } finally { await env.close(); }
});

test("finishing without Part 2 is remembered", async () => {
  on();
  const env = await seeded(6);
  try {
    const page = await env.newPage();
    await finishPart1(env, page);
    await page.click("#ev-skip");
    await page.waitForSelector("text=Your answers were saved.");
    assert.match(await page.textContent("#app"), /not a live AI tool/);
    await page.goto(env.base + "/");
    await page.waitForSelector("text=Your answers were saved.");
    assert.equal(await page.$("#ev-go"), null);
  } finally { await env.close(); }
});

test("someone who finished Part 1 earlier can do Part 2 from a link, without repeating Part 1", async () => {
  on();
  const env = await seeded(7);
  try {
    const page = await env.newPage();
    await page.goto(env.base + "/?evaluate=seed6");
    await page.waitForSelector("#ev-go");
    assert.doesNotMatch(await page.url(), /evaluate=/, "the PID is taken out of the address bar");
    await page.click("#ev-go");
    await page.waitForSelector(".evrec");
    const a = stored(env, "evaluator-assignments", "seed6");
    assert.ok(a.slots.every(s => s.target.pid !== "seed6"));
    /* a reload resumes Part 2, not a fresh Part 1 */
    await page.reload();
    await page.waitForSelector(".evrec");
    assert.match(await page.textContent(".sit .kicker"), /Person 1 of 3/);
    /* an unknown PID is refused by the server */
    const other = await env.newPage();
    await other.goto(env.base + "/?evaluate=nobody");
    await other.click("#ev-go");
    await other.waitForSelector("text=Part 2 could not be loaded");
  } finally { await env.close(); }
});

test("dashboard: Evaluator results kept apart, incomplete evaluations left out, downloads", async () => {
  on();
  const env = await seeded(9);
  try {
    /* one complete evaluator, one who stops after the first person */
    for (const [pid, stop] of [["seed0", 3], ["seed1", 1]]) {
      const p = await env.newPage();
      await p.goto(env.base + "/?evaluate=" + pid);
      await p.click("#ev-go");
      for (let i = 0; i < stop; i++) { await p.waitForSelector(".evrec"); await rate(p, 40 + i * 10, 3); }
      if (stop === 3) await p.waitForSelector("text=Your ratings were saved.");
      else await p.waitForFunction(() => { const r = JSON.parse(localStorage.getItem("inbasket_evaluator_v1")); return r.lastServerSeq === r.saveSeq; });
    }
    const page = await env.newPage();
    await page.goto(env.base + "/#researcher=" + KEY);
    await page.waitForSelector("#evcounts");
    assert.match(await page.textContent("#evcounts"), /^1 completed evaluator; 1 unfinished/);
    assert.match(await page.textContent("#evpool"), /Eligible Producer records for evaluation: 9 of 9/);
    assert.deepEqual(await page.$$eval("#evunfinished tr td:first-child", t => t.map(x => x.textContent)), ["seed1"]);
    const conds = await page.$$eval("#evconditions tr", t => t.slice(1).map(r => [...r.children].slice(0, 2).map(c => c.textContent)));
    assert.deepEqual(conds.map(r => r[1]), ["1", "1", "1"], "one rating per condition, from the complete evaluator only");
    /* the Producer statistics are still there */
    assert.ok(await page.$("#cases"));
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#evcsv")]);
    const lines = fs.readFileSync(await dl.path(), "utf8").split("\n");
    assert.equal(lines.length, 1 + 3);
    const head = lines[0].split(",");
    for (const col of ["evaluator_pid", "condition", "case_id", "decision_ids", "target_pid", "target_mda", "target_mda_leave_one_out",
                       "target_instrument_version", "ai_level", "rating", "confidence", "seconds"]) assert.ok(head.includes(col), col);
    assert.ok(lines.slice(1).every(l => l.startsWith("seed0,")));
    const [raw] = await Promise.all([page.waitForEvent("download"), page.click("#evjson")]);
    const j = JSON.parse(fs.readFileSync(await raw.path(), "utf8"));
    assert.equal(j.assignments.length, 2);
    assert.equal(j.evaluations.length, 2);
    assert.deepEqual(page.errors, []);
  } finally { await env.close(); }
});
