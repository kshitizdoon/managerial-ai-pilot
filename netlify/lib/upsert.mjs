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

   Fallbacks, so a save still lands if part of Netlify Blobs refuses:
   - a strong-consistency read that fails is retried as a normal read
     (resilientStore);
   - a conditional write that throws (rather than answering "changed") is
     retried as a plain write, after the saveSeq and finished rules are
     checked again against a fresh read. If nothing can be read at all,
     only a finished copy is written, so an older checkpoint can never
     replace a finished record blind.
   Each fallback is logged and reported in the response as "mode".
   ============================================================= */

export const MAX_WRITE_TRIES = 5;

/* a store whose reads fall back from strong to normal consistency */
export function resilientStore(getStore, name) {
  const strong = getStore({ name, consistency: "strong" });
  let normal = null;
  const fallback = () => normal || (normal = getStore({ name }));
  const read = async (op, what) => {
    try { return await op(strong); }
    catch (err) {
      console.warn(`blobs: strong ${what} on ${name} failed, retrying without strong consistency`, describe(err));
      return op(fallback());
    }
  };
  return {
    name,
    getWithMetadata: (k, o) => read(st => st.getWithMetadata(k, o), "read"),
    get: (k, o) => read(st => st.get(k, o), "read"),
    list: o => read(st => st.list(o), "list"),
    setJSON: (k, v, o) => strong.setJSON(k, v, o),
    delete: k => strong.delete(k)
  };
}

/* why an incoming copy must not replace the stored one, or null */
function staleReason(existing, body) {
  const existingSeq = Number(existing.saveSeq || 0), incomingSeq = Number(body.saveSeq || 0);
  if (existing.done && !body.done) return "already_complete";
  if (!!existing.done === !!body.done && incomingSeq < existingSeq) return "older_checkpoint";
  return null;
}

export function cleanId(pid) {
  return String(pid == null ? "" : pid).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
}

/* returns {status, body} for the caller to send as JSON */
export async function upsertRecord(store, id, body, { keepFirst = [] } = {}) {
  const incomingSeq = Number(body.saveSeq || 0);
  const applyExisting = existing => {
    for (const f of keepFirst) {
      if (f in existing) body[f] = existing[f];
      else delete body[f];
    }
  };
  for (let attempt = 0; attempt < MAX_WRITE_TRIES; attempt++) {
    let cur = null;
    try { cur = await store.getWithMetadata(id, { type: "json" }); }
    catch { cur = null; }                       // unreadable record: write only as new
    const existing = cur ? cur.data : null;

    if (existing) {
      const stale = staleReason(existing, body);
      if (stale) return { status: 200, body: { ok: true, id, ignored: stale, saveSeq: Number(existing.saveSeq || 0) } };
      applyExisting(existing);
    }

    body.receivedAt = new Date().toISOString();
    body.status = body.done ? "complete" : "in_progress";

    const opts = !cur ? { onlyIfNew: true }
               : cur.etag ? { onlyIfMatch: cur.etag }
               : {};
    let res;
    try {
      res = await store.setJSON(id, body, opts);
    } catch (err) {
      if (!opts.onlyIfNew && !opts.onlyIfMatch) throw err;
      /* the conditional write itself was refused: check again, then write plainly */
      console.warn(`blobs: conditional write of ${id} failed, retrying as a plain write`, describe(err));
      let again, readable = true;
      try { again = await store.getWithMetadata(id, { type: "json" }); } catch { readable = false; }
      if (!readable && !body.done)
        return { status: 503, body: { error: "store unreadable; checkpoint not written, retry", detail: describe(err) } };
      if (again && again.data) {
        const stale = staleReason(again.data, body);
        if (stale) return { status: 200, body: { ok: true, id, ignored: stale, saveSeq: Number(again.data.saveSeq || 0) } };
        applyExisting(again.data);
      }
      await store.setJSON(id, body);
      return { status: 200, body: { ok: true, id, saveSeq: incomingSeq, status: body.status, mode: "unconditional" } };
    }
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
