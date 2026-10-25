/* The Netlify Function (netlify/functions/responses.mjs) over an
   in-memory Blobs store: same-PID upsert, saveSeq ordering, complete
   beats in-progress, compare-and-set, and the read key. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadFunction } from "./helpers/fnstore.mjs";

test("function is mounted at /api/responses", async () => {
  const fn = await loadFunction();
  assert.equal(fn.config.path, "/api/responses");
});

test("same PID upserts one record; newer checkpoints replace older", async () => {
  const fn = await loadFunction();
  assert.deepEqual((await fn.post({ pid: "p1", saveSeq: 1, done: false })).json,
    { ok: true, id: "p1", saveSeq: 1, status: "in_progress" });
  await fn.post({ pid: "p1", saveSeq: 2, done: false, step: 2 });
  assert.equal(fn.db().size, 1);
  assert.equal(fn.stored("p1").step, 2);
  assert.equal(fn.stored("p1").status, "in_progress");
  assert.ok(fn.stored("p1").receivedAt);
});

test("a stale checkpoint cannot overwrite a newer one", async () => {
  const fn = await loadFunction();
  await fn.post({ pid: "p1", saveSeq: 5, done: false, mark: "new" });
  const r = await fn.post({ pid: "p1", saveSeq: 3, done: false, mark: "old" });
  assert.deepEqual(r.json, { ok: true, id: "p1", ignored: "older_checkpoint", saveSeq: 5 });
  assert.equal(fn.stored("p1").mark, "new");
  /* an equal seq is a retry of the same checkpoint and is accepted */
  await fn.post({ pid: "p1", saveSeq: 5, done: false, mark: "same" });
  assert.equal(fn.stored("p1").mark, "same");
});

test("a complete record beats any in-progress record", async () => {
  const fn = await loadFunction();
  await fn.post({ pid: "p1", saveSeq: 4, done: true });
  const r = await fn.post({ pid: "p1", saveSeq: 99, done: false });
  assert.equal(r.json.ignored, "already_complete");
  assert.equal(fn.stored("p1").status, "complete");
  /* and a finished copy with a lower seq still replaces an unfinished one */
  await fn.post({ pid: "p2", saveSeq: 9, done: false });
  await fn.post({ pid: "p2", saveSeq: 1, done: true });
  assert.equal(fn.stored("p2").status, "complete");
  /* between two finished copies the higher seq wins */
  const s = await fn.post({ pid: "p1", saveSeq: 2, done: true });
  assert.equal(s.json.ignored, "older_checkpoint");
});

test("compare-and-set: a write that lands between read and set is re-checked", async () => {
  const fn = await loadFunction();
  await fn.post({ pid: "p3", saveSeq: 1, done: false });
  fn.hooks.beforeSet = async db => db.set("p3", { v: JSON.stringify({ pid: "p3", saveSeq: 7, done: false }), e: "race" });
  const r = await fn.post({ pid: "p3", saveSeq: 5, done: false });
  assert.equal(r.json.ignored, "older_checkpoint");
  assert.equal(fn.stored("p3").saveSeq, 7);
});

test("compare-and-set on a brand new PID", async () => {
  const fn = await loadFunction();
  fn.hooks.beforeSet = async db => db.set("p4", { v: JSON.stringify({ pid: "p4", saveSeq: 2, done: true }), e: "race" });
  const r = await fn.post({ pid: "p4", saveSeq: 1, done: false });
  assert.equal(r.json.ignored, "already_complete");
});

test("bad requests are refused", async () => {
  const fn = await loadFunction();
  assert.equal((await fn.post("{")).status, 400);
  assert.equal((await fn.post({ x: 1 })).status, 400);
  assert.equal((await fn.post({ pid: "!!!" })).json.error, "bad pid");
  assert.equal((await fn.post("x".repeat(256 * 1024 + 1))).status, 413);
  const put = await fn.handler(new Request("http://site/api/responses", { method: "PUT" }));
  assert.equal(put.status, 405);
});

