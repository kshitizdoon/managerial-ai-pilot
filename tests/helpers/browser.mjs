/* Browser harness: serves the site folder, launches Chromium, and answers
   /api/responses with the real Netlify Function over an in-memory store.
   Chromium: CHROMIUM_PATH if set, else a Playwright-managed browser under
   PLAYWRIGHT_BROWSERS_PATH (or /opt/pw-browsers), else Playwright's default. */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";
import { ROOT } from "./load.mjs";
import { loadFunction } from "./fnstore.mjs";

const TYPES = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".md":"text/markdown" };

export function startServer(){
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
    if(!p) p = "index.html";
    const file = path.join(ROOT, p);
    if(!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){ res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () =>
    resolve({ server, base: `http://127.0.0.1:${server.address().port}` })));
}

function findChromium(){
  if(process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers"].filter(Boolean);
  for(const r of roots){
    if(!fs.existsSync(r)) continue;
    for(const d of fs.readdirSync(r).filter(d => /^chromium-\d+$/.test(d)).sort().reverse()){
      for(const sub of ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-win/chrome.exe"]){
        const f = path.join(r, d, sub);
        if(fs.existsSync(f)) return f;
      }
    }
  }
  return undefined;
}

export async function launch(){
  const executablePath = findChromium();
  return chromium.launch(executablePath ? { executablePath } : {});
}

/* One site + one function store, shared by the pages a test opens.
   api.failPosts = n makes the next n POSTs return 500 before reaching the
   function; api.posts records every POST body in arrival order. */
export async function setup(){
  const { server, base } = await startServer();
  const browser = await launch();
  const fn = await loadFunction();
  const api = { posts: [], failPosts: 0, fn };
  async function newPage(){
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    page.errors = [];
    page.on("pageerror", e => page.errors.push(String(e)));
    /* fonts are the only outside requests; drop them so tests never need a network */
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.route("**/api/responses*", async route => {
      const req = route.request();
      if(req.method() === "POST"){
        api.posts.push(JSON.parse(req.postData()));
        if(api.failPosts > 0){ api.failPosts--; return route.fulfill({ status: 500, body: "test failure" }); }
      }
      const res = await fn.handler(new Request(req.url(), { method: req.method(),
        body: req.method() === "POST" ? req.postData() : undefined }));
      route.fulfill({ status: res.status, contentType: "application/json", body: await res.text() });
    });
    return page;
  }
  return { base, browser, api, fn, newPage,
    async close(){ await browser.close(); server.close(); } };
}

/* Plays one full response. menus: one of keep|use_ai|edit_mine per
   situation, in the order the situations appear. Records, per situation,
   the issue names in the order each screen showed them. */
export async function playSurvey(page, base, { menus, finish = true, stopAfterCases = 6, query = "?new=1" } = {}){
  menus = menus || ["keep", "use_ai", "edit_mine", "keep", "use_ai", "edit_mine"];
  await page.goto(base + "/" + query);
  await page.click("#begin");
  for(let i = 1; i <= 5; i++) await page.selectOption("#q" + i, { index: 1 });
  await page.click("#next");                                   // About you
  await page.click("#next");                                   // How it works
  const seen = [];
  for(let n = 0; n < stopAfterCases; n++){
    const name = await page.textContent("h1");
    await page.click("#next");                                 // situation intro
    const s = { name, menu: menus[n] };
    s.board = await page.$$eval(".issue .name", e => e.map(x => x.textContent));
    const keys = await page.$$eval(".issue", e => e.map(x => x.dataset.i));
    const labels = ["own", "delegate", "delegate", "wait", "hold"];
    for(let i = 0; i < 5; i++){
      await page.click(`.issue[data-i="${keys[i]}"] .chip[data-l="${labels[i]}"]`);
      if(labels[i] === "delegate") await page.selectOption(`#a-${keys[i]}`, { index: 1 + (i % 4) });
    }
    await page.click("input[name=conf][value='3']");
    await page.click("#next");                                 // save first plan
    s.recap = await page.$$eval(".recap .rcard b", e => e.map(x => x.textContent));
    s.aiRows = await page.$$eval(".plans .plan:nth-child(2) .prow span", e => e.map(x => x.textContent));
    await page.click(`input[name=m][value=${menus[n]}]`);
    await page.click("#next");
    if(menus[n] === "edit_mine"){
      s.final = await page.$$eval(".issue .name", e => e.map(x => x.textContent));
      await page.click("#next");                               // save final plan unchanged
    }
    seen.push(s);
  }
  if(finish && stopAfterCases === 6){
    for(const id of ["e1", "e2", "f1", "f2", "f5"]) await page.selectOption("#" + id, { index: 1 });
    await page.click("#next");
    await page.waitForSelector("h1:text('Thank you')");
  }
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem("inbasket_pilot_v2")));
  return { seen, record };
}
