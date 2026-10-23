/* node make-docs.js — writes docs/instrument.md from cases.js + key.js, so the
   documentation cannot drift from what respondents actually see. Scores come
   from scoring.js itself, not from a copy of its rules. */
const fs = require("fs"), vm = require("vm");
const box = {window:{}, console, document:{createElement:()=>({}), body:{insertBefore(){}}}};
box.window = box; vm.createContext(box);
["js/config.js","js/cases.js","js/key.js","js/order.js","js/scoring.js"].forEach(f =>
  vm.runInContext(fs.readFileSync(f,"utf8"), box, {filename:f}));
const run = s => vm.runInContext(s, box);
const {CASES, KEY, ACTIONS, INSTRUCTIONS, PRACTICE, CONFIG, OWN_VS_DELEGATE} = box;
const LEVELS = run("AI_LEVELS"), LEVEL_NAME = {high:"High", moderate:"Moderate", low:"Low", very_low:"Very low"};
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
L.push("- Every AI reason for a non-preferred action is specific to its decision. The manual used four generic sentences there, which gave weak advice away. The actions recommended at each level, and the key, are unchanged.");
L.push("- The instructions add a who-decides / when grid and an Own-versus-Delegate example. The four actions share one neutral style; no action has a colour.\n");

L.push("## Instructions respondents read\n");
L.push(INSTRUCTIONS + "\n");
L.push("| Action | Who decides? | When? |");
L.push("| --- | --- | --- |");
ACTIONS.forEach(([, n,,, who, when]) => L.push(`| ${n} | ${who} | ${when} |`));
L.push("\n" + OWN_VS_DELEGATE + "\n");
L.push("| Action | Shown on each option | Definition |");
L.push("| --- | --- | --- |");
ACTIONS.forEach(([, n, gloss, def]) => L.push(`| ${n} | ${gloss} | ${def} |`));
L.push("");

L.push("## Practice questions and attention check (Wait versus Hold, not scored)\n");
L.push("Both answered as expected counts as passing the attention check; the results view can leave out those who fail.\n");
PRACTICE.items.forEach(i => L.push(`- **${i.n}** (expected: ${label(i.answer)}). ${i.t} To decide: ${i.q}`));
L.push(`\nFeedback shown after answering: ${PRACTICE.feedback}\n`);

L.push("## Order and AI advice assignment\n");
L.push(`Caselet order is ${CONFIG.randomiseCaseOrder ? "randomised per respondent" : "fixed"}. Decision order inside a caselet is ${CONFIG.randomiseDecisionOrder ? "randomised per respondent" : "fixed, as numbered below"}. Both orders are stored on every response.\n`);
L.push(`Each respondent is given one of ${CONFIG.aiConditions} AI conditions at random. The condition rotates the four advice levels across the caselets, so every respondent sees every level, and across the conditions every caselet appears at every level once. Levels and scores are never shown to respondents.\n`);
L.push("| Caselet | " + [...Array(CONFIG.aiConditions).keys()].map(i => `Condition ${i}`).join(" | ") + " |");
L.push("| --- |" + " --- |".repeat(CONFIG.aiConditions));
const assign = [...Array(CONFIG.aiConditions).keys()].map(i => run(`aiAssignment(${i})`));
CASES.forEach(c => L.push(`| ${c.name} | ` + assign.map(a => LEVEL_NAME[a[c.id]]).join(" | ") + " |"));
L.push("");

L.push("## Scoring\n");
L.push("Every decision scores all four actions from 0 to 20; each decision has exactly one 20, its preferred action. A caselet score is the sum of its five decision scores, 0 to 100, for the first answers, the final answers and the AI advice alike.\n");
L.push("| Caselet | " + LEVELS.map(l => LEVEL_NAME[l] + " advice").join(" | ") + " |");
L.push("| --- |" + " --- |".repeat(LEVELS.length));
CASES.forEach(c => L.push(`| ${c.name} | ` + LEVELS.map(l => run(`aiPlanScore(caseById(${c.id}), "${l}")`)).join(" | ") + " |"));
L.push("");

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
  LEVELS.forEach(l => {
    const s = run(`scorePlan(${c.id}, aiPlan(caseById(${c.id}), "${l}").actions)`);
    L.push(`*${LEVEL_NAME[l]}: ${s.total}/100, ${s.matches} of 5 preferred*\n`);
    c.decisions.forEach((d, i) => L.push(`${i+1}. ${d.n}: **${label(c.ai[l][d.k][0])}**. ${c.ai[l][d.k][1]}`));
    L.push("");
  });
});

fs.mkdirSync("docs", {recursive:true});
fs.writeFileSync("docs/instrument.md", L.join("\n"));
console.log("wrote docs/instrument.md", fs.statSync("docs/instrument.md").size, "bytes");
