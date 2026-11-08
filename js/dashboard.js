/* =============================================================
   dashboard.js — the results view, at  #researcher=YOUR_KEY
   ============================================================= */

async function showDashboard(key){
  setStep("Results", 100);
  paint(`<h1>Survey results</h1><p class="muted">Loading…</p>`, true);
  const [live, ev] = await Promise.all([fetchResponses(key), fetchEvaluatorData(key)]);
  /* One record per PID. A finished copy beats an unfinished one, then the
     newer checkpoint wins. So a participant's emailed backup replaces the
     unfinished server record it completes. The device archive holds
     earlier sessions on this browser; this browser's own record counts
     only if finished. */
  const mine = loadLocal();
  const lists = [["server", live.rows], ["imported", importedRows()], ["device_archive", archivedRows()],
                 ["this_device", mine && mine.done ? [mine] : []]];
  const from = new Map();
  lists.forEach(([name, list]) => list.forEach(r => { if(r && typeof r === "object") from.set(r, name); }));
  const rows = mergeRecords(...lists.map(l => l[1]));
  const sources = {};
  rows.forEach(r => { sources[r.pid] = from.get(r) || "unknown"; });
  renderDashboard(rows, live, sources, {ev});
}

/* complete            this instrument, finished, every decision answered
                       first and final
   anomalous           this instrument, marked finished, but something is
                       missing
   in_progress         this instrument, not finished yet (a checkpoint)
   earlier_instrument  saved by an earlier version of the survey (fixed
                       quotas, named delegates, other caselets). Not
                       comparable; never scored here.
   Only complete records enter the statistics. */
function recordState(r){
  if(!r || r.schemaVersion !== RECORD_SCHEMA) return "earlier_instrument";
  if(!r.done) return "in_progress";
  const all = CASES.every(c => {
    const x = r.cases && r.cases[c.id];
    return !!(x && x.first && x.final && c.decisions.every(d => x.first[d.k] && x.final[d.k]));
  });
  return all ? "complete" : "anomalous";
}

/* one row per person: case scores, the AI advice, and every decision */
function personRows(raw){
  const out = [];
  raw.filter(r => recordState(r) === "complete").forEach(r => {
    const cases = CASES.map(c => {
      const rec = r.cases[c.id];
      /* the advice as shown, kept with the answer. Right means the AI
         gave the key's preferred action, whatever design drew it. */
      const aiActions = (rec.ai && rec.ai.actions) || {};
      const first = scorePlan(c.id, rec.first), final = scorePlan(c.id, rec.final), ai = scorePlan(c.id, aiActions);
      const decisions = c.decisions.map(d => {
        const f = rec.first[d.k], g = rec.final[d.k], a = aiActions[d.k], pref = preferredAction(c.id, d.k);
        return {k: d.k, n: d.n, pos: (rec.decisionOrder || []).indexOf(d.k) + 1, pref, first: f, final: g, ai: a,
          firstScore: decisionScore(c.id, d.k, f), finalScore: decisionScore(c.id, d.k, g), aiScore: decisionScore(c.id, d.k, a),
          aiRight: a === pref, gain: decisionScore(c.id, d.k, g) - decisionScore(c.id, d.k, f),
          changed: f !== g, disagreed: f !== a, tookAI: f !== a && g === a,
          tA: rec.tA ? rec.tA[d.k] : null, tB: rec.tB ? rec.tB[d.k] : null,
          why: rec.ai && rec.ai.why ? rec.ai.why[d.k] : ""};
      });
      return {id: c.id, name: c.name, pos: rec.pos, level: (rec.ai && rec.ai.level) || null,
        aiRight: ai.matches, aiScore: ai.total,
        first: first.total, final: final.total, gain: final.total - first.total,
        firstMatches: first.matches, conf: rec.conf ?? null, reason: rec.reason || "",
        minA: (rec.msA || 0) / 60000, minB: (rec.msB || 0) / 60000, errs: (rec.errA || 0) + (rec.errB || 0),
        decisions};
    });
    out.push({pid: r.pid, condition: r.aiCondition ?? "", bg: r.bg,
      instrument: r.instrument || null,
      totalMin: r.totalMin != null ? r.totalMin : (new Date(r.finished) - new Date(r.started)) / 60000,
      cases, mda: mean(cases.map(x => x.first))});
  });
  return out;
}

/* one row per person and decision: the analysis file */
function decisionRows(per){
  const rows = [];
  per.forEach(p => p.cases.forEach(c => {
    const loo = mean(p.cases.filter(x => x.id !== c.id).map(x => x.first));
    c.decisions.forEach(d => rows.push({p, c, d, loo}));
  }));
  return rows;
}

