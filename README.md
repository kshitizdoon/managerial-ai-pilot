# Managerial in-basket pilot

Six managerial situations, each with five competing issues. Respondents
allocate their attention, see an AI advisor's plan for the same situation,
then submit a final plan. Half the AI plans are good and half are weak, so
the study can ask whether ability shows up in how people use AI advice.

Plain HTML, CSS and JavaScript. No build step, no framework.

---

## Files

| File | What it holds |
| --- | --- |
| `js/config.js` | The knobs: deferral mode, scoring defaults, randomisation, dashboard key. Start here. |
| `js/cases.js` | Everything respondents read: situations, issues, delegate rosters, both AI plans. |
| `js/key.js` | The scoring key. Not shown to anyone. |
| `js/order.js` | Constrained randomisation: shuffles cases and cards, keeps declared `after` constraints, and validates them. |
| `js/scoring.js` | Turns a plan into scores. Both deferral modes. |
| `js/stats.js` | Alpha, correlations, power arithmetic. |
| `js/storage.js` | Where responses go. |
| `js/survey.js` | The respondent's side. |
| `js/dashboard.js` | The results view. |
| `css/styles.css` | All styling, with the rules that keep the cards neutral. |
| `netlify/functions/responses.mjs` | Stores and returns responses. |
| `make-docs.js` | `node make-docs.js` regenerates `docs/instrument.md` from the cases and the key. |
| `build.py` | Optional. Bundles everything into `dist/index.html` for a single-file copy. |

## Run it on your laptop

```bash
cd pilot-site
python3 -m http.server 5500
# open http://localhost:5500
```

Responses cannot be saved locally, so the last screen offers the
participant a block of text to copy. That is the fallback path working as
designed. The results view is at `http://localhost:5500/#researcher=change-me`.

## Put it online

### Option A — drag and drop, two minutes, no live results

1. Zip nothing; just drag the `pilot-site` folder onto <https://app.netlify.com/drop>.
2. In the Netlify UI open **Forms** and select **Enable form detection**.
3. Deploy once more (drag the folder again) so Netlify scans the form.
4. Share the site link.

Responses land under **Forms → pilot** in the Netlify UI. Export the CSV,
open the `payload` column, and paste the rows into **Add responses** in the
results view. Clunky, but it needs no account setup beyond Netlify itself.

### Option B — GitHub, live results (recommended)

1. Put this folder in a GitHub repository.
2. Netlify → **Add new site → Import an existing project** → pick the repo.
3. Leave the build command empty. Publish directory `.`. Netlify reads
   `netlify.toml` and installs the one dependency for the function.
4. Netlify → **Site configuration → Environment variables** → add
   `DASHBOARD_KEY` with a value only you know.
5. Set the same value as `dashboardKey` in `js/config.js`, commit, push.

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

- Open the site, press **Start**, and finish one case. Open the browser
  console: the page checks the key against the cases at load and prints
  anything missing or any AI plan whose good and weak versions are too
  close together.
- Complete a full run yourself, then open the results view and confirm your
  own response appears.
- Send the link to one person on another network before sending it to ten.

## Editing

**Wording, issues, rosters, AI plans** → `js/cases.js`. Keep the five issue
texts close in length; the cards are one size and equal length keeps them
balanced. Context pills may only repeat facts from the opening line.

**Scores** → `js/key.js`. Every issue needs an `own`, `wait`, `hold` and
`del` entry. The page warns in the console if one is missing.

**Rosters** → the third field of each person is `Title — remit`, split on
the em dash. The dropdown shows the name and title; the roster panel above
the board shows the remit. Keep the em dash or the split fails.

**How the deferral question is asked** → `deferMode` in `js/config.js`, or
add `?defer=merged` to the link for one participant. The mode used is
stored with every response, so you can field both in one pilot.

**Name and mobile** → `contactAt` in `js/config.js`: `"end"` (default),
`"start"` or `"off"`. The default is the last screen. A managerial
judgement task that carries the respondent's name before any decision is
made gets answered more carefully and more conventionally, and that lands
in the outcome you are measuring.

---

## What order respondents see things in

Case order is randomised. The six situations are six different
organisations with different people, different days and no shared
timeline, so no case has to follow another and all 720 orders can occur.

Card order inside a case is randomised too, except where one card only
reads correctly after another. Three pairs are declared, all of them
anaphora: a card that says "that agent", "the drop" or "that campus" is
unreadable before the card that introduces the agent, the drop or the
campus.

| Case | Constraint | Orders still possible |
| --- | --- | --- |
| 4 Friday support team | complaint before warning | 60 of 120 |
| 5 Fest week | drop before diagnosis, drop before coordinator | 40 of 120 |
| all others | none | 120 of 120 |

Declare a constraint by adding `after:["otherKey"]` to an issue in
`cases.js`, or `CASE_AFTER = {laterId:[earlierId]}` for whole cases.
`order.js` enforces it, the shuffle stays uniform over the orders that
satisfy it, and `checkOrderRules()` refuses to stay quiet if a constraint
names something that does not exist or forms a loop: the console gets an
error and a red band appears at the top of the page.

The order each respondent got is stored on their response, and both the
recap before the AI advice and the final-plan board replay that same
order. Nothing is reshuffled between screens.

## How a case is built

Six rules keep the six cases consistent. They are in the header of
`cases.js`, and the load-time check enforces what a machine can check.

1. **One situation line.** Time, your role, and the one horizon fact the
   key depends on. No pill strip, no second box.
