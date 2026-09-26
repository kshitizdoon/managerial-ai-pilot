/* End to end: instrument stamping, resuming a record saved by the older
   survey code, and the researcher dashboard's tables and downloads. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { setup, playSurvey } from "./helpers/browser.mjs";
import { loadSite, plain } from "./helpers/load.mjs";

const node = loadSite();
const META = plain(node.run("instrumentMeta()"));
const KEY = "test-dashboard-key";

let env;
let savedKey;
test.before(async () => { env = await setup(); savedKey = process.env.DASHBOARD_KEY; process.env.DASHBOARD_KEY = KEY; });
test.after(async () => {
  if (env) await env.close();
  if (savedKey === undefined) delete process.env.DASHBOARD_KEY; else process.env.DASHBOARD_KEY = savedKey;
});

/* a record as the survey code before this change saved it */
function asLegacy(rec){
  const r = JSON.parse(JSON.stringify(rec));
  delete r.schemaVersion; delete r.instrument; delete r.caseOrder;
  Object.values(r.cases).forEach(c => { delete c.ai; });
  return r;
}

/* wait until the page's last checkpoint has reached the server, so no
   save still in flight writes the record back after a test edits it */
async function settle(page){
  await page.waitForFunction(() => { const r = JSON.parse(localStorage.getItem("inbasket_pilot_v2") || "null");
    return r && r.lastServerSeq === r.saveSeq; });
  return page.evaluate(() => JSON.parse(localStorage.getItem("inbasket_pilot_v2")));
}

let fresh;   // one completed response from the current code, reused below

test("a new response is stamped with the instrument, stable case ids and the AI plan shown", async () => {
  const page = await env.newPage();
  const { record, seen } = await playSurvey(page, env.base);
  fresh = record;
  assert.equal(record.schemaVersion, 2);
  assert.deepEqual(record.instrument, META, "the browser computes the same fingerprints as Node");

  const shownIds = seen.map(s => plain(node.run(`CASES.find(c => c.name === ${JSON.stringify(s.name)}).id`)));
  assert.deepEqual(record.caseOrder, shownIds);
  assert.deepEqual(record.order.map(i => i + 1), shownIds, "positions kept alongside ids");

  let good = 0;
  for (const id of shownIds) {
    const ai = record.cases[id].ai;
    const want = plain(node.run(`aiPlan(caseById(${id}), "${record.version}", "split")`));
    assert.equal(ai.version, record.version);
    assert.equal(ai.mode, "split");
    assert.equal(ai.good, plain(node.run(`aiIsGood(caseById(${id}), "${record.version}")`)));
    assert.deepEqual(ai.plan, { own: want.own, del: want.del, wait: want.wait, hold: want.hold, defer: want.defer, holdPick: want.holdPick });
    assert.equal(ai.why, want.why);
    if (ai.good) good++;
  }
  assert.equal(good, 3);

  const srv = env.fn.stored(record.pid);
  assert.deepEqual(srv.instrument, META);
  assert.deepEqual(srv.caseOrder, shownIds);
  assert.equal(srv.status, "complete");
});

test("the instrument stamp does not change when a response is resumed", async () => {
  const page = await env.newPage();
  const { record } = await playSurvey(page, env.base, { stopAfterCases: 1, finish: false });
  await settle(page);
  /* pretend this record was stamped by an earlier version */
  const old = { ...record.instrument, instrumentVersion: "earlier", keyHash: "11111111" };
  await page.evaluate(o => { const r = JSON.parse(localStorage.getItem("inbasket_pilot_v2")); r.instrument = o;
    localStorage.setItem("inbasket_pilot_v2", JSON.stringify(r)); }, old);
  await page.reload();
  await page.click("#cont");
  await page.click("#next");                                  // next situation intro
  assert.deepEqual((await page.evaluate(() => ST.instrument)), old);
  /* and the server keeps the stamp of the first copy it stored */
  assert.deepEqual(env.fn.stored(record.pid).instrument, record.instrument);
});

