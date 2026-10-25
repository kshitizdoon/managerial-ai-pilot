/* Runs the real Netlify Function against an in-memory Blobs store.
   The function source is copied to a temp folder with its one import
   pointed at a mock that implements the parts of @netlify/blobs it uses:
   getWithMetadata (data + etag), setJSON with onlyIfNew / onlyIfMatch
   (returning {modified}), list and get. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./load.mjs";

const MOCK = `
export const stores = new Map();
/* failOn: "read" (every read), "strong" (strong-consistency reads only),
   "conditional" (writes with onlyIfNew/onlyIfMatch throw), "set" (every
   write), "get" (get only); or an array of these */
export const hooks = { beforeSet: null, failOn: null };
let n = 0;
export function getStore({ name, consistency }){
  if(!stores.has(name)) stores.set(name, new Map());
  const db = stores.get(name);
  const has = m => Array.isArray(hooks.failOn) ? hooks.failOn.includes(m) : hooks.failOn === m;
  const failRead = () => {
    if(has("read")) throw new Error("mock read failure");
    if(has("strong") && consistency === "strong")
      throw Object.assign(new Error("mock strong read refused"), { name: "BlobsConsistencyError" });
  };
  return {
    async getWithMetadata(k){ failRead(); const r = db.get(k); return r ? { data: JSON.parse(r.v), etag: r.e } : null; },
    async setJSON(k, v, o = {}){
      if(has("set")) throw Object.assign(new Error("mock write failure"), { name: "BlobsInternalError" });
      if(has("conditional") && (o.onlyIfNew || o.onlyIfMatch))
        throw Object.assign(new Error("mock conditional write refused"), { name: "BlobsInternalError" });
      if(hooks.beforeSet){ const h = hooks.beforeSet; hooks.beforeSet = null; await h(db); }
      const cur = db.get(k);
      if(o.onlyIfNew && cur) return { modified: false };
      if(o.onlyIfMatch && (!cur || cur.e !== o.onlyIfMatch)) return { modified: false };
      db.set(k, { v: JSON.stringify(v), e: "etag" + (++n) });
      return { modified: true, etag: "etag" + n };
    },
    async list(){ failRead(); return { blobs: [...db.keys()].map(key => ({ key })) }; },
    async get(k){ failRead(); if(has("get")) throw new Error("mock get failure"); const r = db.get(k); return r ? JSON.parse(r.v) : null; },
    async delete(k){ db.delete(k); }
  };
}`;

/* Copies netlify/functions and netlify/lib into one temp folder, points
   every "@netlify/blobs" import at one shared mock, and imports the
   functions. Both functions then see the same stores, as on Netlify. */
export async function loadFunctions(){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fn-"));
  fs.writeFileSync(path.join(dir, "mock.mjs"), MOCK);
  for (const sub of ["functions", "lib"]) {
    fs.mkdirSync(path.join(dir, sub));
    for (const f of fs.readdirSync(path.join(ROOT, "netlify", sub)).filter(f => f.endsWith(".mjs"))) {
      const src = fs.readFileSync(path.join(ROOT, "netlify", sub, f), "utf8");
      fs.writeFileSync(path.join(dir, sub, f), src.replace(/from "@netlify\/blobs"/g, 'from "../mock.mjs"'));
    }
  }
  const mock = await import(pathToFileURL(path.join(dir, "mock.mjs")).href);
  const responses = await import(pathToFileURL(path.join(dir, "functions", "responses.mjs")).href);
  const evaluator = fs.existsSync(path.join(dir, "functions", "evaluator.mjs"))
    ? await import(pathToFileURL(path.join(dir, "functions", "evaluator.mjs")).href) : null;
  const db = name => mock.stores.get(name) || new Map();
  return { mock, responses, evaluator, db, hooks: mock.hooks };
}

export async function loadFunction(){
  const src = fs.readFileSync(path.join(ROOT, "netlify/functions/responses.mjs"), "utf8");
  if(!src.includes('from "@netlify/blobs"')) throw new Error("function no longer imports @netlify/blobs as expected");
  const all = await loadFunctions();
  const fn = all.responses;
  const db = () => all.db("pilot-responses");
  const call = (url, init) => fn.default(new Request(url, init));
  return {
    handler: fn.default,
    config: fn.config,
    hooks: all.hooks,
    all,
    db,
    stored: pid => { const r = db().get(pid); return r ? JSON.parse(r.v) : null; },
    async post(body){
      const res = await call("http://site/api/responses", {
        method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
      return { status: res.status, json: await res.json() };
    },
    async get(key){
      const res = await call("http://site/api/responses" + (key == null ? "" : "?key=" + encodeURIComponent(key)));
      return { status: res.status, json: await res.json() };
    }
  };
}