2. **Two sources.** No card states both a fact and what it implies. What
   happened is on the card; who is good at what is in the roster. The
   respondent has to join the two. This is the rule that removes the
   giveaways without removing the answer.
3. **Every card says three things:** what happened, what is being asked of
   you now, and the constraint — a deadline, a cost of delay, or a fact
   nobody has yet. The task is clear. The priority is not.
4. **The roster is four of your own people**, each a title plus a one-line
   remit, and every person has to plausibly fit at least two issues. No
   clients, no outsiders, no track records.
5. **No label words on cards.** Never "urgent", "can wait", "delegate",
   "check first", "handle yourself".
6. **Equal weight.** Every card runs 18 to 40 words. One clearly
   low-stakes issue per case is deliberate: without it the allocation rule
   has no slack and the key gets noisy.

### Why the board looks the way it does

| Requirement | How the build meets it |
| --- | --- |
| Preserve every fact in the key | Issue text is the only place case facts live, and the key scores nothing that is not written on a card or in the roster. |
| Add nothing | No computed tags, risk levels, countdowns or icons. |
| Keep the uncertainty | Sentences such as "whether those units meet specification will not be known until the batch records are pulled" stay intact and unmarked. |
| No highlight on the right issue | One card style: same border, background, padding, type size and heading weight. Cards stretch to a common height. |
| No red-means-danger | Colour never attaches to an issue. The four hues belong to the respondent's own labels, and none is red or green. |
| Animation implies no priority | One fade, all five cards at once, 220 ms, no stagger. `prefers-reduced-motion` turns it off. |
| No ordering cue | Card order is shuffled per respondent and recorded. |
| Good and weak AI plans look identical | Same layout, same row order, same type, same length of reason text. |

What the design removes is the table-to-form mapping: the choice sits on
the card that states the issue, the roster sits above the board, and the
allocation counter is always visible.

---

## Documentation

`node make-docs.js` writes `docs/instrument.md` from `cases.js` and
`key.js`: every case as respondents read it, every roster, both AI plans
with their text, and the full key with all four delegate scores per issue.
Regenerate it after any edit so the write-up cannot drift from the
instrument.

**Accuracy of an AI plan** is that plan's own score under the key, on the
same 0-100 scale as a respondent's plan. It is a property of the advice,
not a probability, and it is never shown to respondents. Use the number as
AIQuality rather than a good/weak dummy: the weak plans are not equally
weak, and the continuous version makes the interaction readable per point
of advice quality.

---

## Two things the pilot data should settle

### Wait versus Hold

The five issues are a permutation: once Own and the two delegations are
set, the last two issues are forced, and the only remaining decision is
which of them is Wait and which is Hold. That single binary choice is worth
a lot under the current key. Holding Own and the delegations fixed and
flipping only that split moves the case score by:

| Case | Mean swing | Largest swing |
| --- | --- | --- |
| Launch morning | 21.8 | 47.5 |
| Strong employee | 19.3 | 40.0 |
| Monday project team | 15.8 | 31.3 |
| Friday support team | 23.3 | 45.0 |
| Fest week | 22.8 | 40.0 |
| Day before travel | 13.5 | 30.0 |

Across all 960 valid plans per case, the Wait and Hold parts carry 57 to
70 per cent of the variance in the case score, against 30 to 43 per cent
for Own and Delegate together. Listing all four people on every issue
raised the delegate part's spread from almost nothing to an SD of 19 to 24
points, which is why Own and Delegate now hold a third rather than a
quarter. It did not fix the imbalance: Wait and Hold are two of the four
components and each spans the full 0 to 100 range. If respondents cannot
tell the two labels apart, a coin toss is still driving most of your
ability measure.

The results view reports how often the split matched the key. Below about
two thirds, treat the distinction as unreliable and switch
`deferMode` to `"merged"`: the respondent sets two issues aside, and a
single follow-up question asks which of the two, if either, nobody should
act on until a fact is checked. The case score then becomes
`(Own + Delegate + which two were set aside) / 3`, and the hold judgement is
scored separately instead of silently carrying a fifth of the score.

Two consequences of that switch, both handled in the code:

- Every weak AI plan now sets aside at least one issue that should not be
  set aside, so the manipulation survives merged scoring. The narrowest
  gap is 20 points (Strong employee) against 31 to 57 under split scoring.
  The load-time check still warns if any case's two plans fall within 15
  points in the mode you are fielding.
- Merged scoring changes what the case score means, so do not mix the two
  modes inside one analysis. The mode is stored on every response.

### Do you need two delegations?

Keep two: the allocation is what makes the task triage rather than a
ranking. The free-points problem is fixed in the key — every issue now
carries a score for all four people, so choosing a defensible alternative
costs points instead of falling off a cliff, and `unlistedDelegateScore`
only applies if you add a person and forget to key them.

What is left to check is whether the person choice measures anything.

Two things to decide from the pilot:

- The results view shows the SD of the delegate component per case and the
  alpha of a case score built without it. If dropping it barely moves
  alpha, the delegate points are noise dressed as measurement, and the
  person choice should be treated as a separate task-fit variable rather
  than a quarter of the case score.
- If almost nobody picks an unlisted person, raise
  `unlistedDelegateScore` to something like 40 so a defensible alternative
  is not scored as a catastrophe, or extend the key in `key.js` to list all
  four people for every issue. The second is better and is the reason the
  key is in its own file.
