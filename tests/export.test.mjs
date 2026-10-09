/* Record classification, the raw JSON export, the instrument table and
   the version columns of the analytical CSV. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";
import { makeRecord, earlierPilotRecord } from "./helpers/records.mjs";

const site = loadSite();
const run = src => plain(site.run(src));
const J = x => JSON.stringify(x);

test("recordState: complete, in_progress, anomalous, earlier_instrument", () => {
  const cases = [
    [makeRecord(site, {}), "complete"],
    [makeRecord(site, { done: false }), "in_progress"],
    [makeRecord(site, { done: false, firsts: 2, finals: 1 }), "in_progress"],
    [makeRecord(site, { firsts: 5, finals: 5 }), "anomalous"],
    [makeRecord(site, { firsts: 6, finals: 5 }), "anomalous"],
    [makeRecord(site, { firsts: 0, finals: 0 }), "anomalous"],
    [{ pid: "nocases", done: true, schemaVersion: 3 }, "anomalous"],
    [earlierPilotRecord("old", true), "earlier_instrument"],
    [earlierPilotRecord("old2", false), "earlier_instrument"],
    [{ pid: "noschema", done: true, cases: {} }, "earlier_instrument"],
    [makeRecord(site, { schema: 2 }), "earlier_instrument"]
  ];
  for (const [r, want] of cases) assert.equal(run(`recordState(${J(r)})`), want, r.pid + " " + want);
});

test("raw export holds every record exactly as saved, earlier versions included", () => {
  const complete = makeRecord(site, { pid: "c1" });
  complete.contact = { name: "A Person", mobile: "999" };
  complete.lastServerSeq = 14; complete.clientSavedAt = "2026-10-01T10:30:00.000Z";
  const prog = makeRecord(site, { pid: "p1", done: false, firsts: 3, finals: 2 });
  const anom = makeRecord(site, { pid: "a1", firsts: 5, finals: 5 });
  const old = earlierPilotRecord("old");
  const recs = [complete, prog, anom, old];
  const out = run(`rawExport(${J(recs)}, {c1:"server", p1:"device_archive", a1:"imported", old:"server"})`);

  assert.equal(out.format, "inbasket-raw-records");
  assert.deepEqual(out.responses, recs, "records are passed through untouched");
  assert.deepEqual(out.counts, { total: 4, complete: 1, in_progress: 1, anomalous: 1, earlier_instrument: 1 });
  assert.deepEqual(out.index.map(i => [i.pid, i.state, i.source, i.casesCompleted, i.firstPlans]), [
    ["c1", "complete", "server", 6, 6], ["p1", "in_progress", "device_archive", 2, 3],
    ["a1", "anomalous", "imported", 5, 5], ["old", "earlier_instrument", "server", 1, 1]]);
  assert.deepEqual(out.scoredWith, run("instrumentMeta()"));

  /* the fields the manual asks to be recorded */
  const r = out.responses[0];
  for (const k of ["pid", "status", "done", "instrument", "schemaVersion", "aiCondition", "aiLevels", "caseOrder",
                   "bg", "end", "pilot", "contact", "practice", "saveSeq", "saveReason", "started", "finished", "totalMin"])
    assert.ok(k in r, "missing " + k);
  for (const k of ["decisionOrder", "first", "final", "ai", "conf", "reason", "msA", "msB", "tA", "tB", "pos"])
    assert.ok(k in r.cases[3], "case field missing " + k);
  for (const k of ["level", "condition", "actions", "why", "score"]) assert.ok(k in r.cases[3].ai, "ai field missing " + k);
});

test("raw export is a copy: changing it does not touch the records", () => {
  site.run(`globalThis.__recs = ${J([makeRecord(site, { pid: "x" })])}; globalThis.__out = rawExport(__recs); __out.responses[0].pid = "changed";`);
  assert.equal(run("__recs[0].pid"), "x");
});

test("CSV instrument columns: recorded and scored-with hashes", () => {
  const recs = [makeRecord(site, { pid: "new" })];
  const lines = run(`toCSV(personRows(${J(recs)}))`).split("\n");
  const head = lines[0].split(",");
  assert.deepEqual(head.slice(-6), ["instrument_version", "scoring_version", "recorded_cases_hash",
    "recorded_key_hash", "scored_with_cases_hash", "scored_with_key_hash"]);
  const now = run("instrumentMeta()");
  assert.deepEqual(lines[1].split(",").slice(-6), ["survey-2026-10-round2", "2", now.casesHash, now.keyHash, now.casesHash, now.keyHash]);
});

test("instrument table names versions and flags re-scoring", () => {
  const cur = makeRecord(site, { pid: "cur" });
  const other = makeRecord(site, { pid: "other" });
  other.instrument = { ...other.instrument, instrumentVersion: "survey-older", keyHash: "12345678" };
  const nostamp = makeRecord(site, { pid: "nostamp" });
  delete nostamp.instrument;
  const html = run(`instrumentTable(${J([cur, other, nostamp])})`);
  assert.match(html, /survey-2026-10-round2[\s\S]*yes/);
  assert.match(html, /survey-older[\s\S]*no, re-scored with the current key/);
  assert.match(html, /not recorded/);
  assert.match(html, /1 completed response was collected under a different version/);
  assert.match(html, /1 completed response was saved without an instrument version/);
  assert.equal(run("instrumentTable([])"), "");
});
