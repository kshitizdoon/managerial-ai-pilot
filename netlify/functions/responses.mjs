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
import { upsertRecord, cleanId, json, describe, readAll, keyOk } from "../lib/upsert.mjs";

const STORE = "pilot-responses";
const MAX_BODY_BYTES = 256 * 1024;
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
    const id = cleanId(body.pid);
    if (!id) return json({ error: "bad pid" }, 400);
    const r = await upsertRecord(store, id, body, { keepFirst: ["instrument"] });
    return json(r.body, r.status);
  }

  if (request.method === "GET") {
    const k = keyOk(request);
    if (!k.ok) return json({ error: k.error }, k.status);
    const responses = await readAll(store);
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

export const config = { path: "/api/responses" };
