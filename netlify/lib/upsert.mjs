/* =============================================================
   upsert.mjs — one Blob per participant, replaced by every checkpoint.
   Shared by the Producer (responses.mjs) and Evaluator (evaluator.mjs)
   functions so both stages keep the same guarantees:

   - Compare-and-set: the write only lands if the Blob has not changed
     since it was read. If it has, the check is redone.
   - saveSeq: an older checkpoint never replaces a newer one, and an
     unfinished copy never replaces a finished one.
   - keepFirst: fields set by the first stored copy and never replaced
     (the Producer's instrument stamp, the Evaluator's assignment id).
   ============================================================= */

export const MAX_WRITE_TRIES = 5;

export function cleanId(pid) {
  return String(pid == null ? "" : pid).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
}

/* returns {status, body} for the caller to send as JSON */
export async function upsertRecord(store, id, body, { keepFirst = [] } = {}) {
  const incomingSeq = Number(body.saveSeq || 0);
  for (let attempt = 0; attempt < MAX_WRITE_TRIES; attempt++) {
    let cur = null;
    try { cur = await store.getWithMetadata(id, { type: "json" }); }
    catch { cur = null; }                       // unreadable record: write only as new
    const existing = cur ? cur.data : null;

    if (existing) {
      const existingSeq = Number(existing.saveSeq || 0);
      if (existing.done && !body.done) {
        return { status: 200, body: { ok: true, id, ignored: "already_complete", saveSeq: existingSeq } };
      }
      if (!!existing.done === !!body.done && incomingSeq < existingSeq) {
        return { status: 200, body: { ok: true, id, ignored: "older_checkpoint", saveSeq: existingSeq } };
      }
      for (const f of keepFirst) {
        if (f in existing) body[f] = existing[f];
        else delete body[f];
      }
    }

    body.receivedAt = new Date().toISOString();
    body.status = body.done ? "complete" : "in_progress";

    const opts = !cur ? { onlyIfNew: true }
               : cur.etag ? { onlyIfMatch: cur.etag }
               : {};
    const res = await store.setJSON(id, body, opts);
    if (res && res.modified === false) continue;  // someone wrote in between: check again
    return { status: 200, body: { ok: true, id, saveSeq: incomingSeq, status: body.status } };
  }
  return { status: 409, body: { error: "busy, retry" } };  // the client retries
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

export function describe(err) {
  if (!err) return "unknown error";
  return ((err.name ? err.name + ": " : "") + (err.message || String(err))).slice(0, 500);
}

/* every record in a store, read 20 at a time */
export async function readAll(store) {
  const { blobs } = await store.list();
  const out = [];
  for (let i = 0; i < blobs.length; i += 20) {
    const batch = await Promise.all(blobs.slice(i, i + 20).map(b =>
      store.get(b.key, { type: "json" }).catch(() => null)));
    batch.forEach(r => { if (r) out.push(r); });
  }
  return out;
}

export function keyOk(request) {
  const wanted = process.env.DASHBOARD_KEY;
  if (!wanted) return { ok: false, status: 503, error: "DASHBOARD_KEY is not set on this site" };
  const given = new URL(request.url).searchParams.get("key");
  if (given !== wanted) return { ok: false, status: 401, error: "wrong key" };
  return { ok: true };
}