test("a response saved by the older survey code resumes on the same cases and is not restamped", async () => {
  const page = await env.newPage();
  await playSurvey(page, env.base, { stopAfterCases: 2, finish: false });
  const record = await settle(page);
  const legacy = asLegacy(record);
  legacy.pid = "legacy" + Date.now().toString(36);
  /* the server holds the older copy too, as it would after a deploy */
  await env.fn.post(legacy);
  await page.evaluate(r => localStorage.setItem("inbasket_pilot_v2", JSON.stringify(r)), legacy);
  await page.reload();
  await page.click("#cont");

  const expectedNames = legacy.order.map(i => plain(node.run(`CASES[${i}].name`)));
  for (let n = 2; n < 6; n++) {
    assert.equal(await page.textContent("h1"), expectedNames[n], `situation ${n + 1} follows the stored positions`);
    await page.click("#next");
    const keys = await page.$$eval(".issue", e => e.map(x => x.dataset.i));
    const labels = ["own", "delegate", "delegate", "wait", "hold"];
    for (let i = 0; i < 5; i++) {
      await page.click(`.issue[data-i="${keys[i]}"] .chip[data-l="${labels[i]}"]`);
      if (labels[i] === "delegate") await page.selectOption(`#a-${keys[i]}`, { index: 1 });
    }
    await page.click("input[name=conf][value='4']");
    await page.click("#next");
    await page.click("input[name=m][value=keep]");
    await page.click("#next");
  }
  for (const id of ["e1", "e2", "f1", "f2", "f5"]) await page.selectOption("#" + id, { index: 1 });
  await page.click("#next");
  await page.waitForSelector("text=Your answers were saved.");

  const srv = env.fn.stored(legacy.pid);
  assert.equal(srv.status, "complete");
  assert.equal("instrument" in srv, false, "not restamped with today's version");
  assert.equal("caseOrder" in srv, false);
  assert.equal("schemaVersion" in srv, false);
  assert.deepEqual(srv.order, legacy.order);
  /* the two cases answered before the change are exactly as they were */
  for (const i of legacy.order.slice(0, 2)) {
    const id = i + 1;
    for (const k of ["first", "final", "conf1", "menu", "cardOrder", "msA", "pos"])
      assert.deepEqual(srv.cases[id][k], legacy.cases[id][k], `case ${id} ${k}`);
    assert.equal("ai" in srv.cases[id], false);
  }
});

