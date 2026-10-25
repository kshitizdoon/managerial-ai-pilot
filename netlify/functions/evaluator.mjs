/* =============================================================
   evaluator.mjs — the Evaluator stage, server side.

   GET  ?status=1              {enabled}. No key, nothing else.
   GET  ?key=DASHBOARD_KEY     everything the results view needs:
                               assignments (with targets and ability),
                               evaluator records, and the eligible pool.
   POST {action:"assign", pid} the evaluator's three people. The first
                               call chooses them from real, completed
                               Producer records and stores the choice;
                               every later call returns the same one.
   POST {action:"save", record} an evaluator checkpoint or the final
                               submission, with the same saveSeq rules
                               as the Producer stage.

   Privacy: the Producer dataset never leaves the server. A browser gets
   only the actions and AI advice for the three people it is assigned,
   under opaque tokens: no PID, name, phone number, background answers,
   ability score, advice level or condition label. The scoring key stays
   in this function's bundle.

   Off unless the site sets EVALUATOR_ENABLED=1, because the consent text
   shown to earlier Producers did not mention reuse. See README.
   ============================================================= */

import { getStore } from "@netlify/blobs";
import { upsertRecord, cleanId, json, describe, readAll, keyOk, resilientStore } from "../lib/upsert.mjs";
import { settings, chooseAssignment, clientView, cleanEvaluation, poolSummary } from "../lib/eval-core.mjs";

const PRODUCERS = "pilot-responses";
const ASSIGNMENTS = "evaluator-assignments";
const EVALUATIONS = "evaluator-responses";
const MAX_BODY_BYTES = 64 * 1024;

export default async (request) => {
  try {
    return await handle(request);
  } catch (err) {
    console.error("evaluator function failed", request.method, err);
    return json({ error: "server error", detail: describe(err) }, 500);
  }
};

const stores = () => ({
  producers: resilientStore(getStore, PRODUCERS),
  assignments: resilientStore(getStore, ASSIGNMENTS),
  evaluations: resilientStore(getStore, EVALUATIONS)
});

async function handle(request) {
  const s = settings();
  const url = new URL(request.url);

  if (request.method === "GET") {
    if (url.searchParams.has("status") && !url.searchParams.has("key")) return json({ enabled: s.enabled });
    const k = keyOk(request);
    if (!k.ok) return json({ error: k.error }, k.status);
    const st = stores();
    const [producers, assignments, evaluations] = await Promise.all([readAll(st.producers), readAll(st.assignments), readAll(st.evaluations)]);
    return json({ settings: s, pool: poolSummary(producers, s), assignments, evaluations });
  }

  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) return json({ error: "too large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "bad json" }, 400); }
  if (!body || typeof body !== "object") return json({ error: "bad request" }, 400);
  const st = stores();

  if (body.action === "assign") {
    const pid = cleanId(body.pid);
    if (!pid) return json({ error: "no pid" }, 400);
    /* an assignment, once made, is returned again even if the stage has
       since been switched off, so a respondent mid-way can finish */
    const existing = await st.assignments.get(pid, { type: "json" }).catch(() => null);
    if (existing) return json({ status: "assigned", view: clientView(existing) });
    if (!s.enabled) return json({ error: "evaluator stage is not enabled" }, 403);
    /* only someone who has finished the Producer stage, under this PID */
    const own = await st.producers.get(pid, { type: "json" }).catch(() => null);
    if (!own || !own.done) return json({ error: "producer stage not complete for this pid" }, 403);
    const [producers, prior] = await Promise.all([readAll(st.producers), readAll(st.assignments)]);
    const r = chooseAssignment(producers, prior, pid, s);
    if (r.notEnough) return json({ status: "not_enough", eligible: r.notEnough.eligible, needed: r.notEnough.needed });
    const res = await st.assignments.setJSON(pid, r.assignment, { onlyIfNew: true });
    if (res && res.modified === false) {
      /* another request for this pid got there first: use that one */
      const won = await st.assignments.get(pid, { type: "json" });
      return json({ status: "assigned", view: clientView(won) });
    }
    return json({ status: "assigned", view: clientView(r.assignment) });
  }

  if (body.action === "save") {
    const rec = body.record || {};
    const pid = cleanId(rec.pid);
    if (!pid) return json({ error: "no pid" }, 400);
    const a = await st.assignments.get(pid, { type: "json" }).catch(() => null);
    if (!a) return json({ error: "no assignment for this pid" }, 403);
    const c = cleanEvaluation({ ...rec, pid }, a);
    if (c.error) return json({ error: c.error }, 400);
    const r = await upsertRecord(st.evaluations, pid, c.record, { keepFirst: ["assignmentId"] });
    return json(r.body, r.status);
  }

  return json({ error: "unknown action" }, 400);
}

export const config = { path: "/api/evaluator" };
