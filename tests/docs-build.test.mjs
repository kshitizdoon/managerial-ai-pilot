/* The two existing build scripts: docs/instrument.md must match what
   make-docs.js generates today, and build.py must still bundle the site. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, scriptOrder } from "./helpers/load.mjs";

function copySite(){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "site-"));
  for (const f of ["index.html", "make-docs.js", "build.py"]) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  fs.cpSync(path.join(ROOT, "js"), path.join(dir, "js"), { recursive: true });
  fs.cpSync(path.join(ROOT, "css"), path.join(dir, "css"), { recursive: true });
  return dir;
}

test("docs/instrument.md is what make-docs.js generates (no drift)", () => {
  const dir = copySite();
  execFileSync(process.execPath, ["make-docs.js"], { cwd: dir, stdio: "pipe" });
  const fresh = fs.readFileSync(path.join(dir, "docs/instrument.md"), "utf8");
  const committed = fs.readFileSync(path.join(ROOT, "docs/instrument.md"), "utf8");
  assert.ok(fresh === committed, "docs/instrument.md is stale: run `node make-docs.js` and commit the result");
});

test("every script index.html loads exists and is named in the preflight", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  for (const f of scriptOrder()) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), f + " missing");
    assert.ok(html.includes(`["${f}",`), f + " not in the preflight MODULES list");
  }
});

test("build.py bundles one file that stores responses in the browser only", (t) => {
  let python = null;
  for (const p of ["python3", "python"]) {
    try { execFileSync(p, ["--version"], { stdio: "pipe" }); python = p; break; } catch {}
  }
  if (!python) return t.skip("python is not installed");
  const dir = copySite();
  execFileSync(python, ["build.py"], { cwd: dir, stdio: "pipe" });
  const out = fs.readFileSync(path.join(dir, "dist/index.html"), "utf8");
  assert.ok(out.includes('storage: "local"'));
  assert.ok(!out.includes('storage: "function"'));
  assert.ok(!/<script src="js\//.test(out), "bundle still points at js/ files");
});
