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
   - GET ?health=1 needs no key and returns no records. It runs every
     operation a save uses on a probe in a separate store and reports each
     one, so yoursite/api/responses?health=1 shows which part fails.
   - Reads fall back to normal consistency, and refused conditional writes
     to guarded plain writes (see netlify/lib/upsert.mjs).
   - Any failure answers with JSON naming the error, and is logged, so the
     survey and the Netlify function log both show the real cause.
   ============================================================= */

import { getStore } from "@netlify/blobs";
import { upsertRecord, cleanId, json, describe, readAll, keyOk, resilientStore } from "../lib/upsert.mjs";

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
  const store = resilientStore(getStore, STORE);

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

/* Every operation a save uses, one by one, on a separate probe store, so
   the answer says exactly which part of Netlify Blobs fails. No records
   are read or returned. ok is true when the normal save path works;
   fallbackOk when a save would still land through the fallbacks. */
async function health() {
  const out = { ok: false, fallbackOk: false, dashboardKeySet: !!process.env.DASHBOARD_KEY,
    blobsEnvironment: !!(globalThis.netlifyBlobsContext || process.env.NETLIFY_BLOBS_CONTEXT),
    node: process.version, steps: [] };
  const step = async (name, fn) => {
    try { const detail = await fn(); out.steps.push({ step: name, ok: true, ...(detail !== undefined ? { detail } : {}) }); return true; }
    catch (err) { console.error("health check failed at", name, err); out.steps.push({ step: name, ok: false, error: describe(err) }); return false; }
  };
  let strong, normal;
  const opened = await step("open store (strong)", () => { strong = getStore({ name: HEALTH_STORE, consistency: "strong" }); })
    & await step("open store (normal)", () => { normal = getStore({ name: HEALTH_STORE }); });
  if (!opened) return json(out, 500);
  const key = "probe-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  const value = { at: new Date().toISOString() };
  let etag = null;
  const results = {
    newWrite: await step("conditional write: only if new", async () => {
      const r = await strong.setJSON(key, value, { onlyIfNew: true });
      if (r && r.modified === false) throw new Error("refused a brand-new key");
      return r && r.etag ? "etag returned" : "no etag returned";
    }),
    strongRead: await step("read with metadata (strong)", async () => {
      const r = await strong.getWithMetadata(key, { type: "json" });
      if (!r || !r.data || r.data.at !== value.at) throw new Error("read back " + JSON.stringify(r && r.data));
      etag = r.etag || null;
      return etag ? "etag present" : "no etag";
    }),
    normalRead: await step("read (normal)", async () => {
      const r = await normal.get(key, { type: "json" });
      return r && r.at === value.at ? "matches" : "not visible yet (normal reads can lag)";
    }),
    matchWrite: await step("conditional write: only if unchanged", async () => {
      if (!etag) throw new Error("skipped: no etag from the strong read");
      const r = await strong.setJSON(key, { ...value, n: 2 }, { onlyIfMatch: etag });
      if (r && r.modified === false) throw new Error("refused although nothing changed");
    }),
    plainWrite: await step("plain write", async () => { await strong.setJSON(key, { ...value, n: 3 }); }),
    list: await step("list", async () => { const r = await strong.list(); return (r && r.blobs ? r.blobs.length : 0) + " probe(s)"; }),
    del: await step("delete", async () => { await strong.delete(key); })
  };
  out.ok = results.newWrite && results.strongRead && results.matchWrite && results.list;
  out.fallbackOk = out.ok || ((results.strongRead || results.normalRead) && results.plainWrite);
  return json(out, out.ok ? 200 : 500);
}

export const config = { path: "/api/responses" };
