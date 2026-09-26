/* Client-side checkpointing (storage.js): saveSeq, retries, the local
   backup, and which copy of a PID wins when several exist. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";

const LS_KEY = "inbasket_pilot_v2";

/* a fetch that records bodies; `plan` is a list of statuses to return in turn */
function fakeFetch(plan = []){
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), keepalive: init.keepalive });
    const status = plan.length ? plan.shift() : 200;
    return { ok: status < 400, status, text: async () => "", json: async () => ({}) };
  };
  f.calls = calls;
  return f;
}

function freshRecord(site, pid = "pidA"){
  site.run(`globalThis.R = {pid:"${pid}", version:"A", deferMode:"split", cases:{}, done:false, at:0, order:[0,1,2,3,4,5]}; saveLocal(R);`);
}

test("saveSeq rises by one on every checkpoint and every body carries the same PID", async () => {
  const fetch = fakeFetch();
  const site = loadSite({ fetch });
  freshRecord(site);
  for (const reason of ["background_complete", "case_1_first_plan", "case_1_complete"]) {
    assert.equal(await site.run(`checkpointResponse(R, "${reason}")`), "function");
  }
  assert.deepEqual(fetch.calls.map(c => c.body.saveSeq), [1, 2, 3]);
  assert.deepEqual(fetch.calls.map(c => c.body.pid), ["pidA", "pidA", "pidA"]);
  assert.deepEqual(fetch.calls.map(c => c.body.saveReason), ["background_complete", "case_1_first_plan", "case_1_complete"]);
  assert.ok(fetch.calls.every(c => c.url === "/api/responses" && c.keepalive === true));
  const local = JSON.parse(site.localStorage.getItem(LS_KEY));
  assert.equal(local.saveSeq, 3);
  assert.equal(local.lastServerSeq, 3);
  assert.equal(local.lastServerSaveOK, true);
});

test("checkpoint body is frozen when the call is made", async () => {
  const fetch = fakeFetch();
  const site = loadSite({ fetch });
  freshRecord(site);
  const p = site.run(`checkpointResponse(R, "one")`);
  site.run(`R.cases[1] = {first:{own:"ops"}}`);          // edit after the call
  await p;
  assert.deepEqual(fetch.calls[0].body.cases, {});
});

test("status, casesCompleted and firstPlans are derived on every checkpoint", async () => {
  const fetch = fakeFetch();
  const site = loadSite({ fetch });
  freshRecord(site);
  site.run(`R.cases = {1:{first:{}, final:{}}, 2:{first:{}}}`);
  await site.run(`checkpointResponse(R, "x")`);
  const b = fetch.calls[0].body;
  assert.deepEqual([b.status, b.casesCompleted, b.firstPlans], ["in_progress", 1, 2]);
  site.run("R.done = true");
  await site.run(`submitResponse(R)`);
  const f = fetch.calls[1].body;
  assert.deepEqual([f.status, f.saveReason, f.saveSeq], ["complete", "finish", 2]);
});

test("a failed save is tried three times, then reported; the next save repairs it", async () => {
  const fetch = fakeFetch([500, 500, 500]);
  const site = loadSite({ fetch });
  freshRecord(site);
  assert.equal(await site.run(`checkpointResponse(R, "a")`), null);
  assert.equal(fetch.calls.length, 3);
  assert.ok(fetch.calls.every(c => c.body.saveSeq === 1));
  let local = JSON.parse(site.localStorage.getItem(LS_KEY));
  assert.equal(local.lastServerSaveOK, false);
  assert.match(local.lastServerSaveError, /function 500/);
  assert.equal(await site.run(`checkpointResponse(R, "b")`), "function");
  local = JSON.parse(site.localStorage.getItem(LS_KEY));
  assert.deepEqual([local.saveSeq, local.lastServerSeq, local.lastServerSaveOK, local.lastServerSaveError], [2, 2, true, null]);
});

test("a retry of an old checkpoint stops once a newer one reached the server", async () => {
  const fetch = fakeFetch([500]);                       // first try of seq 1 fails
  const site = loadSite({ fetch });
  freshRecord(site);
  const older = site.run(`checkpointResponse(R, "old")`);
  const newer = site.run(`checkpointResponse(R, "new")`);
  assert.equal(await newer, "function");
  assert.equal(await older, "function");
  /* seq1 try 1 (failed), seq2 try 1 (ok); seq1 never retried */
  assert.deepEqual(fetch.calls.map(c => c.body.saveSeq), [1, 2]);
  assert.equal(plain(site.run("R.lastServerSeq")), 2);
});

test("a late save never writes an old participant back over a new one on the device", async () => {
  let release;
  const gate = new Promise(r => { release = r; });
  const fetch = async () => { await gate; return { ok: true, status: 200, text: async () => "" }; };
  const site = loadSite({ fetch });
  freshRecord(site, "old");
  const p = site.run(`checkpointResponse(R, "slow")`);
  site.run(`saveLocal({pid:"new", cases:{}})`);
  release();
  await p;
  assert.equal(JSON.parse(site.localStorage.getItem(LS_KEY)).pid, "new");
});

test("storage 'local' (single-file bundle) never calls the server", async () => {
  const fetch = fakeFetch();
  const site = loadSite({ fetch });
  site.run(`CONFIG.storage = "local"`);
  freshRecord(site);
  assert.equal(await site.run(`checkpointResponse(R, "x")`), null);
  assert.equal(fetch.calls.length, 0);
  assert.equal(JSON.parse(site.localStorage.getItem(LS_KEY)).saveSeq, 1);
});

test("mergeRecords: finished beats unfinished, then higher saveSeq, ties keep the first", () => {
  const site = loadSite();
  const pick = lists => plain(site.run(`mergeRecords(...${JSON.stringify(lists)}).map(r => r.t)`));
  assert.deepEqual(pick([[{ pid: "x", saveSeq: 9, done: false, t: "srv" }], [{ pid: "x", saveSeq: 2, done: true, t: "imp" }]]), ["imp"]);
  assert.deepEqual(pick([[{ pid: "x", saveSeq: 2, done: true, t: "a" }], [{ pid: "x", saveSeq: 9, done: false, t: "b" }]]), ["a"]);
  assert.deepEqual(pick([[{ pid: "x", saveSeq: 3, t: "a" }], [{ pid: "x", saveSeq: 5, t: "b" }]]), ["b"]);
  assert.deepEqual(pick([[{ pid: "x", saveSeq: 5, t: "a" }], [{ pid: "x", saveSeq: 3, t: "b" }]]), ["a"]);
  assert.deepEqual(pick([[{ pid: "x", saveSeq: 4, t: "a" }], [{ pid: "x", saveSeq: 4, t: "b" }]]), ["a"]);
  assert.deepEqual(pick([[{ pid: "x", t: "a" }, { pid: "y", t: "c" }, { t: "nopid" }]]), ["a", "c"]);
});

test("archive keeps earlier sessions on the device, newest 20, one per PID", () => {
  const site = loadSite();
  for (let i = 0; i < 23; i++) site.run(`saveLocal({pid:"p${i}"}); archiveLocal();`);
  site.run(`saveLocal({pid:"p22", v:2}); archiveLocal();`);
  const a = plain(site.run("archivedRows()"));
  assert.equal(a.length, 20);
  assert.equal(a.filter(r => r.pid === "p22").length, 1);
  assert.equal(a[a.length - 1].v, 2);
});
