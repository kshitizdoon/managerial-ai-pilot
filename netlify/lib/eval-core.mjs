/* =============================================================
   eval-core.mjs — who an evaluator rates, and what they are shown.

   Pure functions, no storage, so every rule here is unit-tested.

   Targets are real, completed Producer records. Nothing is generated:
   every action shown is copied from the target's own record, and every
   AI recommendation is the exact text that target was shown.

   One assignment per evaluator:
   - one caselet and three of its five decisions, the same for all three
     people the evaluator rates, so the context and items are held
     constant across the three information conditions;
   - three different targets, one from each third of the eligible pool
     ranked by leave-one-case-out pre-AI ability (high, middle, low);
   - conditions A, B and C, one per target. Which ability third gets
     which condition, the presentation order, the caselet and the
     decision triple are each the least used so far (random among ties),
     so they balance across evaluators. Within a third, the target is
     the least shown so far, then the one whose AI-advice level and
     instrument version are least used under its condition.
   ============================================================= */

import { KEY, CASE_IDS, CASE_DECISIONS, RECORD_SCHEMA, INSTRUMENT_VERSION } from "./instrument-data.mjs";

export const CONDITIONS = ["A", "B", "C"];
export const STRATA = ["high", "middle", "low"];
export const EVAL_SCHEMA = 1;
/* first Producer consent text that covers showing decisions to other participants */
export const REUSE_CONSENT_VERSION = 2;
const ACTIONS = ["own", "delegate", "wait", "hold"];

/* researcher switches, all server-side environment variables */
export function settings(env = (typeof process !== "undefined" ? process.env : {})) {
  const flag = v => v === "1" || v === "true";
  return {
    enabled: flag(env.EVALUATOR_ENABLED),
    minMinutes: env.EVALUATOR_MIN_PRODUCER_MINUTES != null && env.EVALUATOR_MIN_PRODUCER_MINUTES !== ""
      ? Number(env.EVALUATOR_MIN_PRODUCER_MINUTES) : 5,
    requireAttention: env.EVALUATOR_REQUIRE_ATTENTION !== "0" && env.EVALUATOR_REQUIRE_ATTENTION !== "false",
    includeLegacyConsent: flag(env.EVALUATOR_INCLUDE_LEGACY_CONSENT),
    minTargets: Math.max(3, Number(env.EVALUATOR_MIN_TARGETS || 3))
  };
}

/* ---- scoring (same rules as js/scoring.js) ------------------------------ */
function decisionScore(caseId, k, a) {
  const row = (KEY[caseId] || {})[k];
  return row && row[a] != null ? row[a] : 0;
}
export function caseFirstScore(rec, caseId) {
  const c = rec.cases[caseId];
  return CASE_DECISIONS[caseId].reduce((s, k) => s + decisionScore(caseId, k, c.first[k]), 0);
}
/* pre-AI managerial decision-making ability: mean first-answer case score, 0-100 */
export function mda(rec) {
  return CASE_IDS.reduce((s, id) => s + caseFirstScore(rec, id), 0) / CASE_IDS.length;
}
/* the same, leaving out one caselet: the criterion when that caselet is shown */
export function mdaLoo(rec, caseId) {
  const ids = CASE_IDS.filter(id => id !== caseId);
  return ids.reduce((s, id) => s + caseFirstScore(rec, id), 0) / ids.length;
}

/* ---- eligibility --------------------------------------------------------- */
export function isCompleteProducer(r) {
  if (!r || r.schemaVersion !== RECORD_SCHEMA || !r.done || !r.cases) return false;
  return CASE_IDS.every(id => {
    const c = r.cases[id];
    return c && c.first && c.final && CASE_DECISIONS[id].every(k => ACTIONS.includes(c.first[k]) && ACTIONS.includes(c.final[k]));
  });
}
export function producerMinutes(r) {
  if (Number.isFinite(r.totalMin)) return r.totalMin;
  const t = (new Date(r.finished) - new Date(r.started)) / 60000;
  return Number.isFinite(t) ? t : NaN;
}
function hasAiRecord(r) {
  return CASE_IDS.every(id => {
    const a = r.cases[id].ai;
    return a && a.actions && a.why && CASE_DECISIONS[id].every(k => ACTIONS.includes(a.actions[k]) && typeof a.why[k] === "string" && a.why[k]);
  });
}
export function consentCoversReuse(r) {
  return !!(r && r.consent && r.consent.reuseForEvaluation === true && Number(r.consent.version) >= REUSE_CONSENT_VERSION);
}

