/* =============================================================
   responses.mjs — POST stores one response, GET returns them all.

   One Blob per PID. Every checkpoint replaces that Blob.
   - Strong consistency: a read always sees the latest write.
   - Compare-and-set: the write only lands if the Blob has not changed
     since it was read. If it has, the check is redone.
   - saveSeq: an older checkpoint never replaces a newer one, and an
     unfinished copy never replaces a finished one.
   - instrument: the version stamp of the first stored copy is kept on
     every later copy of that PID, so it cannot change after the fact.
   - GET needs DASHBOARD_KEY. With no key set, nothing is returned,
     because the records can hold names and mobile numbers.
   - GET ?health=1 needs no key and returns no records. It writes, reads
     and deletes one probe in a separate store, so you can open
     yoursite/api/responses?health=1 and see whether saving works.
   - Any failure answers with JSON naming the error, and is logged, so the
     survey and the Netlify function log both show the real cause.
   ============================================================= */

import { getStore } from "@netlify/blobs";

const STORE = "pilot-responses";
const MAX_BODY_BYTES = 256 * 1024;
const MAX_WRITE_TRIES = 5;
const HEALTH_STORE = "pilot-health";

export default async (request) => {
  try {
    return await handle(request);
  } catch (err) {
    console.error("responses function failed", request.method, err);
    return json({ error: "server error", detail: describe(err) }, 500);
  }
};

async function handle(request) {
  if (request.method === "GET" && new URL(request.url).searchParams.has("health")) return health();
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
        // the instrument stamp is set by the first stored copy and never replaced
        if ("instrument" in existing) body.instrument = existing.instrument;
        else delete body.instrument;
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
}

/* write, read back and delete one probe, step by step */
async function health() {
  const out = { ok: false, step: "open store", dashboardKeySet: !!process.env.DASHBOARD_KEY };
  try {
    const store = getStore({ name: HEALTH_STORE, consistency: "strong" });
    const key = "probe-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const value = { at: new Date().toISOString() };
    out.step = "write";
    await store.setJSON(key, value);
    out.step = "read";
    const back = await store.get(key, { type: "json" });
    if (!back || back.at !== value.at) throw new Error("read back " + JSON.stringify(back) + ", expected " + JSON.stringify(value));
    out.step = "delete";
    await store.delete(key);
    out.step = "done";
    out.ok = true;
    return json(out);
  } catch (err) {
    console.error("health check failed at", out.step, err);
    return json({ ...out, error: describe(err) }, 500);
  }
}

function describe(err) {
  if (!err) return "unknown error";
  return ((err.name ? err.name + ": " : "") + (err.message || String(err))).slice(0, 500);
}

export const config = { path: "/api/responses" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
