/* Record classification, anomalous records, the raw JSON export and the
   version columns of the analytical CSV. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";
import { makeRecord } from "./helpers/records.mjs";

const site = loadSite();
const run = src => plain(site.run(src));
const J = x => JSON.stringify(x);

function stamped(rec){
  return { ...rec, schemaVersion: 2, instrument: run("instrumentMeta()"),
    caseOrder: rec.order.map(i => i + 1) };
}

test("recordState: complete, in_progress and anomalous", () => {
  const cases = [
    [makeRecord(site, {}), "complete"],
    [makeRecord(site, { done: false }), "in_progress"],
    [makeRecord(site, { done: false, firsts: 2, finals: 1 }), "in_progress"],
    [makeRecord(site, { firsts: 5, finals: 5 }), "anomalous"],
    [makeRecord(site, { firsts: 6, finals: 5 }), "anomalous"],
    [makeRecord(site, { firsts: 0, finals: 0 }), "anomalous"],
    [{ pid: "nocases", done: true }, "anomalous"]
  ];
  for (const [r, want] of cases) assert.equal(run(`recordState(${J(r)})`), want, r.pid + " " + want);
});

test("anomalous records are excluded from statistics; complete ones are not", () => {
  const recs = [makeRecord(site, { pid: "ok" }), makeRecord(site, { pid: "nofinal", finals: 5 }),
                makeRecord(site, { pid: "short", firsts: 4, finals: 4 }), makeRecord(site, { pid: "prog", done: false })];
  assert.deepEqual(run(`personRows(${J(recs)}).map(p => p.pid)`), ["ok"]);
});

test("raw export holds every record exactly as saved", () => {
  const complete = stamped(makeRecord(site, { pid: "c1" }));
  complete.contact = { name: "A Person", mobile: "999" };
  complete.cases[1].ai = { version: "A", good: true, mode: "split", plan: { own: "ops" }, why: "text" };
  complete.lastServerSeq = 14; complete.clientSavedAt = "2026-09-01T10:20:00.000Z";
  const legacy = makeRecord(site, { pid: "old", version: "B" });
  const prog = stamped(makeRecord(site, { pid: "p1", done: false, firsts: 3, finals: 2 }));
  const anom = makeRecord(site, { pid: "a1", firsts: 5, finals: 5 });
  const recs = [complete, legacy, prog, anom];
  const out = run(`rawExport(${J(recs)}, {c1:"server", old:"server", p1:"device_archive", a1:"imported"})`);

  assert.equal(out.format, "inbasket-raw-records");
  assert.equal(out.formatVersion, 1);
  assert.deepEqual(out.responses, recs, "records are passed through untouched");
  assert.deepEqual(out.counts, { total: 4, complete: 2, in_progress: 1, anomalous: 1 });
  assert.deepEqual(out.index, [
    { pid: "c1", state: "complete", source: "server", casesCompleted: 6, firstPlans: 6, saveSeq: complete.saveSeq, instrumentVersion: "pilot-2026-09" },
    { pid: "old", state: "complete", source: "server", casesCompleted: 6, firstPlans: 6, saveSeq: legacy.saveSeq, instrumentVersion: null },
    { pid: "p1", state: "in_progress", source: "device_archive", casesCompleted: 2, firstPlans: 3, saveSeq: prog.saveSeq, instrumentVersion: "pilot-2026-09" },
    { pid: "a1", state: "anomalous", source: "imported", casesCompleted: 5, firstPlans: 5, saveSeq: anom.saveSeq, instrumentVersion: null }
  ]);
  assert.deepEqual(out.scoredWith, run("instrumentMeta()"));
  assert.ok(!Number.isNaN(Date.parse(out.exportedAt)));

  /* the fields the export must keep, where present */
  const r = out.responses[0];
  for (const k of ["pid", "status", "done", "instrument", "schemaVersion", "version", "deferMode", "caseOrder", "order",
                   "bg", "end", "pilot", "contact", "saveSeq", "saveReason", "receivedAt", "clientSavedAt",
                   "lastServerSeq", "started", "finished", "totalMin", "msBg"]) assert.ok(k in r, "missing " + k);
  for (const k of ["cardOrder", "first", "final", "conf1", "menu", "msA", "msB", "pos", "errA", "errC", "ai"])
    assert.ok(k in r.cases[1], "case field missing " + k);
  assert.deepEqual(r.cases[1].first.del, complete.cases[1].first.del, "delegate choices kept");
});

test("raw export is a copy: changing it does not touch the records", () => {
  const recs = [makeRecord(site, { pid: "x" })];
  site.run(`globalThis.__recs = ${J(recs)}; globalThis.__out = rawExport(__recs); __out.responses[0].pid = "changed";`);
  assert.equal(run("__recs[0].pid"), "x");
});

test("CSV appends instrument columns; blank for records saved before versioning", () => {
  const recs = [stamped(makeRecord(site, { pid: "new" })), makeRecord(site, { pid: "old" })];
  const lines = run(`toCSV(personRows(${J(recs)}))`).split("\n");
  const head = lines[0].split(",");
  assert.deepEqual(head.slice(-6), ["instrument_version", "scoring_version", "recorded_cases_hash",
    "recorded_key_hash", "scored_with_cases_hash", "scored_with_key_hash"]);
  assert.equal(head.length, 33 + 6, "the original 33 columns are unchanged and first");
  const now = run("instrumentMeta()");
  const rowNew = lines.find(l => l.startsWith("new,")).split(",");
  const rowOld = lines.find(l => l.startsWith("old,")).split(",");
  assert.deepEqual(rowNew.slice(-6), ["pilot-2026-09", "1", now.casesHash, now.keyHash, now.casesHash, now.keyHash]);
  assert.deepEqual(rowOld.slice(-6), ["", "", "", "", now.casesHash, now.keyHash]);
});

test("instrument table names versions and flags re-scoring", () => {
  const cur = stamped(makeRecord(site, { pid: "cur" }));
  const other = stamped(makeRecord(site, { pid: "other" }));
  other.instrument = { ...other.instrument, instrumentVersion: "pilot-old", keyHash: "12345678" };
  const legacy = makeRecord(site, { pid: "legacy" });
  const html = run(`instrumentTable(${J([cur, other, legacy])})`);
  assert.match(html, /pilot-2026-09[\s\S]*yes/);
  assert.match(html, /pilot-old[\s\S]*no, re-scored with the current key/);
  assert.match(html, /not recorded/);
  assert.match(html, /1 completed response was collected under a different version/);
  assert.match(html, /1 completed response was saved before instrument versions were recorded/);
  assert.equal(run("instrumentTable([])"), "");
});