test("PID is cleaned before it becomes the Blob key", async () => {
  const fn = await loadFunction();
  const r = await fn.post({ pid: "ab c/../d!", saveSeq: 1 });
  assert.equal(r.json.id, "abcd");
  assert.ok(fn.db().has("abcd"));
});

test("GET needs DASHBOARD_KEY and returns every record", async () => {
  const fn = await loadFunction();
  const saved = process.env.DASHBOARD_KEY;
  try {
    await fn.post({ pid: "a", saveSeq: 1 });
    await fn.post({ pid: "b", saveSeq: 1, done: true });
    delete process.env.DASHBOARD_KEY;
    assert.equal((await fn.get("x")).status, 503);
    process.env.DASHBOARD_KEY = "secret";
    assert.equal((await fn.get("x")).status, 401);
    assert.equal((await fn.get()).status, 401);
    const ok = await fn.get("secret");
    assert.equal(ok.status, 200);
    assert.equal(ok.json.count, 2);
    assert.deepEqual(ok.json.responses.map(r => r.pid).sort(), ["a", "b"]);
  } finally {
    if (saved === undefined) delete process.env.DASHBOARD_KEY; else process.env.DASHBOARD_KEY = saved;
  }
});

test("the instrument stamp of the first stored copy is never replaced", async () => {
  const fn = await loadFunction();
  const stamp = { instrumentVersion: "v1", keyHash: "aaaa0000", casesHash: "bbbb0000", scoringVersion: 1 };
  await fn.post({ pid: "s1", saveSeq: 1, done: false, instrument: stamp });
  await fn.post({ pid: "s1", saveSeq: 2, done: false, instrument: { ...stamp, keyHash: "ffffffff" } });
  await fn.post({ pid: "s1", saveSeq: 3, done: true });
  const r = fn.stored("s1");
  assert.equal(r.saveSeq, 3);
  assert.equal(r.status, "complete");
  assert.deepEqual(r.instrument, stamp);
});

test("a record first stored without a stamp (older survey code) never gains one", async () => {
  const fn = await loadFunction();
  await fn.post({ pid: "old1", saveSeq: 4, done: false, answers: 1 });
  await fn.post({ pid: "old1", saveSeq: 5, done: true, answers: 2, instrument: { instrumentVersion: "new" } });
  const r = fn.stored("old1");
  assert.equal(r.answers, 2);
  assert.equal("instrument" in r, false);
});

test("a brand new PID keeps the stamp it arrives with", async () => {
  const fn = await loadFunction();
  await fn.post({ pid: "n1", saveSeq: 1, instrument: { instrumentVersion: "x" } });
  assert.deepEqual(fn.stored("n1").instrument, { instrumentVersion: "x" });
});

test("health check writes, reads and deletes a probe without a key, and touches no responses", async () => {
  const fn = await loadFunction();
  await fn.post({ pid: "keep1", saveSeq: 1 });
  const r = await fn.get(null).then(() => fn.handler(new Request("http://site/api/responses?health=1")));
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.ok, true);
  assert.equal(j.fallbackOk, true);
  assert.ok(j.steps.length >= 7 && j.steps.every(x => x.ok), JSON.stringify(j.steps));
  assert.equal(typeof j.dashboardKeySet, "boolean");
  assert.equal(j.responses, undefined, "no records in a health answer");
  assert.deepEqual([...fn.db().keys()], ["keep1"], "response store untouched");
});

