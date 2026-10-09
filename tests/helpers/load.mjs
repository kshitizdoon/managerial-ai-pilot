/* Loads the site's browser scripts into a Node vm context, in the same
   order index.html does, with just enough of a browser around them
   (localStorage, a stub document, fetch) to run the non-DOM code. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function scriptOrder(){
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  return [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
}

export function memoryStorage(){
  const mem = new Map();
  return {
    getItem: k => mem.has(k) ? mem.get(k) : null,
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: k => { mem.delete(k); },
    clear: () => mem.clear(),
    _mem: mem
  };
}

/* opts.fetch replaces fetch; opts.instantTimers makes the retry waits free */
export function loadSite(opts = {}){
  const box = {
    console: opts.quiet === false ? console : { log(){}, info(){}, warn(){}, error(){} },
    localStorage: opts.localStorage || memoryStorage(),
    document: {
      createElement: () => ({ style:{}, classList:{ add(){} } }),
      body: { insertBefore(){}, appendChild(){}, firstChild:null },
      getElementById: () => null
    },
    location: { search: "", hash: "", pathname: "/" },
    history: { replaceState(){} },
    TextEncoder, URL, URLSearchParams, Promise, JSON, Math, Date,
    fetch: opts.fetch || (async () => { throw new Error("no network in tests"); }),
    setTimeout: opts.instantTimers === false ? setTimeout : (f) => { setImmediate(f); return 0; },
    clearTimeout
  };
  box.window = box;
  vm.createContext(box);
  const files = opts.files || scriptOrder();
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), box, { filename: f });
  }
  box.run = src => vm.runInContext(src, box);
  return box;
}

/* deep copy out of the vm realm so node:assert compares plain values */
export const plain = x => JSON.parse(JSON.stringify(x));