test("dashboard: counts, unfinished and anomalous tables, versions, raw JSON and CSV", async () => {
  /* seed: the fresh complete record is already stored; add an older-code
     complete record, an unfinished one, and a finished-but-short one */
  const legacyDone = asLegacy(fresh); legacyDone.pid = "legacydone";
  await env.fn.post(legacyDone);
  const unfinished = JSON.parse(JSON.stringify(fresh));
  unfinished.pid = "unfinished1"; unfinished.done = false;
  delete unfinished.cases[fresh.caseOrder[5]].final;
  await env.fn.post(unfinished);
  const anomalous = JSON.parse(JSON.stringify(fresh));
  anomalous.pid = "anomalous1"; anomalous.saveReason = "finish";
  delete anomalous.cases[fresh.caseOrder[4]];
  delete anomalous.cases[fresh.caseOrder[5]].final;
  await env.fn.post(anomalous);
  const all = (await env.fn.get(KEY)).json.responses;
  const byState = pid => all.find(r => r.pid === pid);
  assert.equal(byState("anomalous1").status, "complete", "the server still calls it complete; the dashboard must not trust that");

  const page = await env.newPage();
  await page.goto(env.base + "/#researcher=" + KEY);
  await page.waitForSelector("#counts");
  const complete = all.filter(r => r.done && r.pid !== "anomalous1").length;
  const unfinishedN = all.filter(r => !r.done).length;
  assert.match(await page.textContent("#counts"),
    new RegExp(`^${complete} completed responses; ${unfinishedN} unfinished; 1 marked finished but incomplete`));

  const anomRows = await page.$$eval("#anomalous tr", t => t.map(r => [...r.children].map(c => c.textContent)));
  assert.deepEqual(anomRows.slice(1), [["anomalous1", "4/6", "5/6", "complete", byState("anomalous1").receivedAt, "finish", "server"]]);
  const unfin = await page.$$eval("#unfinished tr td:first-child", t => t.map(x => x.textContent));
  assert.ok(unfin.includes("unfinished1"));
  assert.ok(!unfin.includes("anomalous1"));

  const versions = await page.$$eval("#versions tr", t => t.slice(1).map(r => [...r.children].map(c => c.textContent)));
  const cur = versions.find(v => v[0] === META.instrumentVersion);
  assert.deepEqual(cur.slice(1, 4), [META.casesHash, META.keyHash, "v1"]);
  assert.equal(cur[7], "yes");
  assert.equal(cur[6], "1", "the anomalous record is counted under its version");
  const unstamped = versions.find(v => v[0] === "—");
  assert.match(unstamped[7], /not recorded/);
  assert.match(await page.textContent("#app"), /saved before instrument versions were recorded/);

  /* raw JSON: every stored record, as stored */
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#json")]);
  assert.equal(dl.suggestedFilename(), "pilot-raw.json");
  const raw = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  const sortPid = a => [...a].sort((x, y) => x.pid < y.pid ? -1 : 1);
  assert.deepEqual(sortPid(raw.responses), sortPid(all));
  assert.equal(raw.counts.total, all.length);
  assert.equal(raw.counts.anomalous, 1);
  assert.equal(raw.index.find(i => i.pid === "anomalous1").state, "anomalous");
  assert.ok(raw.index.every(i => i.source === "server"));

  /* CSV: completed responses only, six rows each, instrument columns at the end */
  const [csvDl] = await Promise.all([page.waitForEvent("download"), page.click("#csv")]);
  const lines = fs.readFileSync(await csvDl.path(), "utf8").split("\n");
  assert.equal(lines.length, 1 + 6 * complete);
  const pids = new Set(lines.slice(1).map(l => l.split(",")[0]));
  assert.ok(pids.has("legacydone") && pids.has(fresh.pid));
  assert.ok(!pids.has("anomalous1") && !pids.has("unfinished1"));
  assert.equal(lines[0].split(",").at(-1), "scored_with_key_hash");
  assert.deepEqual(page.errors, []);

  /* the raw file pastes back into Add responses on a host with no live data */
  const imp = await env.newPage();
  await imp.goto(env.base + "/#researcher=wrong-key");
  await imp.waitForSelector("#paste");
  await imp.fill("#paste", JSON.stringify(raw));
  await imp.click("#addr");
  await imp.waitForFunction(n => (document.getElementById("counts") || {}).textContent?.startsWith(n + " completed"), complete);
  assert.match(await imp.textContent("#counts"), new RegExp(`${unfinishedN} unfinished; 1 marked finished but incomplete`));
});

test("dashboard with no completed responses still lists anomalous records and offers raw JSON", async () => {
  const solo = await setup();
  try {
    const anomalous = JSON.parse(JSON.stringify(fresh));
    anomalous.pid = "onlyanomalous";
    delete anomalous.cases[fresh.caseOrder[0]].final;
    await solo.fn.post(anomalous);
    const page = await solo.newPage();
    await page.goto(solo.base + "/#researcher=" + KEY);
    await page.waitForSelector("#anomalous");
    assert.match(await page.textContent("#app"), /No completed responses yet/);
    assert.match(await page.textContent("#counts"), /^0 completed responses; 0 unfinished; 1 marked finished but incomplete/);
    assert.deepEqual(await page.$$eval("#anomalous tr:nth-child(2) td", t => t.slice(0, 3).map(x => x.textContent)), ["onlyanomalous", "5/6", "6/6"]);
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#json")]);
    const raw = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
    assert.deepEqual(raw.responses.map(r => r.pid), ["onlyanomalous"]);
    assert.equal(await page.$("#csv"), null, "no analysis CSV without completed responses");
  } finally { await solo.close(); }
});