test("health check names the failing step and says whether the fallbacks would still save", async () => {
  const run = async failOn => {
    const fn = await loadFunction();
    fn.hooks.failOn = failOn;
    const r = await fn.handler(new Request("http://site/api/responses?health=1"));
    const j = await r.json();
    return { status: r.status, j, failed: j.steps.filter(x => !x.ok).map(x => x.step) };
  };
  const set = await run("set");
  assert.equal(set.status, 500);
  assert.deepEqual([set.j.ok, set.j.fallbackOk], [false, false]);
  assert.ok(set.failed.includes("conditional write: only if new") && set.failed.includes("plain write"));
  assert.equal(set.j.steps.find(x => x.step === "plain write").error, "BlobsInternalError: mock write failure");
  const cond = await run("conditional");
  assert.deepEqual([cond.j.ok, cond.j.fallbackOk], [false, true], "plain writes still work, so saves land");
  assert.ok(cond.failed.includes("conditional write: only if new"));
  const strong = await run("strong");
  assert.deepEqual([strong.j.ok, strong.j.fallbackOk], [false, true]);
  assert.ok(strong.failed.includes("read with metadata (strong)"));
  assert.equal(typeof strong.j.blobsEnvironment, "boolean");
});

test("strong reads refused: saves still land, and the saveSeq rules still hold", async () => {
  const fn = await loadFunction();
  fn.hooks.failOn = "strong";
  assert.equal((await fn.post({ pid: "s1", saveSeq: 1 })).json.status, "in_progress");
  await fn.post({ pid: "s1", saveSeq: 3, done: true });
  assert.equal((await fn.post({ pid: "s1", saveSeq: 9 })).json.ignored, "already_complete");
  assert.equal(fn.stored("s1").saveSeq, 3);
});

test("conditional writes refused: saves land as plain writes, rules checked against a fresh read", async () => {
  const fn = await loadFunction();
  fn.hooks.failOn = "conditional";
  const r = await fn.post({ pid: "c1", saveSeq: 1, instrument: { v: 1 } });
  assert.equal(r.status, 200);
  assert.equal(r.json.mode, "unconditional");
  await fn.post({ pid: "c1", saveSeq: 4, instrument: { v: 2 } });
  assert.deepEqual(fn.stored("c1").instrument, { v: 1 }, "first instrument stamp kept");
  assert.equal((await fn.post({ pid: "c1", saveSeq: 2 })).json.ignored, "older_checkpoint");
  await fn.post({ pid: "c1", saveSeq: 5, done: true });
  assert.equal((await fn.post({ pid: "c1", saveSeq: 9 })).json.ignored, "already_complete");
  assert.equal(fn.stored("c1").status, "complete");
});

test("nothing readable and conditional writes refused: only a finished copy is written", async () => {
  const fn = await loadFunction();
  await fn.post({ pid: "u1", saveSeq: 2, done: false, mark: "kept" });
  fn.hooks.failOn = ["read", "conditional"];
  const r1 = await fn.post({ pid: "u1", saveSeq: 3, mark: "blind" });
  assert.equal(r1.status, 503, "an unfinished checkpoint is never written blind");
  assert.equal(fn.stored("u1").mark, "kept");
  const r2 = await fn.post({ pid: "u1", saveSeq: 4, done: true, mark: "finished" });
  assert.equal(r2.status, 200);
  assert.equal(r2.json.mode, "unconditional");
  fn.hooks.failOn = null;
  assert.equal(fn.stored("u1").mark, "finished");
});

test("a store failure during a save answers 500 with the real error, as JSON", async () => {
  const fn = await loadFunction();
  fn.hooks.failOn = "set";
  const r = await fn.post({ pid: "f1", saveSeq: 1 });
  assert.equal(r.status, 500);
  assert.deepEqual(r.json, { error: "server error", detail: "BlobsInternalError: mock write failure" });
  fn.hooks.failOn = null;
  assert.equal((await fn.post({ pid: "f1", saveSeq: 1 })).status, 200, "recovers once the store works");
});

test("an unreadable record is only ever written as new, never over an existing one", async () => {
  const fn = await loadFunction();
  await fn.post({ pid: "r1", saveSeq: 9, done: true, mark: "kept" });
  fn.hooks.failOn = "read";
  const r = await fn.post({ pid: "r1", saveSeq: 1, done: false, mark: "stale" });
  assert.equal(r.status, 409, "gives up rather than overwrite blind");
  fn.hooks.failOn = null;
  assert.equal(fn.stored("r1").mark, "kept");
});
