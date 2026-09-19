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
| `js/scoring.js` | Turns a plan into scores. Both deferral modes. |
| `js/stats.js` | Alpha, correlations, power arithmetic. |
| `js/storage.js` | Where responses go. |
| `js/survey.js` | The respondent's side. |
| `js/dashboard.js` | The results view. |
| `css/styles.css` | All styling, with the rules that keep the cards neutral. |
| `netlify/functions/responses.mjs` | Stores and returns responses. |
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

**How the deferral question is asked** → `deferMode` in `js/config.js`, or
add `?defer=merged` to the link for one participant. The mode used is
stored with every response, so you can field both in one pilot.

---

## Why the board looks the way it does

The visual briefing is meant to cut reading, not thinking. Every choice
below exists to stop the layout from answering the question for the
respondent.

| Requirement | How the build meets it |
| --- | --- |
| Preserve every fact in the key | Issue text is the case text, word for word. Nothing is summarised. |
| Add nothing | Context pills repeat only the opening line. There are no computed tags, risk levels, countdowns or icons. |
| Keep the uncertainty | Sentences such as "it is not yet known whether the products are affected" stay intact and unmarked. |
| No highlight on the right issue | One card style: same border, same background, same padding, same type size, same heading weight. Cards stretch to a common height, so a long issue and a short issue occupy the same space. |
| No red-means-danger | Colour never attaches to an issue. The four hues belong to the respondent's own labels, and none of them is red or green. |
| Animation implies no priority | One fade, all five cards at once, 220 ms. No stagger, no sequence, no motion after load. `prefers-reduced-motion` turns it off. |
| No ordering cue | Card order is shuffled per respondent and recorded, so position cannot be confounded with the key. |
| Wording does not hint at the label | Issue text is unchanged from the instrument you piloted, and the four labels are described once, in the instructions, in the same amount of detail. |
| Good and weak AI plans look identical | Same layout, same row order, same type, same length of reason text. The version is decided by a coin flip and never shown. |

What the design actually removes: the table-to-form mapping. In the old
version a respondent read a table, then scrolled to a separate form and had
to remember which row was which. Now the choice sits on the card that
states the issue, and the allocation counter is always visible.

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
| Launch morning | 20.5 | 47.5 |
| Strong employee | 22.8 | 42.5 |
| Monday project team | 16.3 | 32.5 |
| Friday support team | 25.5 | 47.5 |
| University outreach | 25.5 | 45.0 |
| Day before travel | 13.0 | 27.5 |

Across all valid plans, the Wait and Hold parts carry 55 to 74 per cent of
the variance in the case score, against 26 to 42 per cent for Own and
Delegate together. If respondents cannot tell the two labels apart, a coin
toss is driving most of your ability measure.

The results view reports how often the split matched the key. Below about
two thirds, treat the distinction as unreliable and switch
`deferMode` to `"merged"`: the respondent sets two issues aside, and a
single follow-up question asks which of the two, if either, nobody should
act on until a fact is checked. The case score then becomes
`(Own + Delegate + which two were set aside) / 3`, and the hold judgement is
scored separately instead of silently carrying a fifth of the score.

Two consequences of that switch, both handled in the code:

- Case 2's weak AI plan is weak only in its Wait/Hold split, so merged
  scoring makes it nearly as good as the strong plan. `cases.js` carries a
  separate `aiMerged` plan for that case. The load-time check warns you if
  any case's two plans fall within 15 points in the mode you are fielding.
- Merged scoring changes what the case score means, so do not mix the two
  modes inside one analysis. The mode is stored on every response.

### Do you need two delegations?

Keep two: the allocation is what makes the task triage rather than a
ranking. But the *person* choice is mostly free points as the key stands.
In Cases 1 and 2 four of the five issues list exactly one person, so
picking the obvious name scores 100 and anyone else scores whatever
`unlistedDelegateScore` says, which is 0 today. That is a hundred-point
cliff for a choice nothing in the case rules out: nothing says Priya cannot
chase the supplier.

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
