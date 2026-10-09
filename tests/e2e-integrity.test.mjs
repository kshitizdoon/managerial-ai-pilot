/* End to end: instrument stamping, and the researcher dashboard's
   tables and downloads over real, unfinished, anomalous and earlier-pilot
   records. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { setup, playSurvey } from "./helpers/browser.mjs";
import { loadSite, plain } from "./helpers/load.mjs";
import { earlierPilotRecord } from "./helpers/records.mjs";

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

/* wait until the page's last checkpoint has reached the server, so no
   save still in flight writes the record back after a test edits it */
async function settle(page){
  await page.waitForFunction(() => { const r = JSON.parse(localStorage.getItem("inbasket_pilot_v2") || "null");
    return r && r.lastServerSeq === r.saveSeq; });
  return page.evaluate(() => JSON.parse(localStorage.getItem("inbasket_pilot_v2")));
}

let fresh;   // one completed response from the current code, reused below

test("a new response is stamped with the instrument, schema 3 and stable case ids", async () => {
  const page = await env.newPage();
  const { record, seen } = await playSurvey(page, env.base);
  fresh = record;
  assert.equal(record.schemaVersion, 3);
  assert.deepEqual(record.instrument, META, "the browser computes the same fingerprints as Node");
  const shownIds = seen.map(s => plain(node.run(`CASES.find(c => c.name === ${JSON.stringify(s.name)}).id`)));
  assert.deepEqual(record.caseOrder, shownIds);
  assert.deepEqual(record.order.map(i => plain(node.run(`CASES[${i}].id`))), shownIds, "positions kept alongside ids");
  const srv = env.fn.stored(record.pid);
  assert.deepEqual(srv.instrument, META);
  assert.equal(srv.status, "complete");
});

test("the instrument stamp does not change when a response is resumed", async () => {
  const page = await env.newPage();
  const { record } = await playSurvey(page, env.base, { stopAfterCases: 1, finish: false });
  await settle(page);
  const old = { ...record.instrument, instrumentVersion: "earlier", keyHash: "11111111" };
  await page.evaluate(o => { const r = JSON.parse(localStorage.getItem("inbasket_pilot_v2")); r.instrument = o;
    localStorage.setItem("inbasket_pilot_v2", JSON.stringify(r)); }, old);
  await page.reload();
  await page.click("#cont");
  await page.waitForSelector(".sit h2");
  assert.deepEqual(await page.evaluate(() => ST.instrument), old);
  assert.deepEqual(env.fn.stored(record.pid).instrument, record.instrument, "the server keeps the first stamp");
});

test("dashboard: counts, status tables, decisions, AI levels, raw JSON and CSV", async () => {
  /* seed: the fresh complete record is stored; add an earlier-pilot
     record, an unfinished one, and a finished-but-short one */
  await env.fn.post(earlierPilotRecord("oldpilot"));
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
  const state = pid => plain(node.run(`recordState(${JSON.stringify(all.find(r => r.pid === pid))})`));
  assert.equal(state("anomalous1"), "anomalous");
  assert.equal(state("oldpilot"), "earlier_instrument");

  const complete = all.filter(r => plain(node.run(`recordState(${JSON.stringify(r)})`)) === "complete").length;
  const unfinishedN = all.filter(r => plain(node.run(`recordState(${JSON.stringify(r)})`)) === "in_progress").length;
  const page = await env.newPage();
  await page.goto(env.base + "/#researcher=" + KEY);
  await page.waitForSelector("#counts");
  assert.deepEqual(page.errors, []);
  assert.match(await page.textContent("#counts"),
    new RegExp(`^${complete} completed responses?; ${unfinishedN} unfinished; 1 marked finished but incomplete; 1 from an earlier version`));

  const anomRows = await page.$$eval("#anomalous tr", t => t.map(r => [...r.children].map(c => c.textContent)));
  assert.deepEqual(anomRows.slice(1).map(r => r.slice(0, 3)), [["anomalous1", "4/6", "5/6"]]);
  assert.ok((await page.$$eval("#unfinished tr td:first-child", t => t.map(x => x.textContent))).includes("unfinished1"));
  assert.deepEqual(await page.$$eval("#earlier tr td:first-child", t => t.map(x => x.textContent)), ["oldpilot"]);
  const versions = await page.$$eval("#versions tr", t => t.slice(1).map(r => [...r.children].map(c => c.textContent)));
  assert.deepEqual(versions.map(v => [v[0], v[7]]), [[META.instrumentVersion, "yes"]]);

  assert.equal(await page.$$eval("#cases tr", t => t.length), 1 + 6);
  assert.equal(await page.$$eval("#decisions tr", t => t.length), 1 + 30);
  assert.deepEqual(await page.$$eval("#levels tr td:first-child", t => t.map(x => x.textContent)), ["High", "Moderate", "Low", "Very low"]);

  /* raw JSON: every stored record, as stored */
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#json")]);
  assert.equal(dl.suggestedFilename(), "survey-raw.json");
  const raw = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  const sortPid = a => [...a].sort((x, y) => x.pid < y.pid ? -1 : 1);
  assert.deepEqual(sortPid(raw.responses), sortPid(all));
  assert.equal(raw.counts.total, all.length);
  assert.equal(raw.counts.earlier_instrument, 1);
  assert.equal(raw.counts.anomalous, 1);

  /* CSV: completed responses only, thirty rows each */
  const [csvDl] = await Promise.all([page.waitForEvent("download"), page.click("#csv")]);
  const lines = fs.readFileSync(await csvDl.path(), "utf8").split("\n");
  assert.equal(lines.length, 1 + 30 * complete);
  const pids = new Set(lines.slice(1).map(l => l.split(",")[0]));
  assert.ok(pids.has(fresh.pid));
  for (const p of ["anomalous1", "unfinished1", "oldpilot"]) assert.ok(!pids.has(p), p + " must not be in the CSV");

  /* the raw file pastes back into Add responses on a host with no live data */
  const imp = await env.newPage();
  await imp.goto(env.base + "/#researcher=wrong-key");
  await imp.waitForSelector("#paste");
  await imp.fill("#paste", JSON.stringify(raw));
  await imp.click("#addr");
  await imp.waitForFunction(n => (document.getElementById("counts") || {}).textContent?.startsWith(n + " completed"), complete);
  assert.match(await imp.textContent("#counts"), /1 marked finished but incomplete; 1 from an earlier version/);
});

test("dashboard with no completed responses still lists the status tables and offers raw JSON", async () => {
  const solo = await setup();
  try {
    const anomalous = JSON.parse(JSON.stringify(fresh));
    anomalous.pid = "onlyanomalous";
    delete anomalous.cases[fresh.caseOrder[0]].final;
    await solo.fn.post(anomalous);
    await solo.fn.post(earlierPilotRecord("onlyold"));
    const page = await solo.newPage();
    await page.goto(solo.base + "/#researcher=" + KEY);
    await page.waitForSelector("#anomalous");
    assert.match(await page.textContent("#app"), /No completed responses yet/);
    assert.match(await page.textContent("#counts"), /^0 completed responses; 0 unfinished; 1 marked finished but incomplete; 1 from an earlier version/);
    assert.deepEqual(await page.$$eval("#anomalous tr:nth-child(2) td", t => t.slice(0, 3).map(x => x.textContent)), ["onlyanomalous", "5/6", "6/6"]);
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#json")]);
    const raw = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
    assert.deepEqual(raw.responses.map(r => r.pid).sort(), ["onlyanomalous", "onlyold"]);
    assert.equal(await page.$("#csv"), null, "no analysis CSV without completed responses");
  } finally { await solo.close(); }
});