/* {ok, reason}. Reasons are reported to the researcher, never to evaluators. */
export function eligibility(r, s, evaluatorPid) {
  if (!r || !r.pid) return { ok: false, reason: "no_pid" };
  if (evaluatorPid && r.pid === evaluatorPid) return { ok: false, reason: "self" };
  if (!isCompleteProducer(r)) return { ok: false, reason: r && r.schemaVersion !== RECORD_SCHEMA ? "earlier_instrument" : "not_complete" };
  if (!hasAiRecord(r)) return { ok: false, reason: "no_ai_record" };
  const m = producerMinutes(r);
  if (!(m >= s.minMinutes)) return { ok: false, reason: "too_fast" };
  if (s.requireAttention && !(r.practice && r.practice.correct === true)) return { ok: false, reason: "failed_attention" };
  if (!s.includeLegacyConsent && !consentCoversReuse(r)) return { ok: false, reason: "no_reuse_consent" };
  return { ok: true };
}

export function poolSummary(records, s) {
  const reasons = {};
  let eligible = 0;
  records.forEach(r => { const e = eligibility(r, s, null); if (e.ok) eligible++; else reasons[e.reason] = (reasons[e.reason] || 0) + 1; });
  return { eligible, total: records.length, excluded: reasons, minTargets: s.minTargets };
}

/* ---- assignment ---------------------------------------------------------- */
const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
export const CONDITION_PERMS = perms(CONDITIONS);           // 6 ways to give A, B, C to the three thirds
export const ORDERS = perms(CONDITIONS);                     // 6 presentation orders
export function triples(caseId) {
  const k = CASE_DECISIONS[caseId], out = [];
  for (let a = 0; a < k.length; a++) for (let b = a + 1; b < k.length; b++) for (let c = b + 1; c < k.length; c++) out.push([k[a], k[b], k[c]]);
  return out;
}

function counter() { const m = new Map(); return { add: k => m.set(k, (m.get(k) || 0) + 1), get: k => m.get(k) || 0 }; }
function leastUsed(items, use, rng, tiebreak = []) {
  const keyed = items.map(x => ({ x, k: [use(x), ...tiebreak.map(f => f(x)), rng()] }));
  keyed.sort((p, q) => { for (let i = 0; i < p.k.length; i++) if (p.k[i] !== q.k[i]) return p.k[i] - q.k[i]; return 0; });
  return keyed[0].x;
}
const levelOf = (r, caseId) => (r.cases[caseId].ai && r.cases[caseId].ai.level) || (r.aiLevels || {})[caseId] || null;
const versionOf = r => (r.instrument && r.instrument.instrumentVersion) || "unrecorded";

/* exactly what the evaluator sees for one target under one condition:
   actions copied from the target's record, never recomputed */
export function displayFor(rec, caseId, decisionIds, condition) {
  const c = rec.cases[caseId];
  return {
    caseId,
    decisions: decisionIds.map(k => {
      const d = { k, final: c.final[k] };
      if (condition === "B" || condition === "C") d.ai = { action: c.ai.actions[k], why: c.ai.why[k] };
      if (condition === "C") d.first = c.first[k];
      return d;
    })
  };
}

/* records: Producer records (any state; filtered here). prior: existing
   assignments. Returns {assignment} or {notEnough: {eligible, needed}}. */
