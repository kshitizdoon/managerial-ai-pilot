/* node make-docs.js — writes docs/instrument.md (and the server's scoring data,
   netlify/lib/instrument-data.mjs) from cases.js + key.js, so the
   documentation cannot drift from what respondents actually see. Scores come
   from scoring.js itself, not from a copy of its rules. */
const fs = require("fs"), vm = require("vm");
const box = {window:{}, console, document:{createElement:()=>({}), body:{insertBefore(){}}}};
box.window = box; vm.createContext(box);
["js/config.js","js/cases.js","js/key.js","js/order.js","js/scoring.js"].forEach(f =>
  vm.runInContext(fs.readFileSync(f,"utf8"), box, {filename:f}));
const run = s => vm.runInContext(s, box);
const {CASES, KEY, ACTIONS, INSTRUCTIONS, CONFIG} = box;
const label = a => (ACTIONS.find(x => x[0] === a) || [a, a])[1];
const meta = run("instrumentMeta()");

let L = [];
L.push("# Instrument\n");
L.push("Generated from `js/cases.js`, `js/key.js` and `js/scoring.js`. Do not edit by hand; run `node make-docs.js`.\n");
L.push(`Instrument version \`${meta.instrumentVersion}\`, cases \`${meta.casesHash}\`, key \`${meta.keyHash}\`, scoring v${meta.scoringVersion}.\n`);

L.push("## Changes from the manual\n");
L.push("The text follows the 8 October 2026 manual, with the pilot feedback of 22 October 2026 applied:\n");
L.push("- Every decision states what is to be decided (\"To decide:\" below each decision).");
L.push("- Each caselet shows its key numbers as tiles above the opening. They restate the opening; nothing new.");
L.push("- Launch Morning / Opening readiness: \"the advertised class schedule\" now reads \"the group exercise classes advertised for this afternoon\".");
L.push("- Every AI reason for a non-preferred action is specific to its decision. The manual used four generic sentences there, which gave weak advice away. The key is unchanged.");
L.push("- The instructions add a who-decides / when grid. The four actions share one neutral style; no action has a colour.");
L.push("- November 2026: five caselets with four decisions each. Day Before Travel is dropped, with one decision from each other caselet (Monday Project Team / Client escalation, Strong Employee / Employee development, Fest Week / Event staffing, Friday Support Team / Weekend service allocation, Launch Morning / Team responsibilities).");
L.push("- November 2026: some AI actions were moved so that every caselet scores the same at each advice level (high, moderate, low and very low advice are one, two, three and four decisions away from the preferred action). Moved actions reuse the reason written for that action at another level; Monday Project Team / Revised recommendation at very low has a new reason.");
L.push("- November 2026: no practice questions and no Own-versus-Delegate example; shorter instructions and welcome text; About you and the prize draw are on the last page; the pilot feedback and last-few-questions blocks are gone.");
L.push("- November 2026 (`survey-2026-11-5x4-r50`): the four advice levels are replaced by advice that is right or wrong decision by decision, drawn at random for each respondent (half right, half wrong). Each decision has one right advice and one or more wrong ones, taken from the earlier levels. Four decisions had no right advice at any level and now have one: Monday Project Team / Delivery recovery, Strong Employee / Client presentation, Friday Support Team / Client recovery plan, Launch Morning / Customer experience. Decision order inside each caselet is now shuffled. Strong Employee / Financial commitment is reworded in plainer language.\n");

L.push("## Instructions respondents read\n");
L.push(INSTRUCTIONS + "\n");
L.push("| Action | Who decides? | When? |");
L.push("| --- | --- | --- |");
ACTIONS.forEach(([, n,,, who, when]) => L.push(`| ${n} | ${who} | ${when} |`));
L.push("");
L.push("| Action | Shown on each option | Definition |");
L.push("| --- | --- | --- |");
ACTIONS.forEach(([, n, gloss, def]) => L.push(`| ${n} | ${gloss} | ${def} |`));
L.push("");

