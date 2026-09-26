/* =============================================================
   dashboard.js — the results view, at  #researcher=YOUR_KEY
   ============================================================= */

async function showDashboard(key){
  setStep("Results", 100);
  paint(`<h1>Pilot results</h1><p class="muted">Loading…</p>`, true);
  const live = await fetchResponses(key);
  /* One record per PID. A finished copy beats an unfinished one, then the
     newer checkpoint wins. So a participant's emailed backup replaces the
     unfinished server record it completes. The device archive holds
     earlier sessions on this browser; this browser's own record counts
     only if finished, so a researcher's test run does not show up. */
  const mine = loadLocal();
  const rows = mergeRecords(live.rows, importedRows(), archivedRows(), mine && mine.done ? [mine] : []);
  renderDashboard(rows, live);
}

/* Did the final plan end up at the AI's plan? Compared on the scored
   components, not on the menu button. "use_ai" satisfies it by
   construction, but so does a respondent who edited their own plan into
   the AI's, and the menu label alone cannot tell you either way. */
function samePlan(a, b, mode){
  if(!a || !b) return false;
  if(a.own !== b.own) return false;
  const da = a.del || {}, db = b.del || {};
  const ka = Object.keys(da).sort(), kb = Object.keys(db).sort();
  if(ka.join("|") !== kb.join("|")) return false;
  if(ka.some(k => da[k] !== db[k])) return false;
  if(mode === "merged"){
    const pa = [...(a.defer || [a.wait, a.hold])].sort();
    const pb = [...(b.defer || [b.wait, b.hold])].sort();
    return pa.join("|") === pb.join("|") && (a.holdPick ?? a.hold ?? null) === (b.holdPick ?? b.hold ?? null);
  }
  return a.wait === b.wait && a.hold === b.hold;
}

function personRows(raw){
  const out = [];
  raw.filter(r => r && r.done && r.cases).forEach(r => {
    const mode = r.deferMode || "split";
    const cs = [];
    CASES.forEach(c => {
      const rec = r.cases[c.id]; if(!rec || !rec.first) return;
      const fin = rec.final || rec.first;
      const first = scorePlan(c.id, rec.first, mode);
      const final = scorePlan(c.id, fin, mode);
      const aiP = aiPlan(c, r.version, mode);
      const ai = scorePlan(c.id, aiP, mode);
      const both = scoreBothWays(c.id, rec.first);
      const pair = rec.first.defer && rec.first.defer.length === 2
        ? rec.first.defer : [rec.first.wait, rec.first.hold];
      const unlisted = Object.keys(rec.first.del || {})
        .filter(i => !(KEY[c.id].del[i] || {})[rec.first.del[i]]).length;
      cs.push({
        id:c.id, name:c.name, pos:rec.pos, good:aiIsGood(c, r.version),
        first:first.total, final:final.total, ai:ai.total, parts:first,
        mergedFirst: both.merged.total, splitFirst: both.split ? both.split.total : null,
        pair, splitOK: mode === "split" ? splitMatchesKey(c.id, pair, rec.first.wait) : null,
        swing: splitSwing(c.id, pair),
        holdPick: rec.first.holdPick ?? rec.first.hold ?? null,
        holdScore: (rec.first.holdPick ?? rec.first.hold) ? (KEY[c.id].hold[rec.first.holdPick ?? rec.first.hold] ?? 0) : null,
        unlisted, menu:rec.menu, conf1:rec.conf1,
        startedApart: !samePlan(rec.first, aiP, mode),
        endedAtAI: samePlan(fin, aiP, mode),
        errs:(rec.errA||0)+(rec.errC||0), ownPick:rec.first.own,
        min:((rec.msA||0)+(rec.msB||0)+(rec.msC||0)+(rec.msD||0))/60000
      });
    });
    if(cs.length !== CASES.length) return;
    cs.sort((a,b) => a.id - b.id);
    out.push({pid:r.pid, version:r.version, mode, bg:r.bg, end:r.end, pilot:r.pilot,
              totalMin: r.totalMin != null ? r.totalMin : (new Date(r.finished) - new Date(r.started))/60000,
              cases: cs, mda: mean(cs.map(x => x.first))});
  });
  return out;
}

