#!/usr/bin/env python3
"""Bundle the site into dist/index.html — one file, no folders.

Use it when you want to hand someone a single file, or to publish a
preview. The bundled copy stores responses in the browser only; the
Netlify function and form are not there. Deploy the folder, not this.

    python3 build.py
"""
import pathlib, re, sys

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text()
css = (root / "css/styles.css").read_text()

js_files = re.findall(r'<script src="(js/[^"]+)"></script>', html)

# every file index.html asks for must actually exist. A script tag pointing
# at a file that was never committed is what turns the deployed site into a
# blank page, and it costs nothing to catch it here.
lost = [f for f in js_files if not (root / f).exists()]      + ([] if (root / "css/styles.css").exists() else ["css/styles.css"])
if lost:
    sys.exit("index.html references files that are not here: " + ", ".join(lost))
js = "\n".join(f"/* ==== {f} ==== */\n" + (root / f).read_text() for f in js_files)

# the bundle has no server: keep responses in the browser
js = js.replace('storage: "auto"', 'storage: "local"')

html = html.replace('<link rel="stylesheet" href="css/styles.css">', f"<style>\n{css}\n</style>")
for f in js_files:
    html = html.replace(f'<script src="{f}"></script>', "")
html = html.replace("<!-- BUNDLE -->", "")
html = re.sub(r'<form name="pilot".*?</form>', "", html, flags=re.S)
html = html.replace("<script>\n/* router", f"<script>\n{js}\n</script>\n<script>\n/* router")

out = root / "dist"
out.mkdir(exist_ok=True)
(out / "index.html").write_text(html)
print(f"wrote {out/'index.html'} ({len(html)/1024:.0f} KB)")
