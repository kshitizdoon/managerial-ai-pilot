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