function renderDashboard(raw, live){
  const per = personRows(raw);
  const N = per.length;
  const incomplete = raw.filter(r => r && r.pid && !r.done);
  const incompleteRows = incomplete.length ? `
   <h2>Unfinished responses</h2>
   <p class="small muted">People who are still going or who dropped out. These are saved checkpoints, not completed responses, and are left out of all statistics below.</p>
   <div class="scroll"><table class="data">
     <tr><th>PID</th><th>Cases completed</th><th>First plans saved</th><th>Last checkpoint</th><th>Reason</th></tr>
     ${incomplete.map(r => `<tr><td>${esc(r.pid)}</td><td>${completedCaseCount(r)}/${CASES.length}</td><td>${firstPlanCount(r)}/${CASES.length}</td><td>${esc(r.receivedAt || r.clientSavedAt || "—")}</td><td>${esc(r.saveReason || "—")}</td></tr>`).join("")}
   </table></div>` : "";
  const importUI = `
   <h3>Add responses</h3>
   <div class="card">
     <p class="small muted" style="margin:0 0 .5rem">Paste the block of text a participant sent you, or the JSON file they downloaded. One or several, one per line or as a JSON array.</p>
     <textarea id="paste"></textarea>
     <p style="margin:.5rem 0 0"><button class="ghost" id="addr">Add</button>
     <button class="ghost" id="clr">Clear added responses</button>
     <span class="small muted" id="addmsg"></span></p>
   </div>`;

  if(!N){
    paint(`<h1>Pilot results</h1>
      <p>No completed responses yet${live && !live.ok ? ` — and the live data could not be loaded (${esc(live.why)}). Check the key in this link and DASHBOARD_KEY in Netlify.` : "."}</p>
      ${incompleteRows}
      ${importUI}
      <p class="small muted"><a href="#" id="back">Back to the survey</a></p>`, true);
    return wireDash(per);
  }

  const J = CASES.length;
  const scores = per.map(p => p.cases.map(c => c.first));
  const alpha = alphaOf(scores);
  const r1 = singleItemRel(alpha, J);
  const relLoo = spearmanBrown(r1, J - 1);

  /* variants, to see which parts of the case score carry the measurement */
  const alphaNoDel  = alphaOf(per.map(p => p.cases.map(c => (c.parts.own + (c.parts.wait ?? 0) + (c.parts.hold ?? c.parts.set ?? 0))/3)));
  const alphaMerged = alphaOf(per.map(p => p.cases.map(c => c.mergedFirst)));
  const alphaOwn    = alphaOf(per.map(p => p.cases.map(c => c.parts.own)));

  const gains = [].concat(...per.map(p => p.cases.map(c => c.final - c.first)));
  const sigmaG = sd(gains);
  const dI = per.map(p => {
    const g = p.cases.filter(c => c.good).map(c => c.final - c.first);
    const b = p.cases.filter(c => !c.good).map(c => c.final - c.first);
    return (g.length ? mean(g) : 0) - (b.length ? mean(b) : 0);
  });
  const sdD = sd(dI) || 1e-6;

  const arm = good => {
    const s = [].concat(...per.map(p => p.cases.filter(c => c.good === good)));
    const apart = s.filter(c => c.startedApart);
    return {n:s.length, gain:mean(s.map(c => c.final - c.first)),
      took: apart.length ? 100*apart.filter(c => c.endedAtAI).length/apart.length : 0,
      tookN: apart.length,
      keep:100*s.filter(c=>c.menu==="keep").length/s.length,
      useAi:100*s.filter(c=>c.menu==="use_ai").length/s.length,
      editMine:100*s.filter(c=>c.menu==="edit_mine").length/s.length};
  };
  const fg = arm(true), fb = arm(false);
  const times = per.map(p => p.totalMin);

  const stats = CASES.map(c => {
    const s = per.map(p => p.cases.find(x => x.id === c.id)).filter(Boolean);
    const first = s.map(x => x.first);
    const others = per.map(p => mean(p.cases.filter(x => x.id !== c.id).map(x => x.first)));
    const owns = {}; s.forEach(x => owns[x.ownPick] = (owns[x.ownPick]||0)+1);
    const top = Object.entries(owns).sort((a,b)=>b[1]-a[1])[0] || ["—",0];
    const nameOf = k => (c.issues.find(i=>i.k===k)||{}).n || k;
    const splits = s.map(x => x.splitOK).filter(x => x !== null);
    return {c, n:s.length, mean:mean(first), sd:sd(first), lo:Math.min(...first), hi:Math.max(...first),
      itemTotal:corr(first, others), minutes:med(s.map(x=>x.min)), errs:s.reduce((a,x)=>a+x.errs,0),
      sdOwn:sd(s.map(x=>x.parts.own)), sdDel:sd(s.map(x=>x.parts.del)),
      sdWait:sd(s.map(x=>x.parts.wait ?? 0)), sdHold:sd(s.map(x=>x.parts.hold ?? 0)),
      topOwn:`${nameOf(top[0])} ${Math.round(100*top[1]/s.length)}%`, spread:Object.keys(owns).length,
      splitOK: splits.length ? 100*splits.filter(Boolean).length/splits.length : NaN,
      swing: mean(s.map(x=>x.swing)), unlisted:s.reduce((a,x)=>a+x.unlisted,0),
      holdScore: mean(s.map(x=>x.holdScore).filter(x=>x!=null))};
  });

  const splitAll = [].concat(...per.map(p => p.cases.map(c => c.splitOK))).filter(x => x !== null);
  const splitRate = splitAll.length ? 100*splitAll.filter(Boolean).length/splitAll.length : NaN;
  const unlistedRate = 100 * [].concat(...per.map(p=>p.cases.map(c=>c.unlisted))).reduce((a,b)=>a+b,0) / (N*J*2);
  const confCorr = corr([].concat(...per.map(p=>p.cases.map(c=>c.conf1))),
                        [].concat(...per.map(p=>p.cases.map(c=>c.first))));
  const abilityGain = corr(per.map(p=>p.mda), dI);

  const flags = [];
  if(N >= 4){
    if(!(alpha > 0.4)) flags.push(`Cronbach's alpha is ${fmt(alpha,2)}. The six cases are not yet measuring one thing. More cases will not fix that; the key or the cases need sharper separation first.`);
    if(Number.isFinite(splitRate) && splitRate < 65) flags.push(`Only ${pct(splitRate)} of wait/hold splits matched the key, and that split is worth ${fmt(mean(stats.map(s=>s.swing)))} case-score points on average. That is close to a coin toss driving a large part of the score. Try the merged mode.`);
    if(unlistedRate < 5) flags.push(`Almost every delegation went to the person the key lists (${pct(100-unlistedRate)}). The delegate choice is adding score but no information. Keep the two delegations for the structure, and look at the alpha column without them.`);
    if(med(times) > 20) flags.push(`Median run time is ${fmt(med(times))} minutes. Expect drop-out in the main run unless cases are cut or shortened.`);
    if(Math.abs(fg.took - fb.took) < 5) flags.push(`People take the good and the bad AI plan at almost the same rate (${pct(fg.took)} against ${pct(fb.took)}). Either the plans are not distinguishable or the advice is read as authority.`);
    stats.forEach(s => {
      if(s.sd < 5) flags.push(`${s.c.name}: almost no spread in the first-plan score (SD ${fmt(s.sd)}). It adds nothing to the ability measure.`);
      if(s.itemTotal < 0.1) flags.push(`${s.c.name}: item-total correlation ${fmt(s.itemTotal,2)}. It disagrees with the other five cases; check its key.`);
      if(s.errs >= N) flags.push(`${s.c.name}: ${s.errs} blocked label presses across ${N} people. The allocation rule is tripping people here.`);
    });
  }

  paint(`
   <h1>Pilot results</h1>
   <p class="muted">${N} completed response${N>1?"s":""}; ${incomplete.length} unfinished${live && !live.ok ? " (imported; no live database on this host)" : ""}. Modes among completed: ${esc(tally(per.map(p=>p.mode)))}.</p>
   ${incompleteRows}

   <div class="kpi">
     <div><b>${N}</b><span>completed</span></div>
     <div><b>${fmt(med(times))}</b><span>median minutes</span></div>
     <div><b>${fmt(mean(per.map(p=>p.mda)))}</b><span>mean ability score</span></div>
     <div><b>${fmt(sd(per.map(p=>p.mda)))}</b><span>SD between people</span></div>
     <div><b>${fmt(alpha,2)}</b><span>alpha, 6 cases</span></div>
   </div>

   <h2>Is the instrument measuring one thing?</h2>
   <div class="scroll"><table class="data">
     <tr><th>Case</th><th>n</th><th>Mean</th><th>SD</th><th>Low</th><th>High</th><th>Item-total r</th><th>Median min</th><th>Blocked presses</th></tr>
     ${stats.map(s=>`<tr><td>${esc(s.c.name)}</td><td>${s.n}</td><td>${fmt(s.mean)}</td><td>${fmt(s.sd)}</td>
       <td>${fmt(s.lo)}</td><td>${fmt(s.hi)}</td><td>${fmt(s.itemTotal,2)}</td><td>${fmt(s.minutes)}</td><td>${s.errs}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">Alpha ${fmt(alpha,2)} implies a single-case reliability of ${fmt(r1,2)} and ${fmt(relLoo,2)} for the leave-one-out ability score. Your interaction is attenuated by ${fmt(Math.sqrt(Math.max(relLoo,0)),2)}.</p>

   <h2>Which parts of the score carry the measurement?</h2>
   <div class="scroll"><table class="data">
     <tr><th>Case score built from</th><th>Alpha</th></tr>
     <tr><td>Own + Delegate + Wait + Hold (as fielded)</td><td>${fmt(alpha,2)}</td></tr>
     <tr><td>Own + Delegate + which two were set aside</td><td>${fmt(alphaMerged,2)}</td></tr>
     <tr><td>Without the delegate part</td><td>${fmt(alphaNoDel,2)}</td></tr>
     <tr><td>Own choice only</td><td>${fmt(alphaOwn,2)}</td></tr>
   </table></div>
   <div class="scroll"><table class="data">
     <tr><th>Case</th><th>SD of Own</th><th>SD of Delegate</th><th>SD of Wait</th><th>SD of Hold</th><th>Wait/Hold matched key</th><th>Points that split is worth</th><th>Unlisted delegates</th></tr>
     ${stats.map(s=>`<tr><td>${esc(s.c.name)}</td><td>${fmt(s.sdOwn)}</td><td>${fmt(s.sdDel)}</td>
       <td>${fmt(s.sdWait)}</td><td>${fmt(s.sdHold)}</td><td>${Number.isFinite(s.splitOK)?pct(s.splitOK):"—"}</td>
       <td>${fmt(s.swing)}</td><td>${s.unlisted}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">A component with SD near zero is giving everyone the same points. ${Number.isFinite(splitRate)?`Across all cases, ${pct(splitRate)} of wait/hold splits matched the key.`:""} ${pct(unlistedRate)} of delegations went to someone the key does not list.</p>

   <h2>How far apart the two AI plans are</h2>
   <div class="scroll"><table class="data">
     <tr><th>Case</th><th>Good plan scores</th><th>Bad plan scores</th><th>Gap</th></tr>
     ${aiQualityGaps(per[0].mode).map(g=>`<tr><td>${esc(g.name)}</td><td>${fmt(g.good)}</td><td>${fmt(g.bad)}</td><td>${fmt(g.gap)}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">This is the designed manipulation, not a result. A gap under 15 points means that case cannot tell you much about AI quality; rewrite its weak plan.</p>

   <h2>What people did with the AI</h2>
   <div class="scroll"><table class="data">
     <tr><th>AI plan quality</th><th>Cases</th><th>Kept my plan</th><th>Used AI's plan</th><th>Edited my plan</th><th>Took the AI</th><th>Mean score change</th></tr>
     <tr><td>Good</td><td>${fg.n}</td><td>${pct(fg.keep)}</td><td>${pct(fg.useAi)}</td><td>${pct(fg.editMine)}</td><td>${pct(fg.took)}</td><td>${fmt(fg.gain)}</td></tr>
     <tr><td>Bad</td><td>${fb.n}</td><td>${pct(fb.keep)}</td><td>${pct(fb.useAi)}</td><td>${pct(fb.editMine)}</td><td>${pct(fb.took)}</td><td>${fmt(fb.gain)}</td></tr>
   </table></div>
   <p class="small muted">Took the AI counts cases where the final plan ended up at the AI's plan on every scored part, out of the cases where the first plan was not already there (${fg.tookN} good, ${fb.tookN} bad). It is read off the plans, not off which button was pressed, so editing your own plan into the AI's counts.</p>
   <p class="small muted">Confidence before the AI correlates ${fmt(confCorr,2)} with the first-plan score — the metaknowledge check. Ability correlates ${fmt(abilityGain,2)} with the good-minus-bad change, which is your interaction, unadjusted.</p>

   <h2>What this means for the main run</h2>
   <div class="kpi">
     <div><b>${fmt(sigmaG)}</b><span>SD of change per case</span></div>
     <div><b>${fmt(sdD)}</b><span>SD of good minus bad</span></div>
     <div><b>${fmt(mean(dI))}</b><span>mean good minus bad</span></div>
   </div>
   <div class="scroll"><table class="data">
     <tr><th>Test</th><th>N=50</th><th>N=100</th><th>N=150</th><th>N=200</th></tr>
     <tr><td>AI quality main effect, points</td>
       ${[50,100,150,200].map(n=>`<td>${fmt(Z_POWER*sdD/Math.sqrt(n))}</td>`).join("")}</tr>
     <tr><td>Ability × AI quality, points per SD of ability</td>
       ${[50,100,150,200].map(n=>`<td>${fmt(mdeInteraction(sdD,n,relLoo))}</td>`).join("")}</tr>
   </table></div>
   <p class="small muted">80% power, two-sided 5%, person fixed effects, ${J} cases each. To detect an interaction of 5 points per SD of ability you need about <b>${nNeeded(5,sdD,relLoo)}</b> people; 8 points, about <b>${nNeeded(8,sdD,relLoo)}</b>; 12 points, about <b>${nNeeded(12,sdD,relLoo)}</b>.</p>

   ${flags.length ? `<h2>Fix before the main run</h2>${flags.map(f=>`<p class="flag">${esc(f)}</p>`).join("")}`
     : `<h2>No automatic flags</h2><p class="small muted">${N<4?"Too few responses to flag anything yet.":"Nothing tripped a threshold. Read the comments below anyway."}</p>`}

   <h2>What people said</h2>
   <div class="scroll"><table class="data">
     <tr><td>Wait vs Hold clear</td><td style="text-align:left">${esc(tally(per.map(p=>p.pilot&&p.pilot.waitHold)))}</td></tr>
     <tr><td>Length</td><td style="text-align:left">${esc(tally(per.map(p=>p.pilot&&p.pilot.length)))}</td></tr>
     <tr><td>Hardest situation</td><td style="text-align:left">${esc(tally(per.map(p=>p.pilot&&p.pilot.hardest)))}</td></tr>
     <tr><td>Used AI or help</td><td style="text-align:left">${esc(tally(per.map(p=>p.end&&p.end.aiHelp)))}</td></tr>
     <tr><td>AI vs their own plans</td><td style="text-align:left">${esc(tally(per.map(p=>p.end&&p.end.compare)))}</td></tr>
   </table></div>
   ${list("What they think the study is testing", per.map(p=>p.end&&p.end.guess))}
   ${list("Situations that seemed obvious", per.map(p=>p.pilot&&p.pilot.obvious))}
   ${list("Where the one-label rule bound", per.map(p=>p.pilot&&p.pilot.ruleBind))}
   ${list("Other comments", per.map(p=>p.pilot&&p.pilot.other))}

   <h2>Data</h2>
   <p><button class="ghost" id="csv">Download CSV, one row per person and case</button>
      <button class="ghost" id="json">Download raw JSON</button></p>
   ${importUI}
   <p class="small muted" style="margin-top:1.6rem"><a href="#" id="back">Back to the survey</a></p>`, true);

  wireDash(per);
}

function wireDash(per){
  const $ = id => document.getElementById(id);
  if($("csv")) $("csv").onclick = () => downloadFile("pilot-long.csv", toCSV(per), "text/csv");
  if($("json")) $("json").onclick = () => downloadFile("pilot-raw.json", JSON.stringify(per, null, 1), "application/json");
  if($("addr")) $("addr").onclick = () => {
    const txt = $("paste").value.trim(); const msg = $("addmsg");
    let rows = [];
    try{
      const one = JSON.parse(txt);
      rows = Array.isArray(one) ? one : [one];
    }catch(e){
      txt.split("\n").forEach(line => { try{ rows.push(JSON.parse(line)); }catch(_){} });
    }
    rows = rows.filter(r => r && r.pid && r.cases);
    if(!rows.length){ msg.textContent = "That does not look like a response."; return; }
    addImported(rows); msg.textContent = `Added ${rows.length}. Reloading…`;
    setTimeout(() => showDashboard(dashKeyFromHash()), 500);
  };
  if($("clr")) $("clr").onclick = () => { clearImported(); showDashboard(dashKeyFromHash()); };
  if($("back")) $("back").onclick = e => { e.preventDefault(); location.hash = ""; startSurvey(); };
}

function tally(list){
  const t = {}; list.filter(Boolean).forEach(x => t[x] = (t[x]||0)+1);
  return Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} (${v})`).join(", ") || "—";
}
function list(title, items){
  const xs = items.filter(x => x && String(x).trim());
  return xs.length ? `<h3>${esc(title)}</h3><ul class="small">${xs.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>` : "";
}
function toCSV(per){
  const head = ["pid","version","defer_mode","programme","experience","managed","ai_use","undergrad","cat",
    "case_id","case_name","position","ai_quality","first_score","final_score","ai_plan_score",
    "own","delegate","wait","hold","defer_set","hold_score","split_matched_key","split_worth_points",
    "unlisted_delegates","change","menu","conf_before","ended_at_ai","minutes","blocked_presses",
    "mda_all","mda_leave_one_out"];
  const lines = [head.join(",")];
  const r2 = x => Number.isFinite(x) ? Math.round(x*100)/100 : "";
  per.forEach(p => p.cases.forEach(c => {
    const loo = mean(p.cases.filter(x => x.id !== c.id).map(x => x.first));
    const row = [p.pid, p.version, p.mode, p.bg&&p.bg.programme, p.bg&&p.bg.experience, p.bg&&p.bg.managed,
      p.bg&&p.bg.aiUse, p.bg&&p.bg.undergrad, p.end&&p.end.cat != null ? p.end.cat : "",
      c.id, c.name, c.pos, c.good ? "good" : "bad", r2(c.first), r2(c.final), r2(c.ai),
      r2(c.parts.own), r2(c.parts.del), r2(c.parts.wait), r2(c.parts.hold), r2(c.parts.set), r2(c.holdScore),
      c.splitOK === null ? "" : (c.splitOK ? 1 : 0), r2(c.swing), c.unlisted,
      r2(c.final - c.first), c.menu, c.conf1, c.endedAtAI ? 1 : 0, r2(c.min), c.errs, r2(p.mda), r2(loo)];
    lines.push(row.map(v => { const s = String(v == null ? "" : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }).join(","));
  }));
  return lines.join("\n");
}