export function chooseAssignment(records, prior, evaluatorPid, s, rng = Math.random, now = new Date()) {
  const pool = records.filter(r => eligibility(r, s, evaluatorPid).ok);
  if (pool.length < s.minTargets) return { notEnough: { eligible: pool.length, needed: s.minTargets } };

  const caseUse = counter(), tripleUse = counter(), permUse = counter(), orderUse = counter(),
        targetUse = counter(), condLevel = counter(), condVersion = counter();
  prior.forEach(a => {
    caseUse.add(a.caseId); tripleUse.add(a.caseId + ":" + a.decisionIds.join(","));
    permUse.add(a.permIndex); orderUse.add(a.orderIndex);
    a.slots.forEach(sl => { targetUse.add(sl.target.pid); condLevel.add(sl.condition + ":" + sl.target.aiLevel);
                            condVersion.add(sl.condition + ":" + sl.target.instrumentVersion); });
  });

  const caseId = leastUsed(CASE_IDS, id => caseUse.get(id), rng);
  const decisionIds = leastUsed(triples(caseId), t => tripleUse.get(caseId + ":" + t.join(",")), rng);
  const permIndex = leastUsed(CONDITION_PERMS.map((_, i) => i), i => permUse.get(i), rng);
  const orderIndex = leastUsed(ORDERS.map((_, i) => i), i => orderUse.get(i), rng);

  /* thirds by leave-one-case-out ability, highest first; random among equal scores */
  const ranked = pool.map(r => ({ r, loo: mdaLoo(r, caseId), t: rng() }))
    .sort((a, b) => b.loo - a.loo || a.t - b.t);
  const thirds = [[], [], []];
  ranked.forEach((x, i) => thirds[Math.floor(i * 3 / ranked.length)].push(x.r));

  const slots = STRATA.map((stratum, g) => {
    const condition = CONDITION_PERMS[permIndex][g];
    const r = leastUsed(thirds[g], x => targetUse.get(x.pid), rng, [
      x => condLevel.get(condition + ":" + levelOf(x, caseId)),
      x => condVersion.get(condition + ":" + versionOf(x))
    ]);
    const ai = r.cases[caseId].ai;
    return {
      condition, stratum,
      position: ORDERS[orderIndex].indexOf(condition) + 1,
      token: "t" + Math.floor(rng() * 36 ** 8).toString(36).padStart(8, "0") + g,
      target: {
        pid: r.pid,
        instrumentVersion: versionOf(r),
        keyHash: (r.instrument && r.instrument.keyHash) || null,
        casesHash: (r.instrument && r.instrument.casesHash) || null,
        scoringVersion: (r.instrument && r.instrument.scoringVersion) || null,
        aiCondition: r.aiCondition ?? null,
        aiLevel: levelOf(r, caseId),
        aiCaseScore: ai && Number.isFinite(ai.score) ? ai.score : null,
        caseFirstScore: caseFirstScore(r, caseId),
        mda: mda(r),
        mdaLoo: mdaLoo(r, caseId),
        producerMinutes: producerMinutes(r)
      },
      display: displayFor(r, caseId, decisionIds, condition)
    };
  }).sort((a, b) => a.position - b.position);

  return { assignment: {
    id: "a" + Math.floor(rng() * 36 ** 10).toString(36),
    evaluatorPid, createdAt: now.toISOString(), evalSchema: EVAL_SCHEMA,
    scoredWith: { instrumentVersion: INSTRUMENT_VERSION },
    caseId, decisionIds, permIndex, orderIndex,
    order: ORDERS[orderIndex], poolSize: pool.length,
    rules: { minMinutes: s.minMinutes, requireAttention: s.requireAttention, includeLegacyConsent: s.includeLegacyConsent },
    slots
  } };
}

/* what the browser gets: decisions to show and an opaque token per person.
   No pid, no condition letter, no ability score, no advice level. */
export function clientView(a) {
  return {
    assignmentId: a.id,
    caseId: a.caseId,
    decisionIds: a.decisionIds,
    items: a.slots.map(sl => ({ token: sl.token, position: sl.position, decisions: sl.display.decisions }))
  };
}

/* checks an evaluator record against its assignment and keeps only known
   fields. Returns {record} or {error}. */
export function cleanEvaluation(body, a) {
  if (!a || body.assignmentId !== a.id) return { error: "assignment mismatch" };
  const tokens = new Set(a.slots.map(s => s.token));
  const items = {};
  for (const [t, v] of Object.entries(body.items || {})) {
    if (!tokens.has(t)) return { error: "unknown item" };
    const rating = v.rating == null ? null : Number(v.rating);
    const conf = v.conf == null ? null : Number(v.conf);
    if (rating != null && !(Number.isInteger(rating) && rating >= 0 && rating <= 100)) return { error: "rating must be a whole number from 0 to 100" };
    if (conf != null && !(Number.isInteger(conf) && conf >= 1 && conf <= 5)) return { error: "confidence must be 1 to 5" };
    items[t] = { rating, conf, why: String(v.why || "").slice(0, 1000),
                 ms: Number.isFinite(v.ms) ? v.ms : null, position: Number.isFinite(v.position) ? v.position : null };
  }
  const done = body.done === true;
  if (done && !a.slots.every(s => items[s.token] && items[s.token].rating != null && items[s.token].conf != null))
    return { error: "a finished evaluation needs a rating and a confidence for every person" };
  const num = x => Number.isFinite(x) ? x : null;
  return { record: {
    pid: body.pid, stage: "evaluator", evalSchema: EVAL_SCHEMA, assignmentId: a.id,
    started: typeof body.started === "string" ? body.started : null,
    finished: done && typeof body.finished === "string" ? body.finished : null,
    totalMin: num(body.totalMin), msIntro: num(body.msIntro), at: num(body.at),
    items, done,
    saveSeq: num(body.saveSeq) || 0, saveReason: String(body.saveReason || "").slice(0, 60),
    clientSavedAt: typeof body.clientSavedAt === "string" ? body.clientSavedAt : null
  } };
}

/* complete: finished, and every person rated with a confidence */
export function evaluationState(e, a) {
  if (!e || !e.done) return "in_progress";
  if (!a || e.assignmentId !== a.id) return "anomalous";
  return a.slots.every(s => e.items && e.items[s.token] && e.items[s.token].rating != null && e.items[s.token].conf != null)
    ? "complete" : "anomalous";
}
