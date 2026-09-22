/* =============================================================
   responses.mjs — POST stores one response, GET returns them all.
   Incremental checkpoints use one Blob per PID. saveSeq prevents an older
   network request from overwriting a newer checkpoint for the same person.
   ============================================================= */

import { getStore } from "@netlify/blobs";

const STORE = "pilot-responses";

export default async (request) => {
  const store = getStore(STORE);

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: "bad json" }, 400); }
    if (!body || !body.pid) return json({ error: "no pid" }, 400);

    const id = String(body.pid).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    if (!id) return json({ error: "bad pid" }, 400);

    const incomingSeq = Number(body.saveSeq || 0);
    const existing = await store.get(id, { type: "json" }).catch(() => null);
    const existingSeq = Number(existing?.saveSeq || 0);

    /* A delayed checkpoint must never replace a later checkpoint. */
    if (existing && incomingSeq < existingSeq) {
      return json({ ok: true, id, ignoredOlderCheckpoint: true, saveSeq: existingSeq });
    }

    body.receivedAt = new Date().toISOString();
    body.status = body.done ? "complete" : (body.status || "in_progress");
    await store.setJSON(id, body);
    return json({ ok: true, id, saveSeq: incomingSeq, status: body.status });
  }

  if (request.method === "GET") {
    const wanted = process.env.DASHBOARD_KEY;
    const given = new URL(request.url).searchParams.get("key");
    if (wanted && given !== wanted) return json({ error: "wrong key" }, 401);

    const { blobs } = await store.list();
    const responses = [];
    for (const b of blobs) {
      const r = await store.get(b.key, { type: "json" });
      if (r) responses.push(r);
    }
    return json({ count: responses.length, responses });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/responses" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
