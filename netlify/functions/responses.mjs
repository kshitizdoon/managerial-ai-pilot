/* =============================================================
   responses.mjs — POST stores one response, GET returns them all.
   Storage is Netlify Blobs: nothing to provision, nothing to pay for
   at this size.

   POST /api/responses          body: the response JSON
   GET  /api/responses?key=...  key must match DASHBOARD_KEY if it is set
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

    body.receivedAt = new Date().toISOString();
    await store.setJSON(id, body);
    return json({ ok: true, id });
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