L.push("## Order and AI advice assignment\n");
L.push(`Caselet order is ${CONFIG.randomiseCaseOrder ? "randomised per respondent" : "fixed"}. Decision order inside a caselet is ${CONFIG.randomiseDecisionOrder ? "randomised per respondent" : "fixed, as numbered below"}. Both orders are stored on every response.\n`);
L.push(`For each respondent the AI advice is right (the key's preferred action) on ${Math.round(CONFIG.aiRightShare * 100)}% of all decisions, chosen at random, and wrong on the rest. Wrong advice picks one of the decision's wrong options at random. Whether advice is right is never shown to respondents. The draw is stored with every response.\n`);

L.push("## Scoring\n");
L.push(`Every decision scores all four actions from 0 to 20; each decision has exactly one 20, its preferred action. A caselet score is the sum of its ${run("DECISIONS_PER_CASE")} decision scores, rescaled to 0 to 100 (sum × 100 / ${20 * run("DECISIONS_PER_CASE")}), for the first answers, the final answers and the AI advice alike.\n`);
CASES.forEach(c => {
  L.push(`## ${c.name} (case ${c.id})\n`);
  L.push(`*${c.when}*\n`);
  L.push((c.facts || []).map(([v, l]) => `**${v}** ${l}`).join(" · ") + "\n");
  L.push(`${c.opening}\n`);
  c.decisions.forEach((d, i) => L.push(`${i+1}. **${d.n}** (\`${d.k}\`). ${d.t} *To decide:* ${d.q}`));
  L.push("\n**Key**\n");
  L.push("| Decision | Own | Delegate | Wait | Hold | Preferred |");
  L.push("| --- | --- | --- | --- | --- | --- |");
  c.decisions.forEach(d => { const K = KEY[c.id][d.k];
    L.push(`| ${d.n} | ${K.own} | ${K.delegate} | ${K.wait} | ${K.hold} | ${label(run(`preferredAction(${c.id}, "${d.k}")`))} |`); });
  L.push("\n**AI advice**\n");
  c.decisions.forEach((d, i) => {
    const a = c.ai[d.k];
    L.push(`${i+1}. **${d.n}**`);
    L.push(`   - Right: **${label(run(`preferredAction(${c.id}, "${d.k}")`))}**. ${a.right}`);
    a.wrong.forEach(([act, why]) => L.push(`   - Wrong: **${label(act)}** (scores ${KEY[c.id][d.k][act]}). ${why}`));
  });
  L.push("");
});

/* the server's copy of what it needs to score a Producer record: the key,
   decision ids and versions. Used by netlify/functions/evaluator.mjs to
   compute each target's ability without sending the key to browsers. */
const server = {
  INSTRUMENT_VERSION: meta.instrumentVersion, SCORING_VERSION: meta.scoringVersion,
  RECORD_SCHEMA: run("RECORD_SCHEMA"), KEY_HASH: meta.keyHash, CASES_HASH: meta.casesHash,
  DECISION_MAX: run("DECISION_MAX"),
  CASE_IDS: CASES.map(c => c.id),
  CASE_DECISIONS: Object.fromEntries(CASES.map(c => [c.id, c.decisions.map(d => d.k)])),
  KEY
};
fs.mkdirSync("netlify/lib", {recursive:true});
fs.writeFileSync("netlify/lib/instrument-data.mjs",
  "/* Generated by `node make-docs.js` from js/cases.js and js/key.js. Do not edit by hand. */\n" +
  Object.entries(server).map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`).join("\n") + "\n");
console.log("wrote netlify/lib/instrument-data.mjs");

fs.mkdirSync("docs", {recursive:true});
fs.writeFileSync("docs/instrument.md", L.join("\n"));
console.log("wrote docs/instrument.md", fs.statSync("docs/instrument.md").size, "bytes");
