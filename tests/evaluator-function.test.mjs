/* The Evaluator function (netlify/functions/evaluator.mjs) over the same
   in-memory stores as the Producer function: switches, access rules,
   persistence of assignments, privacy of what is returned, and saving. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadFunctions } from "./helpers/fnstore.mjs";
import { loadSite } from "./helpers/load.mjs";
import { makeRecord } from "./helpers/records.mjs";

const site = loadSite();
const FIRSTS = ["pref", "own", "delegate", "wait", "hold"];
const ENV = ["EVALUATOR_ENABLED", "EVALUATOR_MIN_PRODUCER_MINUTES", "EVALUATOR_REQUIRE_ATTENTION",
             "EVALUATOR_INCLUDE_LEGACY_CONSENT", "EVALUATOR_MIN_TARGETS", "DASHBOARD_KEY"];

async function env(vars, fn){
  const saved = Object.fromEntries(ENV.map(k => [k, process.env[k]]));
  ENV.forEach(k => delete process.env[k]);
  Object.assign(process.env, vars);
  try { return await fn(); }
  finally { ENV.forEach(k => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }); }
}

async function setup(nProducers = 6, extra = {}){
  const f = await loadFunctions();
  const call = async (handler, url, body) => {
    const res = await handler(new Request(url, body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }));
    return { status: res.status, json: await res.json() };
  };
  const ev = (body) => call(f.evaluator.default, "http://site/api/evaluator", body);
  const evGet = (q) => call(f.evaluator.default, "http://site/api/evaluator" + q);
  const produce = (rec) => call(f.responses.default, "http://site/api/responses", rec);
  for (let i = 0; i < nProducers; i++)
    await produce(makeRecord(site, { pid: "prod" + i, condition: i % 4, first: FIRSTS[i % 5], final: i % 2 ? "ai" : "first",
                                     contact: { name: "Person " + i, mobile: "90000000" + i }, ...extra }));
  const stored = (store, id) => { const r = f.db(store).get(id); return r ? JSON.parse(r.v) : null; };
  return { f, ev, evGet, produce, stored };
}

const ON = { EVALUATOR_ENABLED: "1" };

test("mounted at /api/evaluator; status says only whether it is on", async () => {
  const { f, evGet } = await setup(0);
  assert.equal(f.evaluator.config.path, "/api/evaluator");
  await env({}, async () => assert.deepEqual((await evGet("?status=1")).json, { enabled: false }));
  await env(ON, async () => assert.deepEqual((await evGet("?status=1")).json, { enabled: true }));
});

test("off by default: no assignments are made", async () => {
  const { ev, f } = await setup(6);
  await env({}, async () => {
    const r = await ev({ action: "assign", pid: "prod0" });
    assert.equal(r.status, 403);
    assert.equal(f.db("evaluator-assignments").size, 0);
  });
});

test("only someone who finished Part 1 under that PID gets an assignment", async () => {
  const { ev, produce } = await setup(6);
  await env(ON, async () => {
    assert.equal((await ev({ action: "assign", pid: "stranger" })).status, 403);
    await produce(makeRecord(site, { pid: "halfway", done: false }));
    assert.equal((await ev({ action: "assign", pid: "halfway" })).status, 403);
    assert.equal((await ev({ action: "assign" })).status, 400);
  });
});

test("an assignment is made once, stored, and returned unchanged on every later call", async () => {
  const { ev, stored } = await setup(6);
  await env(ON, async () => {
    const first = await ev({ action: "assign", pid: "prod0" });
    assert.equal(first.status, 200);
    assert.equal(first.json.status, "assigned");
    const again = await ev({ action: "assign", pid: "prod0" });
    assert.deepEqual(again.json, first.json, "same people, same order, same tokens");
    const a = stored("evaluator-assignments", "prod0");
    assert.equal(a.id, first.json.view.assignmentId);
    assert.ok(a.slots.every(s => s.target.pid !== "prod0"), "never one's own record");
    assert.equal(new Set(a.slots.map(s => s.target.pid)).size, 3);
  });
  /* still returned after the stage is switched off, so a respondent mid-way can finish */
  await env({}, async () => assert.equal((await ev({ action: "assign", pid: "prod0" })).json.status, "assigned"));
});

test("the response carries no identity, contact details, background, ability or condition", async () => {
  const { ev } = await setup(6);
  await env(ON, async () => {
    const r = await ev({ action: "assign", pid: "prod1" });
    const text = JSON.stringify(r.json);
    for (const bad of ["Person ", "90000000", "prod", "PGP", "Daily"])
      assert.ok(!text.includes(bad), "response leaks " + bad);
    const keys = new Set();
    (function walk(x){ if (x && typeof x === "object") Object.entries(x).forEach(([k, v]) => { keys.add(k); walk(v); }); })(r.json);
    for (const bad of ["pid", "target", "mda", "mdaLoo", "stratum", "condition", "aiLevel", "contact", "bg", "instrument"])
      assert.ok(!keys.has(bad), "response has a field " + bad);
    assert.ok(r.json.view.items.every(i => i.decisions.length === 3));
  });
});

