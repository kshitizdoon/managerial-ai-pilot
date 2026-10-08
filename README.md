# Managerial Decision Survey

Six managerial situations ("caselets"), each with five decisions. For every
decision the respondent picks one of four actions: Own, Delegate, Wait or
Hold. They then see an AI advisor's recommendation for the same five
decisions and give final answers. The advice comes at four quality levels,
so the study can ask whether ability shows up in how people use AI advice.

The instrument follows the researcher manual of 8 October 2026
(*Managerial_Decision_Survey_Manual_v3_round2*, tracked changes accepted).
It does not use the fixed action quotas or named delegates of the earlier
pilot, and the manual says not to pool the two without a bridging analysis.

Plain HTML, CSS and JavaScript. No build step, no framework.

---

## Files

| File | What it holds |
| --- | --- |
| `js/config.js` | The knobs: AI conditions, randomisation, contact details, instrument version. Start here. |
| `js/cases.js` | Everything respondents read: instructions, the four actions, the practice item, caselets, decisions, AI advice at four levels. |
| `js/art.js` | One small illustration per caselet, for its header. |
| `js/key.js` | The scoring key: 0 to 20 for each action on each decision. Not shown to anyone. |
| `js/order.js` | Constrained randomisation: shuffles caselets (and decisions, if switched on), keeps declared `after` constraints, and validates them. |
| `js/scoring.js` | Scores answers and advice, assigns advice levels, checks the key at load. |
| `js/stats.js` | Alpha, correlations, power arithmetic. |
| `js/storage.js` | Where responses go. |
| `js/survey.js` | The respondent's side. |
| `js/dashboard.js` | The results view. |
| `css/styles.css` | All styling, with the rules that keep the decision cards neutral. |
| `netlify/functions/responses.mjs` | Stores and returns responses. |
| `make-docs.js` | `node make-docs.js` regenerates `docs/instrument.md` from the cases, the key and the scoring. |
| `build.py` | Optional. Bundles everything into `dist/index.html` for a single-file copy. |
| `tests/` | Regression tests. `npm install`, then `npm test`. |

## Run it on your laptop

```bash
cd pilot-site
python3 -m http.server 5500
# open http://localhost:5500
```

There is no function on a local server, so saves fail (after three tries
each) and the last screen offers a block of text to copy. That is the
fallback working as designed. The results view at
`http://localhost:5500/#researcher=anything` shows only imported responses.

## Put it online

Deploy with GitHub (Option B) or the Netlify CLI (Option C). Do not use a
drag-and-drop deploy: it has no function, so no response reaches the
server and every participant ends on the copy-your-answers screen.

### Option B — GitHub, live results

1. Put this folder in a GitHub repository.
2. Netlify → **Add new site → Import an existing project** → pick the repo.
3. Leave the build command empty. Publish directory `.`. Netlify reads
   `netlify.toml` and installs the one dependency for the function.
4. Netlify → **Site configuration → Environment variables** → add
   `DASHBOARD_KEY` with a value only you know. Do not put it in any file in
   this folder: every file is public. Without it the results view returns
   nothing, on purpose, because records hold names and mobile numbers.
5. Redeploy once so the function sees the variable.

Responses go straight into Netlify Blobs. The results view reads them live
at `https://yoursite.netlify.app/#researcher=YOUR_KEY`. Every `git push`
redeploys, so editing a case is: edit `cases.js`, push, done.

### Option C — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

Same result as Option B without GitHub, but you redeploy by hand.

## If the deployed page is blank

A blank page means one script did not load, so every script after it never
ran. The page now catches this itself and prints which file is missing
instead of showing nothing, but the cause is almost always the same:

There are two versions of this mistake, and the console tells you which.

**A new file was not pushed.** `git commit -am "..."` stages only files git
already tracks. Any file added since the last commit is skipped silently.
The console shows `404` on the file, then `ReferenceError: <something> is
not defined`.

