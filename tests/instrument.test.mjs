/* Instrument/version metadata and stable case ids. */
import test from "node:test";
import assert from "node:assert/strict";
import { loadSite, plain } from "./helpers/load.mjs";

const site = loadSite();
const run = src => plain(site.run(src));

/* If one of these changes, cases.js or key.js changed. That is allowed,
   but it is a new instrument version: rename CONFIG.instrumentVersion,
   regenerate docs, and update these two pins in the same commit. */
const PINNED = { instrumentVersion: "pilot-2026-09", casesHash: "8d710671", keyHash: "3588d829", scoringVersion: 1 };

test("instrumentMeta describes the deployed instrument", () => {
  const m = run("instrumentMeta()");
  assert.deepEqual(m, {
    instrumentVersion: PINNED.instrumentVersion,
    scoringVersion: PINNED.scoringVersion,
    casesHash: PINNED.casesHash,
    keyHash: PINNED.keyHash,
    scoringConfig: { unlistedDelegateScore: 0, includeHoldInCaseScore: false },
    caseIds: [1, 2, 3, 4, 5, 6],
    goodVersion: { 1: "A", 2: "B", 3: "A", 4: "B", 5: "A", 6: "B" }
  });
  assert.equal(run("RECORD_SCHEMA"), 2);
});

test("fingerprints ignore key order and catch any content change", () => {
  assert.equal(run(`fingerprint({a:1, b:[1,{c:2, d:3}]})`), run(`fingerprint({b:[1,{d:3, c:2}], a:1})`));
  assert.notEqual(run(`fingerprint({a:1})`), run(`fingerprint({a:2})`));
  const s = loadSite();
  s.run("KEY[1].own.quality = 76");
  assert.notEqual(plain(s.run("instrumentMeta().keyHash")), PINNED.keyHash);
  assert.equal(plain(s.run("instrumentMeta().casesHash")), PINNED.casesHash);
  const c = loadSite();
  c.run(`caseById(2).issues[0].t += " "`);
  assert.notEqual(plain(c.run("instrumentMeta().casesHash")), PINNED.casesHash);
  const g = loadSite();
  g.run(`CONFIG.unlistedDelegateScore = 40`);
  assert.equal(plain(g.run(`sameInstrument(${JSON.stringify(run("instrumentMeta()"))})`)), false);
});

test("sameInstrument: true for this version, false for another, null when not recorded", () => {
  const m = run("instrumentMeta()");
  assert.equal(run(`sameInstrument(${JSON.stringify(m)})`), true);
  assert.equal(run(`sameInstrument(${JSON.stringify({ ...m, keyHash: "00000000" })})`), false);
  assert.equal(run(`sameInstrument(${JSON.stringify({ ...m, scoringVersion: 0 })})`), false);
  assert.equal(run("sameInstrument(undefined)"), null);
  assert.equal(run("sameInstrument(null)"), null);
});

test("checkKey refuses duplicate case ids", () => {
  const s = loadSite();
  s.run("caseById(6).id = 5");
  assert.match(plain(s.run("checkKey()")).join("\n"), /case id 5 is used twice/);
});

test("caseSequence follows stored case ids, and positions for older records", () => {
  assert.deepEqual(run(`caseSequence({caseOrder:[3,1,6,2,5,4], order:[0,1,2,3,4,5]}).map(c => c.id)`), [3, 1, 6, 2, 5, 4]);
  assert.deepEqual(run(`caseSequence({order:[2,0,5,1,4,3]}).map(c => c.id)`), [3, 1, 6, 2, 5, 4]);
});

test("reordering CASES does not move a new record to other cases", () => {
  const s = loadSite();
  s.run("CASES.reverse()");
  assert.deepEqual(plain(s.run(`caseSequence({caseOrder:[3,1,6,2,5,4], order:[2,0,5,1,4,3]}).map(c => c.id)`)), [3, 1, 6, 2, 5, 4]);
  /* an older record only has positions, which is exactly why ids are stored now */
  assert.deepEqual(plain(s.run(`caseSequence({order:[2,0,5,1,4,3]}).map(c => c.id)`)), [4, 6, 1, 5, 2, 3]);
});