test("displayed decisions are the target's own recorded actions", async () => {
  const { ev, stored } = await setup(8);
  await env(ON, async () => {
    const r = await ev({ action: "assign", pid: "prod2" });
    const a = stored("evaluator-assignments", "prod2");
    for (const item of r.json.view.items) {
      const slot = a.slots.find(s => s.token === item.token);
      const rec = stored("pilot-responses", slot.target.pid).cases[a.caseId];
      for (const d of item.decisions) {
        assert.equal(d.final, rec.final[d.k]);
        if (d.first !== undefined) assert.equal(d.first, rec.first[d.k]);
        if (d.ai) assert.deepEqual(d.ai, { action: rec.ai.actions[d.k], why: rec.ai.why[d.k] });
      }
      assert.equal(!!item.decisions[0].ai, slot.condition !== "A");
      assert.equal(item.decisions[0].first !== undefined, slot.condition === "C");
    }
  });
});

test("not enough eligible records: says so, stores nothing, makes nothing up", async () => {
  const { ev, f } = await setup(3);           // three others exist, but one is the evaluator
  await env(ON, async () => {
    const r = await ev({ action: "assign", pid: "prod0" });
    assert.deepEqual(r.json, { status: "not_enough", eligible: 2, needed: 3 });
    assert.equal(f.db("evaluator-assignments").size, 0);
  });
  /* the five-minute rule is applied */
  const fast = await setup(6, { totalMin: 3 });
  await env(ON, async () => assert.equal((await fast.ev({ action: "assign", pid: "prod0" })).json.status, "not_enough"));
  await env({ ...ON, EVALUATOR_MIN_PRODUCER_MINUTES: "2" }, async () =>
    assert.equal((await fast.ev({ action: "assign", pid: "prod0" })).json.status, "assigned"));
  /* records without reuse consent are left out unless the researcher admits them */
  const legacy = await setup(6, { consent: null });
  await env(ON, async () => assert.equal((await legacy.ev({ action: "assign", pid: "prod0" })).json.status, "not_enough"));
  await env({ ...ON, EVALUATOR_INCLUDE_LEGACY_CONSENT: "1" }, async () =>
    assert.equal((await legacy.ev({ action: "assign", pid: "prod0" })).json.status, "assigned"));
});

test("saving: checked against the assignment, same saveSeq rules, separate from the Producer record", async () => {
  const { ev, stored } = await setup(6);
  await env(ON, async () => {
    const { json: { view } } = await ev({ action: "assign", pid: "prod3" });
    const [t1, t2, t3] = view.items.map(i => i.token);
    const producerBefore = JSON.stringify(stored("pilot-responses", "prod3"));
    const save = (record) => ev({ action: "save", record: { pid: "prod3", assignmentId: view.assignmentId, ...record } });
    assert.equal((await save({ saveSeq: 1, items: { [t1]: { rating: 64, conf: 3 } } })).status, 200);
    assert.equal(stored("evaluator-responses", "prod3").status, "in_progress");
    assert.equal((await save({ saveSeq: 1, items: { tNOPE: { rating: 1, conf: 1 } } })).status, 400);
    assert.equal((await ev({ action: "save", record: { pid: "nobody", assignmentId: "x" } })).status, 403);
    assert.equal((await save({ saveSeq: 2, done: true, items: { [t1]: { rating: 64, conf: 3 } } })).status, 400, "finished but incomplete is refused");
    const full = { [t1]: { rating: 64, conf: 3 }, [t2]: { rating: 20, conf: 2 }, [t3]: { rating: 90, conf: 5, why: "clear reasons" } };
    assert.equal((await save({ saveSeq: 3, done: true, items: full, finished: "2026-10-25T10:00:00.000Z", totalMin: 4.5 })).json.status, "complete");
    const late = await save({ saveSeq: 9, done: false, items: { [t1]: { rating: 1, conf: 1 } } });
    assert.equal(late.json.ignored, "already_complete");
    const e = stored("evaluator-responses", "prod3");
    assert.equal(e.items[t3].why, "clear reasons");
    assert.equal(e.assignmentId, view.assignmentId);
    assert.equal(JSON.stringify(stored("pilot-responses", "prod3")), producerBefore, "Producer record untouched");
  });
});

test("researcher GET needs the key and returns assignments, evaluations and the pool", async () => {
  const { ev, evGet } = await setup(6);
  await env({ ...ON, DASHBOARD_KEY: "k" }, async () => {
    await ev({ action: "assign", pid: "prod0" });
    assert.equal((await evGet("?key=wrong")).status, 401);
    assert.equal((await evGet("")).status, 401);
    assert.equal((await evGet("?status=1&key=wrong")).status, 401, "status plus a key is treated as a key request");
    const r = await evGet("?key=k");
    assert.equal(r.status, 200);
    assert.equal(r.json.assignments.length, 1);
    assert.deepEqual(r.json.pool, { eligible: 6, total: 6, excluded: {}, minTargets: 3 });
    assert.ok(r.json.assignments[0].slots[0].target.mda >= 0, "ability is there for the researcher");
  });
});

test("a Producer who failed the attention check can still be rated, unless the researcher switches the rule on", async () => {
  const { ev } = await setup(6, { attention: false });
  await env(ON, async () => assert.equal((await ev({ action: "assign", pid: "prod0" })).json.status, "assigned"));
  const again = await setup(6, { attention: false });
  await env({ ...ON, EVALUATOR_REQUIRE_ATTENTION: "1" }, async () =>
    assert.equal((await again.ev({ action: "assign", pid: "prod0" })).json.status, "not_enough"));
});
