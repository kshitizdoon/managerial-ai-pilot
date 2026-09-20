/* node make-docs.js — writes docs/instrument.md from cases.js + key.js, so the
   documentation cannot drift from what respondents actually see. */
const fs = require("fs"), vm = require("vm");
const box = {window:{}, console}; box.window = box; vm.createContext(box);
["js/config.js","js/cases.js","js/key.js","js/order.js"].forEach(f =>
  vm.runInContext(fs.readFileSync(f,"utf8"), box, {filename:f}));
const {CASES, KEY, cardEdges, caseEdges} = box;

const person = p => { const b = String(p[2]).split(" \u2014 ");
  return {k:p[0], name:p[1], title:b[0], remit:b.slice(1).join(" \u2014 ")}; };

function score(id, p, mode){
  const K = KEY[id], own = K.own[p.own] ?? 0;
  const ks = Object.keys(p.del);
  const del = ks.reduce((s,i)=> s + (K.del[i][p.del[i]] ?? 0), 0) / ks.length;
  if(mode === "merged"){
    const [a,b] = p.defer || [p.wait, p.hold];
    const set = Math.max(((K.wait[a]??0)+(K.hold[b]??0))/2, ((K.wait[b]??0)+(K.hold[a]??0))/2);
    return {own, del, set, total:(own+del+set)/3};
  }
  return {own, del, wait:K.wait[p.wait]??0, hold:K.hold[p.hold]??0,
          total:(own+del+(K.wait[p.wait]??0)+(K.hold[p.hold]??0))/4};
}
const nm = (c,k) => (c.issues.find(i=>i.k===k)||{}).n || k;
const pn = (c,k) => { const p = c.people.find(x=>x[0]===k); return p ? p[1] : k; };
const planLine = (c,p) => [`Own ${nm(c,p.own)}`]
  .concat(Object.keys(p.del).map(i=>`Delegate ${nm(c,i)} to ${pn(c,p.del[i])}`))
  .concat([`Wait ${nm(c,p.wait)}`, `Hold ${nm(c,p.hold)}`]).join("; ");

let L = [];
L.push("# Instrument\n");
L.push("Generated from `js/cases.js` and `js/key.js`. Do not edit by hand; run `node make-docs.js`.\n");

L.push("## Order in which respondents see things\n");
L.push("Case order is randomised per respondent. The six situations are six different organisations with different people, different days and no shared timeline, so no case has to follow another and all 720 case orders can occur.\n");
L.push("Card order inside a case is randomised too, except where one card only reads correctly after another. Those pairs are declared in `cases.js` as `after:[...]`, enforced by `order.js`, and checked at load.\n");
L.push("| Case | Must precede | Why | Orders still possible |");
L.push("| --- | --- | --- | --- |");
const WHY = {"4:complaint>warning":"The warning card says \"that agent\" and \"the client's account\". Both are introduced by the complaint card.",
             "5:drop>diagnosis":"The data card says \"the drop\", \"the rival fest\" and \"the coordinator's exit\". All three are introduced by the registrations card.",
             "5:drop>coordinator":"The coordinator card says \"that campus\". The campus is introduced by the registrations card."};
CASES.forEach(c => {
  const e = cardEdges(c);
  if(!e.length){ L.push(`| ${c.id} ${c.name} | none | five things on one desk at one time | 120 of 120 |`); return; }
  const n = e.length === 1 ? 60 : 40;
  e.forEach((pair,i) => L.push(`| ${i?"":c.id+" "+c.name} | ${pair[0]} before ${pair[1]} | ${WHY[c.id+":"+pair[0]+">"+pair[1]]||""} | ${i?"":n+" of 120"} |`));
});
L.push("\nThe recap before the AI advice, and the board on the final-plan screen, both replay the order that respondent was given. Nothing is reshuffled between screens.\n");

L.push("## AI advice: what is shown, and what it is worth\n");
L.push("Each respondent sees version A or B, decided by a coin flip at the start and held for all six cases. Every respondent therefore gets three good plans and three weak ones. The version is never shown, and no accuracy figure is ever shown to the respondent.\n");
L.push("**Accuracy of an AI plan** is that plan's own score under the researcher key, on the same 0-100 scale as a respondent's plan. It is a property of the advice, not a probability. Use the number itself as AIQuality in the regression rather than a good/weak dummy: the weak plans are not equally weak, and the continuous version makes the interaction interpretable per point of advice quality.\n");
L.push("| Case | Version | Arm | Accuracy, split | Accuracy, merged |");
L.push("| --- | --- | --- | --- | --- |");
CASES.forEach(c => ["A","B"].forEach(v => {
  const good = c.goodVersion === v;
  L.push(`| ${c.id} ${c.name} | ${v} | ${good?"good":"weak"} | ${score(c.id,c.ai[v],"split").total.toFixed(1)} | ${score(c.id,c.ai[v],"merged").total.toFixed(1)} |`);
}));
L.push("");

CASES.forEach(c => {
  L.push(`## Case ${c.id} — ${c.name}\n`);
  L.push(`${c.opening}\n`);
  const ce = cardEdges(c);
  if(ce.length) L.push(`Card order constraint: ${ce.map(p=>p[0]+" before "+p[1]).join("; ")}.\n`);
  L.push("| Issue | What the respondent reads |");
  L.push("| --- | --- |");
  c.issues.forEach(i => L.push(`| **${i.n}** | ${i.t} |`));
  L.push("\n**Your team**\n");
  L.push("| Person | Title | Remit |");
  L.push("| --- | --- | --- |");
  c.people.forEach(p => { const q = person(p); L.push(`| ${q.name} | ${q.title} | ${q.remit} |`); });

  L.push("\n**AI advisor text**\n");
  ["A","B"].forEach(v => {
    const a = c.ai[v], good = c.goodVersion === v, s = score(c.id, a, "split");
    L.push(`*Version ${v} — ${good?"good":"weak"} — accuracy ${s.total.toFixed(1)}*\n`);
    L.push(`> ${a.why}\n`);
    L.push(`Plan: ${planLine(c,a)}.`);
    L.push(`Component scores: own ${s.own}, delegate ${s.del}, wait ${s.wait}, hold ${s.hold}.\n`);
  });

  L.push("**Key**\n");
  L.push("| Issue | Own | Wait | Hold | " + c.people.map(p=>person(p).name).join(" | ") + " |");
  L.push("| --- |" + " --- |".repeat(3 + c.people.length));
  c.issues.forEach(i => {
    const K = KEY[c.id];
    L.push(`| ${i.n} | ${K.own[i.k]} | ${K.wait[i.k]} | ${K.hold[i.k]} | ` +
      c.people.map(p => K.del[i.k][p[0]]).join(" | ") + " |");
  });
  L.push("");
});

fs.mkdirSync("docs", {recursive:true});
fs.writeFileSync("docs/instrument.md", L.join("\n"));
console.log("wrote docs/instrument.md", fs.statSync("docs/instrument.md").size, "bytes");
