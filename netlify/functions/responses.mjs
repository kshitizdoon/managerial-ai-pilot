/* =============================================================
   responses.mjs — POST stores one response, GET returns them all.

   One Blob per PID. Every checkpoint replaces that Blob.
   - Strong consistency: a read always sees the latest write.
   - Compare-and-set: the write only lands if the Blob has not changed
     since it was read. If it has, the check is redone.
   - saveSeq: an older checkpoint never replaces a newer one, and an
     unfinished copy never replaces a finished one.
   - GET needs DASHBOARD_KEY. With no key set, nothing is returned,
     because the records can hold names and mobile numbers.
   ============================================================= */

import { getStore } from "@netlify/blobs";

const STORE = "pilot-responses";
const MAX_BODY_BYTES = 256 * 1024;
const MAX_WRITE_TRIES = 5;

export default async (request) => {
  const store = getStore({ name: STORE, consistency: "strong" });

  if (request.method === "POST") {
    const text = await request.text().catch(() => "");
    if (text.length > MAX_BODY_BYTES) return json({ error: "too large" }, 413);
    let body;
    try { body = JSON.parse(text); }
    catch { return json({ error: "bad json" }, 400); }
    if (!body || typeof body !== "object" || !body.pid) return json({ error: "no pid" }, 400);

    const id = String(body.pid).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    if (!id) return json({ error: "bad pid" }, 400);
    const incomingSeq = Number(body.saveSeq || 0);

    for (let attempt = 0; attempt < MAX_WRITE_TRIES; attempt++) {
      let cur = null;
      try { cur = await store.getWithMetadata(id, { type: "json" }); }
      catch { cur = null; }                       // unreadable record: overwrite it
      const existing = cur ? cur.data : null;

      if (existing) {
        const existingSeq = Number(existing.saveSeq || 0);
        if (existing.done && !body.done) {
          return json({ ok: true, id, ignored: "already_complete", saveSeq: existingSeq });
        }
        if (!!existing.done === !!body.done && incomingSeq < existingSeq) {
          return json({ ok: true, id, ignored: "older_checkpoint", saveSeq: existingSeq });
        }
      }

      body.receivedAt = new Date().toISOString();
      body.status = body.done ? "complete" : "in_progress";

      const opts = !cur ? { onlyIfNew: true }
                 : cur.etag ? { onlyIfMatch: cur.etag }
                 : {};
      const res = await store.setJSON(id, body, opts);
      if (res && res.modified === false) continue;  // someone wrote in between: check again
      return json({ ok: true, id, saveSeq: incomingSeq, status: body.status });
    }
    return json({ error: "busy, retry" }, 409);    // the client retries
  }

  if (request.method === "GET") {
    const wanted = process.env.DASHBOARD_KEY;
    if (!wanted) return json({ error: "DASHBOARD_KEY is not set on this site" }, 503);
    const given = new URL(request.url).searchParams.get("key");
    if (given !== wanted) return json({ error: "wrong key" }, 401);

    const { blobs } = await store.list();
    const responses = [];
    for (let i = 0; i < blobs.length; i += 20) {
      const batch = await Promise.all(blobs.slice(i, i + 20).map(b =>
        store.get(b.key, { type: "json" }).catch(() => null)));
      batch.forEach(r => { if (r) responses.push(r); });
    }
    return json({ count: responses.length, responses });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/responses" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