function renderDashboard(raw, live, sources, opts){
  opts = opts || {};
  const allPer = personRows(raw);
  const per = allPer;
  const N = per.length;
  const byState = s => raw.filter(r => r && r.pid && recordState(r) === s);
  const incomplete = byState("in_progress"), anomalous = byState("anomalous"), earlier = byState("earlier_instrument");
  const when = r => esc(r.receivedAt || r.clientSavedAt || "—");
  const incompleteRows = incomplete.length ? `
   <h2>Unfinished responses</h2>
   <p class="small muted">People who are still going or who dropped out. These are saved checkpoints, not completed responses, and are left out of all statistics below.</p>
   <div class="scroll"><table class="data" id="unfinished">
     <tr><th>PID</th><th>Cases completed</th><th>First answers saved</th><th>Last checkpoint</th><th>Reason</th></tr>
     ${incomplete.map(r => `<tr><td>${esc(r.pid)}</td><td>${completedCaseCount(r)}/${CASES.length}</td><td>${firstPlanCount(r)}/${CASES.length}</td><td>${when(r)}</td><td>${esc(r.saveReason || "—")}</td></tr>`).join("")}
   </table></div>` : "";
  const anomalousRows = anomalous.length ? `
   <h2>Marked finished, but incomplete</h2>
   <p class="small muted">These records say they are finished, yet at least one decision has no first or final answer. That should not happen, so check them by hand. They are left out of all statistics below, and they are in the raw JSON download.</p>
   <div class="scroll"><table class="data" id="anomalous">
     <tr><th>PID</th><th>Cases completed</th><th>First answers saved</th><th>Status</th><th>Last checkpoint</th><th>Reason</th><th>Source</th></tr>
     ${anomalous.map(r => `<tr><td>${esc(r.pid)}</td><td>${completedCaseCount(r)}/${CASES.length}</td><td>${firstPlanCount(r)}/${CASES.length}</td><td>${esc(r.status || "done, no status")}</td><td>${when(r)}</td><td>${esc(r.saveReason || "—")}</td><td>${esc((sources && sources[r.pid]) || "—")}</td></tr>`).join("")}
   </table></div>` : "";
  const earlierRows = earlier.length ? `
   <h2>Responses from an earlier version of the survey</h2>
   <p class="small muted">${earlier.length} record${earlier.length > 1 ? "s were" : " was"} saved by an earlier version of the survey (other caselets or decisions, or fixed action quotas and named delegates). ${earlier.length > 1 ? "They are" : "It is"} kept, and in the raw JSON download, but not scored here: the manual says not to pool the two versions without a bridging analysis.</p>
   <div class="scroll"><table class="data" id="earlier">
     <tr><th>PID</th><th>Finished</th><th>Last checkpoint</th><th>Source</th></tr>
     ${earlier.map(r => `<tr><td>${esc(r.pid)}</td><td>${r.done ? "yes" : "no"}</td><td>${when(r)}</td><td>${esc((sources && sources[r.pid]) || "—")}</td></tr>`).join("")}
   </table></div>` : "";
  const versionRows = instrumentTable(raw.filter(r => recordState(r) !== "earlier_instrument"));
  const counts = `${allPer.length} completed response${allPer.length === 1 ? "" : "s"}; ${incomplete.length} unfinished; ${anomalous.length} marked finished but incomplete` +
    (earlier.length ? `; ${earlier.length} from an earlier version` : "");
  const rawButton = raw.length
    ? `<p><button class="ghost" id="json">Download raw JSON, every record as saved (${raw.length})</button></p>
       <p class="small muted">The raw file holds every record, finished or not, exactly as saved, including any names and mobile numbers participants gave.</p>` : "";
  const importUI = `
   <h3>Add responses</h3>
   <div class="card">
     <p class="small muted" style="margin:0 0 .5rem">Paste the block of text a participant sent you, or the JSON file they downloaded. One or several, one per line or as a JSON array.</p>
     <textarea id="paste"></textarea>
     <p style="margin:.5rem 0 0"><button class="ghost" id="addr">Add</button>
     <button class="ghost" id="clr">Clear added responses</button>
     <span class="small muted" id="addmsg"></span></p>
   </div>`;
  const statusBlocks = `${incompleteRows}${anomalousRows}${earlierRows}${versionRows}`;

  if(!N){
    paint(`<h1>Survey results</h1>
      <p>No completed responses yet${live && !live.ok ? ` — and the live data could not be loaded (${esc(live.why)}). Check the key in this link and DASHBOARD_KEY in Netlify.` : "."}</p>
      ${raw.length ? `<p class="muted" id="counts">${counts}.</p>` : ""}
      ${statusBlocks}
      ${rawButton}
      ${evaluatorSection(opts.ev)}
      ${importUI}
      <p class="small muted"><a href="#" id="back">Back to the survey</a></p>`, true);
    return wireDash(allPer, raw, sources, live, opts);
  }

  const J = CASES.length;
  const scores = per.map(p => p.cases.map(c => c.first));
  const alpha = alphaOf(scores);
  const r1 = singleItemRel(alpha, J);
  const relLoo = spearmanBrown(r1, J - 1);
  const times = per.map(p => p.totalMin);
  const rows = decisionRows(per);
  const allCases = [].concat(...per.map(p => p.cases));

  /* per caselet */
  const caseStats = CASES.map(c => {
    const s = allCases.filter(x => x.id === c.id);
    const first = s.map(x => x.first);
    const others = per.map(p => mean(p.cases.filter(x => x.id !== c.id).map(x => x.first)));
    return {c, n: s.length, mean: mean(first), sd: sd(first), lo: Math.min(...first), hi: Math.max(...first),
      itemTotal: corr(first, others), minutes: med(s.map(x => x.minA + x.minB)), errs: s.reduce((a, x) => a + x.errs, 0)};
  });

  /* per decision: response frequencies, score spread, item-rest r */
  const decStats = [].concat(...CASES.map(c => c.decisions.map(d => {
    const s = rows.filter(r => r.c.id === c.id && r.d.k === d.k).map(r => r.d);
    const share = a => 100 * s.filter(x => x.first === a).length / s.length;
    const sc = s.map(x => x.firstScore);
    const rest = per.map(p => { const cs = p.cases.find(x => x.id === c.id);
      return cs.first - cs.decisions.find(x => x.k === d.k).firstScore; });
    return {c, d, pref: preferredAction(c.id, d.k), share: Object.fromEntries(ACTION_KEYS.map(a => [a, share(a)])),
      hit: share(preferredAction(c.id, d.k)), mean: mean(sc), sd: sd(sc), itemRest: corr(sc, rest),
      changed: 100 * s.filter(x => x.changed).length / s.length};
  })));

  /* what people did with the advice: decisions where it was right against
     decisions where it was wrong. Scores are per decision, 0 to 20. */
  const allDecs = [].concat(...allCases.map(x => x.decisions));
  const adviceStats = [true, false].map(right => {
    const ds = allDecs.filter(x => x.aiRight === right);
    const dis = ds.filter(x => x.disagreed);
    return {right, n: ds.length, first: mean(ds.map(x => x.firstScore)), final: mean(ds.map(x => x.finalScore)),
      gain: mean(ds.map(x => x.gain)), dis: dis.length,
      took: dis.length ? 100 * dis.filter(x => x.tookAI).length / dis.length : NaN};
  });

  /* main-run arithmetic: for each person, the mean change on decisions
     with right advice minus the mean change on decisions with wrong
     advice, in caselet points (one decision point = 5 caselet points,
     since a caselet's four decisions sum to 80 and are scaled to 100) */
  const PTS = 100 / (DECISION_MAX * CASES[0].decisions.length);
  const decGain = d => d.gain * PTS;
  const sigmaG = sd(allDecs.map(decGain));
  const dI = per.map(p => {
    const ds = [].concat(...p.cases.map(c => c.decisions));
    const g = ds.filter(d => d.aiRight).map(decGain), b = ds.filter(d => !d.aiRight).map(decGain);
    return (g.length ? mean(g) : 0) - (b.length ? mean(b) : 0);
  });
  const sdD = sd(dI) || 1e-6;
  const abilityGain = corr(per.map(p => p.mda), dI);
  const rightShare = allDecs.length ? 100 * allDecs.filter(x => x.aiRight).length / allDecs.length : NaN;

  const flags = [];
  if(N >= 4){
    if(!(alpha > 0.4)) flags.push(`Cronbach's alpha over the ${J} case scores is ${fmt(alpha,2)}. The caselets are not yet measuring one thing; look at the decisions with low item-rest correlations first.`);
    if(med(times) > 25) flags.push(`Median run time is ${fmt(med(times))} minutes. Expect drop-out in the main run unless caselets are cut or shortened.`);
    const rTook = adviceStats[0].took, wTook = adviceStats[1].took;
    if(Number.isFinite(rTook) && Number.isFinite(wTook) && Math.abs(rTook - wTook) < 5)
      flags.push(`People switch to the AI's action at almost the same rate when it is right and when it is wrong (${pct(rTook)} against ${pct(wTook)}). Either the advice quality is not visible or it is read as authority.`);
    decStats.forEach(s => {
      if(s.hit > 90) flags.push(`${s.c.name} / ${s.d.n}: ${pct(s.hit)} chose the preferred action first time. It adds little to the ability measure.`);
      if(s.itemRest < 0) flags.push(`${s.c.name} / ${s.d.n}: item-rest correlation ${fmt(s.itemRest,2)}. Those who score well on it score worse on the rest of the caselet; check its key.`);
    });
  }

  const act = a => `<span class="small" style="font-weight:600">${esc(actionLabel(a))}</span>`;
  paint(`
   <h1>Survey results</h1>
   <p class="muted" id="counts">${counts}${live && !live.ok ? " (imported; no live database on this host)" : ""}. The AI advice was right on ${pct(rightShare)} of their decisions.</p>
   ${statusBlocks}

   <div class="kpi">
     <div><b>${N}</b><span>completed</span></div>
     <div><b>${fmt(med(times))}</b><span>median minutes</span></div>
     <div><b>${fmt(mean(per.map(p=>p.mda)))}</b><span>mean ability score (0-100)</span></div>
     <div><b>${fmt(sd(per.map(p=>p.mda)))}</b><span>SD between people</span></div>
     <div><b>${fmt(alpha,2)}</b><span>alpha, ${J} caselets</span></div>
   </div>

   <h2>Is the instrument measuring one thing?</h2>
   <div class="scroll"><table class="data" id="cases">
     <tr><th>Caselet</th><th>n</th><th>Mean first score</th><th>SD</th><th>Low</th><th>High</th><th>Item-total r</th><th>Median min</th><th>Unanswered presses</th></tr>
     ${caseStats.map(s=>`<tr><td>${esc(s.c.name)}</td><td>${s.n}</td><td>${fmt(s.mean)}</td><td>${fmt(s.sd)}</td>
       <td>${fmt(s.lo)}</td><td>${fmt(s.hi)}</td><td>${fmt(s.itemTotal,2)}</td><td>${fmt(s.minutes)}</td><td>${s.errs}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">Case score is the sum of the ${CASES[0].decisions.length} decision scores, rescaled to 0 to 100, on the first answers. Alpha ${fmt(alpha,2)} implies a single-caselet reliability of ${fmt(r1,2)} and ${fmt(relLoo,2)} for the leave-one-caselet-out ability score.</p>

   <h2>Decisions</h2>
   <div class="scroll"><table class="data" id="decisions">
     <tr><th>Caselet / decision</th><th>Preferred</th><th>Own</th><th>Delegate</th><th>Wait</th><th>Hold</th><th>Mean score</th><th>SD</th><th>Item-rest r</th><th>Changed after AI</th></tr>
     ${decStats.map(s=>`<tr><td>${esc(s.c.name)} / ${esc(s.d.n)}</td><td>${act(s.pref)}</td>
       ${ACTION_KEYS.map(a => `<td${a === s.pref ? ' style="font-weight:700"' : ""}>${pct(s.share[a])}</td>`).join("")}
       <td>${fmt(s.mean)}</td><td>${fmt(s.sd)}</td><td>${fmt(s.itemRest,2)}</td><td>${pct(s.changed)}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">Shares are of first answers; the preferred action's share is bold. Item-rest r correlates the decision's score with the other decisions in its caselet.</p>

   <h2>What people did with the AI advice</h2>
   <div class="scroll"><table class="data" id="levels">
     <tr><th>AI advice</th><th>Decisions</th><th>First score</th><th>Final score</th><th>Mean change</th><th>First answer differed from AI</th><th>Switched to AI</th></tr>
     ${adviceStats.map(s=>`<tr><td>${s.right ? "Right" : "Wrong"}</td><td>${s.n}</td><td>${fmt(s.first)}</td><td>${fmt(s.final)}</td><td>${fmt(s.gain)}</td>
       <td>${s.dis}</td><td>${pct(s.took)}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">One row per decision answered. Scores are per decision, 0 to 20. "Right" means the AI gave the preferred action. Switched to AI counts decisions where the first answer differed from the AI and the final answer took the AI's action. Ability correlates ${fmt(abilityGain,2)} with the right-minus-wrong-advice change, which is your interaction, unadjusted.</p>

   <h2>What this means for the main run</h2>
   <div class="kpi">
     <div><b>${fmt(sigmaG)}</b><span>SD of change per decision, caselet points</span></div>
     <div><b>${fmt(sdD)}</b><span>SD of right minus wrong advice</span></div>
     <div><b>${fmt(mean(dI))}</b><span>mean right minus wrong advice</span></div>
   </div>
   <div class="scroll"><table class="data">
     <tr><th>Test</th><th>N=50</th><th>N=100</th><th>N=150</th><th>N=200</th></tr>
     <tr><td>Advice quality main effect, points</td>
       ${[50,100,150,200].map(n=>`<td>${fmt(Z_POWER*sdD/Math.sqrt(n))}</td>`).join("")}</tr>
     <tr><td>Ability × advice quality, points per SD of ability</td>
       ${[50,100,150,200].map(n=>`<td>${fmt(mdeInteraction(sdD,n,relLoo))}</td>`).join("")}</tr>
   </table></div>
   <p class="small muted">80% power, two-sided 5%, person fixed effects. Points are caselet points (0 to 100); one decision point is ${fmt(PTS,0)} caselet points. Every respondent gets right advice on half of their decisions and wrong advice on the other half. To detect an interaction of 5 points per SD of ability you need about <b>${nNeeded(5,sdD,relLoo)}</b> people; 8 points, about <b>${nNeeded(8,sdD,relLoo)}</b>; 12 points, about <b>${nNeeded(12,sdD,relLoo)}</b>.</p>

   ${flags.length ? `<h2>Fix before the main run</h2>${flags.map(f=>`<p class="flag">${esc(f)}</p>`).join("")}`
     : `<h2>No automatic flags</h2><p class="small muted">${N<4?"Too few responses to flag anything yet.":"Nothing tripped a threshold. Read the comments below anyway."}</p>`}

   ${list("Why people kept or changed their answers", [].concat(...per.map(p=>p.cases.map(c=>c.reason ? `${c.name}: ${c.reason}` : ""))))}

   <h2>Data</h2>
   <p><button class="ghost" id="csv">Download CSV, one row per person and decision</button></p>
   <p class="small muted">The CSV is the analysis file: every completed response, scored with the key deployed now.</p>
   ${rawButton}
   ${evaluatorSection(opts.ev)}
   ${importUI}
   <p class="small muted" style="margin-top:1.6rem"><a href="#" id="back">Back to the survey</a></p>`, true);

  wireDash(allPer, raw, sources, live, opts);
}

function wireDash(per, raw, sources, live, opts){
  const $ = id => document.getElementById(id);
  if($("csv")) $("csv").onclick = () => downloadFile("survey-decisions.csv", toCSV(per), "text/csv");
  if($("json")) $("json").onclick = () => downloadFile("survey-raw.json", JSON.stringify(rawExport(raw, sources), null, 1), "application/json");
  const ev = (opts || {}).ev;
  if($("evcsv")) $("evcsv").onclick = () => downloadFile("evaluator-ratings.csv", toEvaluatorCSV(evaluatorRows(ev)), "text/csv");
  if($("evjson")) $("evjson").onclick = () => downloadFile("evaluator-raw.json", JSON.stringify(evaluatorRawExport(ev), null, 1), "application/json");
  if($("addr")) $("addr").onclick = () => {
    const txt = $("paste").value.trim(); const msg = $("addmsg");
    let rows = [];
    try{
      const one = JSON.parse(txt);
      /* a raw JSON download from this page goes back in as it came out */
      rows = Array.isArray(one) ? one : (one && Array.isArray(one.responses)) ? one.responses : [one];
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

/* Which instrument version each record was collected under. The page
   scores every record with the cases and key deployed now; this table
   says so, and names the records for which that is a re-scoring. */
function instrumentTable(raw){
  const recs = raw.filter(r => r && r.pid);
  if(!recs.length) return "";
  const now = instrumentMeta();
  const groups = new Map();
  recs.forEach(r => {
    const m = r.instrument || null;
    const k = m ? stableJSON([m.instrumentVersion, m.scoringVersion, m.casesHash, m.keyHash, m.scoringConfig]) : "none";
    const g = groups.get(k) || {m, complete:0, in_progress:0, anomalous:0, earlier_instrument:0};
    g[recordState(r)]++;
    groups.set(k, g);
  });
  const match = m => { const s = sameInstrument(m);
    return s === true ? "yes" : s === false ? "no, re-scored with the current key" : "not recorded (saved before versions were stamped)"; };
  const done = recs.filter(r => recordState(r) === "complete");
  const other = done.filter(r => sameInstrument(r.instrument) === false).length;
  const unknown = done.filter(r => sameInstrument(r.instrument) === null).length;
  return `
   <h2>Instrument versions</h2>
   <div class="scroll"><table class="data" id="versions">
     <tr><th>Version</th><th>Cases</th><th>Key</th><th>Scoring</th><th>Completed</th><th>Unfinished</th><th>Finished but incomplete</th><th>Same as deployed now</th></tr>
     ${[...groups.values()].map(g => `<tr><td>${esc(g.m ? g.m.instrumentVersion || "unnamed" : "—")}</td>
       <td>${esc(g.m ? g.m.casesHash : "—")}</td><td>${esc(g.m ? g.m.keyHash : "—")}</td><td>${esc(g.m ? "v" + g.m.scoringVersion : "—")}</td>
       <td>${g.complete}</td><td>${g.in_progress}</td><td>${g.anomalous}</td><td>${esc(match(g.m))}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">Scores on this page use what is deployed now: ${esc(now.instrumentVersion || "unnamed")}, cases ${esc(now.casesHash)}, key ${esc(now.keyHash)}, scoring v${now.scoringVersion}. Saved answers are never changed; a record from another version is re-scored here, not re-answered.</p>
   ${other ? `<p class="flag">${other} completed response${other > 1 ? "s were" : " was"} collected under a different version of the cases, key or scoring, and ${other > 1 ? "are" : "is"} scored here with the current one.</p>` : ""}
   ${unknown ? `<p class="flag">${unknown} completed response${unknown > 1 ? "s were" : " was"} saved without an instrument version, so the version ${unknown > 1 ? "they were" : "it was"} collected under is not on the record. ${unknown > 1 ? "They are" : "It is"} scored here with the current key.</p>` : ""}`;
}

/* The raw download: every record, finished or not, exactly as saved.
   The analysis rows are in the CSV instead. */
function rawExport(raw, sources){
  const records = raw.filter(r => r && r.pid);
  const counts = {total: records.length, complete: 0, in_progress: 0, anomalous: 0, earlier_instrument: 0};
  const index = records.map(r => {
    const state = recordState(r);
    counts[state]++;
    return {pid: r.pid, state, source: (sources && sources[r.pid]) || "unknown",
            casesCompleted: completedCaseCount(r), firstPlans: firstPlanCount(r),
            saveSeq: r.saveSeq != null ? r.saveSeq : null,
            instrumentVersion: r.instrument ? r.instrument.instrumentVersion : null};
  });
  return {
    format: "inbasket-raw-records", formatVersion: 1,
    exportedAt: new Date().toISOString(),
    note: "responses holds one record per PID exactly as saved, including unfinished ones, records from earlier versions of the survey, and any contact details. index says which were complete, in progress, marked finished but incomplete, or from an earlier version, and where each came from. The dashboard's scores use scoredWith.",
    scoredWith: instrumentMeta(),
    counts, index,
    responses: JSON.parse(JSON.stringify(records))
  };
}

function tally(list){
  const t = {}; list.filter(x => x != null && x !== "").forEach(x => t[x] = (t[x]||0)+1);
  return Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} (${v})`).join(", ") || "—";
}
function list(title, items){
  const xs = items.filter(x => x && String(x).trim());
  return xs.length ? `<h3>${esc(title)}</h3><ul class="small">${xs.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>` : "";
}

/* One row per person and decision. The columns the manual asks for:
   respondent, case, decision, first, final and AI action, whether the
   AI was right, the exact AI text, response times, confidence, and the
   scoring-key version. ai_condition and ai_level are filled only for
   responses from the earlier design with four advice levels. */
const CSV_HEAD = ["pid","ai_condition","programme","experience","managed","ai_use","undergrad",
  "case_id","case_name","case_position","decision_id","decision_name","decision_position","preferred_action",
  "first_action","final_action","ai_action","ai_right","ai_level","first_score","final_score","ai_action_score",
  "changed","disagreed_with_ai","took_ai",
  "case_first_score","case_final_score","case_change","case_ai_score","case_ai_right","confidence","reason",
  "case_minutes_first","case_minutes_final","decision_ms_first","decision_ms_final",
  "mda_all","mda_leave_one_out","ai_text",
  "instrument_version","scoring_version","recorded_cases_hash","recorded_key_hash",
  "scored_with_cases_hash","scored_with_key_hash"];
function toCSV(per){
  const now = instrumentMeta();
  const lines = [CSV_HEAD.join(",")];
  const r2 = x => Number.isFinite(x) ? Math.round(x*100)/100 : "";
  const b = x => x ? 1 : 0;
  decisionRows(per).forEach(({p, c, d, loo}) => {
    const I = p.instrument;
    const row = [p.pid, p.condition, p.bg&&p.bg.programme, p.bg&&p.bg.experience, p.bg&&p.bg.managed,
      p.bg&&p.bg.aiUse, p.bg&&p.bg.undergrad,
      c.id, c.name, c.pos, d.k, d.n, d.pos, d.pref,
      d.first, d.final, d.ai, b(d.aiRight), c.level || "", d.firstScore, d.finalScore, d.aiScore,
      b(d.changed), b(d.disagreed), b(d.tookAI),
      c.first, c.final, c.gain, c.aiScore, c.aiRight, c.conf, c.reason,
      r2(c.minA), r2(c.minB), d.tA, d.tB,
      r2(p.mda), r2(loo), d.why,
      I ? I.instrumentVersion : "", I ? I.scoringVersion : "", I ? I.casesHash : "", I ? I.keyHash : "",
      now.casesHash, now.keyHash];
    lines.push(row.map(v => { const s = String(v == null ? "" : v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }).join(","));
  });
  return lines.join("\n");
}

/* =============================================================
   Part 2: the Evaluator stage. Kept apart from the Producer results
   above: its own records, its own counts, its own downloads. Linked to
   Producer records only through the assignment's target PIDs.
   ============================================================= */

async function fetchEvaluatorData(key){
  try{
    const r = await fetch(CONFIG.evaluatorPath + "?key=" + encodeURIComponent(key || ""));
    const j = await r.json().catch(() => ({}));
    if(!r.ok) return {ok:false, why:"status " + r.status + (j.error ? " — " + j.error : "")};
    return {ok:true, settings:j.settings || {}, pool:j.pool || null, assignments:j.assignments || [], evaluations:j.evaluations || []};
  }catch(e){ return {ok:false, why:"no evaluator function on this host"}; }
}

/* same rule as the server (netlify/lib/eval-core.mjs): complete means
   finished, with a rating and a confidence for every assigned person */
function evaluationState(e, a){
  if(!e || !e.done) return "in_progress";
  if(!a || e.assignmentId !== a.id) return "anomalous";
  return a.slots.every(s => e.items && e.items[s.token] && e.items[s.token].rating != null && e.items[s.token].conf != null)
    ? "complete" : "anomalous";
}

/* one row per rating, complete evaluations only, joined to the target */
function evaluatorRows(ev){
  if(!ev || !ev.ok) return [];
  const byPid = new Map(ev.assignments.map(a => [a.evaluatorPid, a]));
  const rows = [];
  ev.evaluations.forEach(e => {
    const a = byPid.get(e.pid);
    if(evaluationState(e, a) !== "complete") return;
    const mine = a.slots.map(s => ({s, it: e.items[s.token]}));
    const rs = mine.map(x => x.it.rating), m = mean(rs), v = sd(rs);
    mine.forEach(({s, it}) => rows.push({
      evaluatorPid: e.pid, assignmentId: a.id, position: s.position, condition: s.condition, stratum: s.stratum,
      caseId: a.caseId, decisionIds: a.decisionIds, targetPid: s.target.pid, targetVersion: s.target.instrumentVersion,
      targetKeyHash: s.target.keyHash, targetScoringVersion: s.target.scoringVersion,
      aiLevel: s.target.aiLevel || "", aiRight: s.target.aiRight ?? "", aiCaseScore: s.target.aiCaseScore, mda: s.target.mda, mdaLoo: s.target.mdaLoo,
      caseFirstScore: s.target.caseFirstScore, rating: it.rating, ratingZ: v > 0 ? (it.rating - m) / v : 0,
      conf: it.conf, why: it.why || "", seconds: it.ms != null ? it.ms / 1000 : null, evaluatorMinutes: e.totalMin,
      display: s.display
    }));
  });
  return rows;
}

function evaluatorStats(rows){
  return ["A", "B", "C"].map(cond => {
    const r = rows.filter(x => x.condition === cond);
    const rating = r.map(x => x.rating), loo = r.map(x => x.mdaLoo);
    const hi = r.filter(x => x.stratum === "high").map(x => x.rating), lo = r.filter(x => x.stratum === "low").map(x => x.rating);
    return {cond, n: r.length, mean: mean(rating), sd: sd(rating),
      rLoo: corr(rating, loo), rFull: corr(rating, r.map(x => x.mda)), rZ: corr(r.map(x => x.ratingZ), loo),
      mae: mean(r.map(x => Math.abs(x.rating - x.mdaLoo))), bias: mean(r.map(x => x.rating - x.mdaLoo)),
      hiLo: hi.length && lo.length ? mean(hi) - mean(lo) : NaN,
      conf: mean(r.map(x => x.conf)), seconds: med(r.map(x => x.seconds).filter(x => x != null))};
  });
}

const COND_NAMES = {A: "A · AI advice + final", B: "B · AI advice + initial + final", C: "C · final only"};

function evaluatorSection(ev){
  if(!ev) return "";
  if(!ev.ok) return `<h2 id="evaluator">Part 2: Evaluator stage</h2><p class="small muted">Evaluator data could not be loaded (${esc(ev.why)}).</p>`;
  const byPid = new Map(ev.assignments.map(a => [a.evaluatorPid, a]));
  const states = ev.evaluations.map(e => ({e, a: byPid.get(e.pid), st: evaluationState(e, byPid.get(e.pid))}));
  const complete = states.filter(x => x.st === "complete"), unfinished = states.filter(x => x.st !== "complete");
  const assignedOnly = ev.assignments.filter(a => !ev.evaluations.some(e => e.pid === a.evaluatorPid));
  const rows = evaluatorRows(ev), stats = evaluatorStats(rows);
  const pool = ev.pool || {};
  const reasons = Object.entries(pool.excluded || {}).map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(", ") || "none";
  return `
   <h2 id="evaluator">Part 2: Evaluator stage</h2>
   <p class="muted" id="evcounts">${complete.length} completed evaluator${complete.length === 1 ? "" : "s"}; ${unfinished.length + assignedOnly.length} unfinished. Stage ${ev.settings.enabled ? "switched on" : "switched off"} (EVALUATOR_ENABLED).</p>
   <p class="small muted" id="evpool">${pool.mode === "fixed_profiles" ? "Researcher-controlled high/low profiles; each condition independently assigned 50/50." : `Eligible Producer records for evaluation: ${pool.eligible ?? "—"} of ${pool.total ?? "—"} (at least ${pool.minTargets ?? 3} needed). Excluded: ${esc(reasons)}.`}</p>
   ${unfinished.length || assignedOnly.length ? `<div class="scroll"><table class="data" id="evunfinished">
     <tr><th>PID</th><th>People rated</th><th>Status</th><th>Last checkpoint</th></tr>
     ${unfinished.map(({e, a, st}) => `<tr><td>${esc(e.pid)}</td><td>${Object.values(e.items || {}).filter(x => x.rating != null).length}/${a ? a.slots.length : 3}</td><td>${st === "anomalous" ? "marked finished, but incomplete" : "in progress"}</td><td>${esc(e.receivedAt || "—")}</td></tr>`).join("")}
     ${assignedOnly.map(a => `<tr><td>${esc(a.evaluatorPid)}</td><td>0/${a.slots.length}</td><td>assigned, nothing saved yet</td><td>${esc(a.createdAt)}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">Unfinished evaluations are left out of every number below.</p>` : ""}
   <div class="scroll"><table class="data" id="evconditions">
     <tr><th>Condition</th><th>Ratings</th><th>Mean rating</th><th>SD</th><th>r with target ability (leave-one-out)</th><th>r, full ability</th><th>r, within-evaluator z</th><th>Mean abs. error</th><th>Mean error</th><th>High minus low</th><th>Confidence</th><th>Median seconds</th></tr>
     ${stats.map(x => `<tr><td>${COND_NAMES[x.cond]}</td><td>${x.n}</td><td>${fmt(x.mean)}</td><td>${fmt(x.sd)}</td><td>${fmt(x.rLoo,2)}</td><td>${fmt(x.rFull,2)}</td><td>${fmt(x.rZ,2)}</td><td>${fmt(x.mae)}</td><td>${fmt(x.bias)}</td><td>${fmt(x.hiLo)}</td><td>${fmt(x.conf)}</td><td>${fmt(x.seconds,0)}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">For fixed profiles, ability is predetermined by the scoring key on the three displayed decisions. High-minus-low measures ability discrimination; rating error measures calibration to the fixed score. Median evaluator time: ${fmt(med(complete.map(x => x.e.totalMin).filter(Number.isFinite)))} minutes.</p>
   ${rows.length ? `<p><button class="ghost" id="evcsv">Download evaluator CSV, one row per rating</button></p>` : ""}
   ${ev.assignments.length || ev.evaluations.length ? `<p><button class="ghost" id="evjson">Download evaluator raw JSON (assignments and records)</button></p>
   <p class="small muted">Fixed profiles use synthetic target identifiers; no earlier Producer records are shown.</p>` : ""}`;
}

const EV_CSV_HEAD = ["evaluator_pid","assignment_id","position","condition","case_id","decision_ids","target_pid","target_ability_third",
  "target_mda","target_mda_leave_one_out","target_case_first_score","target_instrument_version","target_key_hash","target_scoring_version",
  "ai_level","ai_right_count","ai_case_score","rating","rating_z_within_evaluator","confidence","explanation","seconds","evaluator_total_minutes","shown"];
function toEvaluatorCSV(rows){
  const r2 = x => Number.isFinite(x) ? Math.round(x * 100) / 100 : "";
  const lines = [EV_CSV_HEAD.join(",")];
  rows.forEach(x => {
    const shown = x.display.decisions.map(d => d.k + ":" + (d.first ? d.first + ">" : "") + (d.ai ? "[ai " + d.ai.action + "]" : "") + d.final).join(" ");
    const row = [x.evaluatorPid, x.assignmentId, x.position, x.condition, x.caseId, x.decisionIds.join(" "), x.targetPid, x.stratum,
      r2(x.mda), r2(x.mdaLoo), x.caseFirstScore, x.targetVersion, x.targetKeyHash, x.targetScoringVersion,
      x.aiLevel, x.aiRight, x.aiCaseScore, x.rating, r2(x.ratingZ), x.conf, x.why, r2(x.seconds), x.evaluatorMinutes, shown];
    lines.push(row.map(v => { const t = String(v == null ? "" : v);
      return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }).join(","));
  });
  return lines.join("\n");
}
function evaluatorRawExport(ev){
  return {format: "inbasket-evaluator-raw", formatVersion: 1, exportedAt: new Date().toISOString(),
    settings: ev && ev.settings, pool: ev && ev.pool,
    assignments: JSON.parse(JSON.stringify((ev && ev.assignments) || [])),
    evaluations: JSON.parse(JSON.stringify((ev && ev.evaluations) || []))};
}
