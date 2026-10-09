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
export const hooks = { beforeSet: null };
let n = 0;
export function getStore({ name }){
  if(!stores.has(name)) stores.set(name, new Map());
  const db = stores.get(name);
  return {
    async getWithMetadata(k){ const r = db.get(k); return r ? { data: JSON.parse(r.v), etag: r.e } : null; },
    async setJSON(k, v, o = {}){
      if(hooks.beforeSet){ const h = hooks.beforeSet; hooks.beforeSet = null; await h(db); }
      const cur = db.get(k);
      if(o.onlyIfNew && cur) return { modified: false };
      if(o.onlyIfMatch && (!cur || cur.e !== o.onlyIfMatch)) return { modified: false };
      db.set(k, { v: JSON.stringify(v), e: "etag" + (++n) });
      return { modified: true, etag: "etag" + n };
    },
    async list(){ return { blobs: [...db.keys()].map(key => ({ key })) }; },
    async get(k){ const r = db.get(k); return r ? JSON.parse(r.v) : null; }
  };
}`;

export async function loadFunction(){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fn-"));
  fs.writeFileSync(path.join(dir, "mock.mjs"), MOCK);
  const src = fs.readFileSync(path.join(ROOT, "netlify/functions/responses.mjs"), "utf8");
  if(!src.includes('from "@netlify/blobs"')) throw new Error("function no longer imports @netlify/blobs as expected");
  fs.writeFileSync(path.join(dir, "fn.mjs"), src.replace('from "@netlify/blobs"', 'from "./mock.mjs"'));
  const fn = await import(pathToFileURL(path.join(dir, "fn.mjs")).href);
  const mock = await import(pathToFileURL(path.join(dir, "mock.mjs")).href);
  const db = () => mock.stores.get("pilot-responses") || new Map();
  return {
    handler: fn.default,
    config: fn.config,
    hooks: mock.hooks,
    db,
    stored: pid => { const r = db().get(pid); return r ? JSON.parse(r.v) : null; },
    async post(body){
      const res = await fn.default(new Request("http://site/api/responses", {
        method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));
      return { status: res.status, json: await res.json() };
    },
    async get(key){
      const res = await fn.default(new Request("http://site/api/responses" + (key == null ? "" : "?key=" + encodeURIComponent(key))));
      return { status: res.status, json: await res.json() };
    }
  };
}