**An edited file was not pushed, so an old copy is still live.** The
console shows a `SyntaxError` on a file that loads fine, most often
`redeclaration of const ...`, followed by a `ReferenceError`. A syntax
error kills that entire script, so every function in it disappears. Mixing
a new file with an old one is the usual cause.

Both have the same fix: push everything, not only what you edited.

```bash
git status --short          # ?? is untracked, M is edited but uncommitted
git add -A && git commit -m "..." && git push
```

To be certain the server has what you have, compare checksums:

```bash
md5sum index.html css/styles.css js/*.js
```

Then fetch the same file from the live site and check it matches:

```bash
curl -s https://yoursite.netlify.app/js/survey.js | md5sum
```

Confirm from the browser: open `https://yoursite.netlify.app/js/order.js`.
If that 404s, the file is not deployed. Do the same for every file listed
in the `<script>` tags at the bottom of `index.html`.

Two other things worth checking, in order:

1. Netlify → **Deploys** → the latest deploy. If it says Failed, the site
   is still serving the previous build.
2. The browser console. The preflight names missing files; anything else
   shows up there as a red error with a file and line number.

Locally, `python3 build.py` now refuses to run if `index.html` points at a
file that is not in the folder, which catches the same mistake before you
push.

## Check before you send the link out

- Open the site, press **Start**, and finish one caselet. Open the browser
  console: the page checks the key and the advice against the cases at
  load, and a red band appears at the top if anything is wrong.
- Add `?ai=0` to `?ai=3` to the link to see a given AI condition.
- Complete a full run yourself, then open the results view and confirm your
  own response appears.
- Send the link to one person on another network before sending it to ten.

## Editing

**Wording, decisions, AI advice** → `js/cases.js`. The text there is
copied from the manual, and `tests/scoring.test.mjs` checks it against
`tests/fixtures/manual-2026-10-08.json` word for word. Change the manual,
the fixture and `cases.js` together.

**Scores** → `js/key.js`. Every decision needs all four actions scored 0 to
20, with exactly one 20. The page refuses to stay quiet otherwise, and also
if a caselet prefers Own on more than two decisions or its advice does not
get weaker level by level.

**AI conditions** → `aiConditions` in `js/config.js`. See *The design*.

**Name and mobile** → `contactAt` in `js/config.js`: `"end"` (default),
`"start"` or `"off"`. The default is the last screen. A managerial
judgement task that carries the respondent's name before any decision is
made gets answered more carefully and more conventionally, and that lands
in the outcome you are measuring.

---

## The design

**Flow.** Welcome and consent, About you, how it works (the manual's
instructions and the four definitions), one practice question on Wait
versus Hold (not scored; the answer and whether it matched are kept), then
for each caselet: the context and five first answers; then the AI advice
under each decision, the five final answers (the first answers start
selected) and an optional confidence rating and reason. Last questions and
the debrief close it.

**Order.** Caselet order is randomised per respondent. Decisions inside a
caselet keep the manual's numbering (`randomiseDecisionOrder: false`). Both
orders are stored on every response. Declare a constraint with
`after:["otherKey"]` on a decision, or `CASE_AFTER = {laterId:[earlierId]}`
for caselets; `order.js` enforces it and `checkOrderRules()` reports any
that name something missing or form a loop.

**AI advice.** Each respondent gets one of four conditions at random. The
condition rotates the levels across the caselets: caselet *i* in `cases.js`
order gets level (*i* + condition) mod 4. So every respondent sees all four
levels (two of them twice) and, across the four conditions, every caselet
appears at every level once. The level, the advice shown and its score are
stored with each caselet's answers. Levels and scores are never shown.

| Level | Advice score | Preferred actions |
| --- | --- | --- |
| High | 94 | 4 of 5 |
| Moderate | 74 | 3 of 5 |
| Low | 48 | 2 of 5 |
| Very low | 22 | 0 of 5 |

**Scoring.** Each action on each decision scores 0 to 20; the preferred
action scores 20. A caselet score is the sum of its five decisions, 0 to
100, for first answers, final answers and advice alike. AI gain is final
minus first. The ability score is the mean first-answer caselet score; the
CSV also carries the leave-one-caselet-out version.

**What respondents never see.** The key, the preferred action, the advice
level and its score. The caselet illustration belongs to the caselet, uses
none of the action colours, and says nothing about any decision.

## Documentation

`node make-docs.js` writes `docs/instrument.md` from `cases.js`, `key.js`
and `scoring.js`: the instructions, the practice item, the condition table,
every caselet and decision as respondents read them, the key, and all four
levels of advice with their scores. Regenerate it after any edit; a test
fails if it is stale.

---

## How responses are saved

Every response is saved to the Netlify function (Netlify Blobs) as a full
copy at these points: after About you, after each caselet's first answers
(before the AI advisor appears), after its final answers, and at Finish. One Blob per PID,
so repeat saves never create duplicate respondents.

- **Retries.** Each save is tried three times. A later save carries the
  whole response, so one failed save is repaired by the next one.
- **Order.** `saveSeq` numbers the saves. The function reads with strong
  consistency and writes with compare-and-set, so an older copy never
  replaces a newer one, and an unfinished copy never replaces a finished one.
- **Failed Finish.** The last screen shows **Try again**. Reopening the link
  on the same device retries on its own. If it still fails, the participant
  can copy or download the response. Paste it into **Add responses**; a
  finished copy replaces the unfinished server record for that PID.
- **Unfinished responses** show in their own table on the results view and
  are left out of all statistics.
- **Browser backup.** `localStorage` holds the current response so a reload
  resumes it.
- **Marked finished, but incomplete.** A record that says it is finished
  but lacks a first or final answer for any decision is listed in its own
  table on the results view and left out of all statistics.
- **Earlier versions of the survey.** Records saved by the earlier pilot
  (quotas, named delegates) are kept, listed in their own table and in the
  raw download, and never scored. An unfinished one found on a device is
  sent to the server once more, archived, and a fresh response starts.
- **Instrument version.** Every new response carries `instrument`: the
  `instrumentVersion` name from `js/config.js`, `scoringVersion`,
  fingerprints of `cases.js` and `key.js`, and the scoring settings. It is
  set once and the function never lets it change. Rename
  `instrumentVersion` whenever you edit the cases, key or scoring. The
  results view scores every record with what is deployed now and lists
  which versions the records came from. Records saved before this field
  existed show as "not recorded". Responses store `caseOrder` as case ids
  and, per caselet, the advice that was shown (`ai`).
- **Downloads.** The CSV is the analysis file: completed responses only,
  one row per person and decision, with the fields the manual lists. The raw JSON is every record, finished or
  not, exactly as saved, including contact details. It can be pasted back
  into **Add responses**.

## Tests

```bash
npm install          # playwright-core, for the browser tests
npm test             # everything
npm run test:unit    # no browser needed
```

The browser tests need Chromium. They use `CHROMIUM_PATH` if set, else a
browser installed by `npx playwright install chromium`. If `cases.js` or
`key.js` changes on purpose, `tests/instrument.test.mjs` and
`tests/scoring.test.mjs` will fail until their pinned values and the
manual fixture are updated, and `docs/instrument.md` must be regenerated.

## Several people on one device

The survey no longer assumes the device belongs to one person.

- A finished response shows the thank-you page with a **Start a new
  response** link.
- An unfinished response asks: continue, or start new.
- Add `?new=1` to the link (for example `yoursite.netlify.app/?new=1`) to
  always start clean. The flag is removed from the address bar at once, so a
  reload does not wipe the new response.

Starting new sends the old response to the server once more, then keeps a
copy in a device archive (last 20). Opening the results view on that
device includes the archive, so a response whose save failed can still be
recovered from the device.

## Moving v1 data across

Responses that v1 saved through the Netlify Form fallback are under
**Forms → pilot** in Netlify, not in Blobs. Export the CSV, copy the
`payload` column, and paste it into **Add responses**.
