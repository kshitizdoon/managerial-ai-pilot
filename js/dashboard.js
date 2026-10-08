/* =============================================================
   dashboard.js — the results view, at  #researcher=YOUR_KEY
   ============================================================= */

async function showDashboard(key){
  setStep("Results", 100);
  paint(`<h1>Survey results</h1><p class="muted">Loading…</p>`, true);
  const live = await fetchResponses(key);
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
  renderDashboard(rows, live, sources);
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

/* one row per person: case scores, AI levels, and every decision */
function personRows(raw){
  const out = [];
  raw.filter(r => recordState(r) === "complete").forEach(r => {
    const cases = CASES.map(c => {
      const rec = r.cases[c.id];
      const level = (rec.ai && rec.ai.level) || (r.aiLevels || {})[c.id];
      /* the advice as shown, if it was kept with the answer */
      const aiActions = (rec.ai && rec.ai.actions) || (level ? aiPlan(c, level).actions : {});
      const first = scorePlan(c.id, rec.first), final = scorePlan(c.id, rec.final), ai = scorePlan(c.id, aiActions);
      const decisions = c.decisions.map(d => {
        const f = rec.first[d.k], g = rec.final[d.k], a = aiActions[d.k], pref = preferredAction(c.id, d.k);
        return {k: d.k, n: d.n, pos: (rec.decisionOrder || []).indexOf(d.k) + 1, pref, first: f, final: g, ai: a,
          firstScore: decisionScore(c.id, d.k, f), finalScore: decisionScore(c.id, d.k, g), aiScore: decisionScore(c.id, d.k, a),
          changed: f !== g, disagreed: f !== a, tookAI: f !== a && g === a,
          tA: rec.tA ? rec.tA[d.k] : null, tB: rec.tB ? rec.tB[d.k] : null,
          why: rec.ai && rec.ai.why ? rec.ai.why[d.k] : (level ? aiPlan(c, level).why[d.k] : "")};
      });
      return {id: c.id, name: c.name, pos: rec.pos, level, aiScore: ai.total,
        first: first.total, final: final.total, gain: final.total - first.total,
        firstMatches: first.matches, conf: rec.conf ?? null, reason: rec.reason || "",
        minA: (rec.msA || 0) / 60000, minB: (rec.msB || 0) / 60000, errs: (rec.errA || 0) + (rec.errB || 0),
        decisions};
    });
    out.push({pid: r.pid, condition: r.aiCondition, bg: r.bg, end: r.end, pilot: r.pilot,
      practiceCorrect: r.practice ? !!r.practice.correct : null,
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

const LEVEL_NAMES = {high: "High", moderate: "Moderate", low: "Low", very_low: "Very low"};

function renderDashboard(raw, live, sources){
  const per = personRows(raw);
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
   <p class="small muted">${earlier.length} record${earlier.length > 1 ? "s were" : " was"} saved by an earlier version (fixed action quotas, named delegates, different caselets). ${earlier.length > 1 ? "They are" : "It is"} kept, and in the raw JSON download, but not scored here: the manual says not to pool the two versions without a bridging analysis.</p>
   <div class="scroll"><table class="data" id="earlier">
     <tr><th>PID</th><th>Finished</th><th>Last checkpoint</th><th>Source</th></tr>
     ${earlier.map(r => `<tr><td>${esc(r.pid)}</td><td>${r.done ? "yes" : "no"}</td><td>${when(r)}</td><td>${esc((sources && sources[r.pid]) || "—")}</td></tr>`).join("")}
   </table></div>` : "";
  const versionRows = instrumentTable(raw.filter(r => recordState(r) !== "earlier_instrument"));
  const counts = `${N} completed response${N === 1 ? "" : "s"}; ${incomplete.length} unfinished; ${anomalous.length} marked finished but incomplete` +
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
      ${importUI}
      <p class="small muted"><a href="#" id="back">Back to the survey</a></p>`, true);
    return wireDash(per, raw, sources);
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

  /* what people did with the advice, by quality level */
  const levelStats = AI_LEVELS.map(l => {
    const cs = allCases.filter(x => x.level === l);
    const ds = [].concat(...cs.map(x => x.decisions));
    const dis = ds.filter(x => x.disagreed);
    const good = dis.filter(x => x.ai === x.pref), bad = dis.filter(x => x.ai !== x.pref);
    const rate = a => a.length ? 100 * a.filter(x => x.tookAI).length / a.length : NaN;
    return {l, n: cs.length, aiScore: mean(cs.map(x => x.aiScore)), first: mean(cs.map(x => x.first)),
      final: mean(cs.map(x => x.final)), gain: mean(cs.map(x => x.gain)),
      dis: dis.length, took: rate(dis), tookGood: rate(good), goodN: good.length, tookBad: rate(bad), badN: bad.length,
      conf: mean(cs.map(x => x.conf).filter(x => x != null))};
  });

  /* main-run arithmetic: better advice (high, moderate) minus worse (low, very low) */
  const better = l => l === "high" || l === "moderate";
  const gains = allCases.map(x => x.gain);
  const sigmaG = sd(gains);
  const dI = per.map(p => {
    const g = p.cases.filter(c => better(c.level)).map(c => c.gain);
    const b = p.cases.filter(c => !better(c.level)).map(c => c.gain);
    return (g.length ? mean(g) : 0) - (b.length ? mean(b) : 0);
  });
  const sdD = sd(dI) || 1e-6;
  const abilityGain = corr(per.map(p => p.mda), dI);
  const aiGainCorr = corr(allCases.map(x => x.aiScore), allCases.map(x => x.gain));
  const practiceRate = (() => { const v = per.map(p => p.practiceCorrect).filter(x => x !== null);
    return v.length ? 100 * v.filter(Boolean).length / v.length : NaN; })();

  const flags = [];
  if(N >= 4){
    if(!(alpha > 0.4)) flags.push(`Cronbach's alpha over the six case scores is ${fmt(alpha,2)}. The caselets are not yet measuring one thing; look at the decisions with low item-rest correlations first.`);
    if(med(times) > 25) flags.push(`Median run time is ${fmt(med(times))} minutes. Expect drop-out in the main run unless caselets are cut or shortened.`);
    if(Number.isFinite(practiceRate) && practiceRate < 70) flags.push(`Only ${pct(practiceRate)} got the Wait/Hold practice question right. The distinction is not landing; look at the instructions before the main run.`);
    const hiTook = levelStats[0].took, loTook = levelStats[3].took;
    if(Number.isFinite(hiTook) && Number.isFinite(loTook) && Math.abs(hiTook - loTook) < 5)
      flags.push(`People switch to the AI's action at almost the same rate for high and very low advice (${pct(hiTook)} against ${pct(loTook)}). Either the advice quality is not visible or it is read as authority.`);
    decStats.forEach(s => {
      if(s.hit > 90) flags.push(`${s.c.name} / ${s.d.n}: ${pct(s.hit)} chose the preferred action first time. It adds little to the ability measure.`);
      if(s.itemRest < 0) flags.push(`${s.c.name} / ${s.d.n}: item-rest correlation ${fmt(s.itemRest,2)}. Those who score well on it score worse on the rest of the caselet; check its key.`);
    });
  }

  const act = a => `<span class="small" style="font-weight:600">${esc(actionLabel(a))}</span>`;
  paint(`
   <h1>Survey results</h1>
   <p class="muted" id="counts">${counts}${live && !live.ok ? " (imported; no live database on this host)" : ""}. AI conditions among completed: ${esc(tally(per.map(p => "condition " + p.condition)))}.</p>
   ${statusBlocks}

   <div class="kpi">
     <div><b>${N}</b><span>completed</span></div>
     <div><b>${fmt(med(times))}</b><span>median minutes</span></div>
     <div><b>${fmt(mean(per.map(p=>p.mda)))}</b><span>mean ability score (0-100)</span></div>
     <div><b>${fmt(sd(per.map(p=>p.mda)))}</b><span>SD between people</span></div>
     <div><b>${fmt(alpha,2)}</b><span>alpha, 6 caselets</span></div>
     <div><b>${pct(practiceRate)}</b><span>practice right</span></div>
   </div>

   <h2>Is the instrument measuring one thing?</h2>
   <div class="scroll"><table class="data" id="cases">
     <tr><th>Caselet</th><th>n</th><th>Mean first score</th><th>SD</th><th>Low</th><th>High</th><th>Item-total r</th><th>Median min</th><th>Unanswered presses</th></tr>
     ${caseStats.map(s=>`<tr><td>${esc(s.c.name)}</td><td>${s.n}</td><td>${fmt(s.mean)}</td><td>${fmt(s.sd)}</td>
       <td>${fmt(s.lo)}</td><td>${fmt(s.hi)}</td><td>${fmt(s.itemTotal,2)}</td><td>${fmt(s.minutes)}</td><td>${s.errs}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">Case score is the sum of five decision scores, 0 to 100, on the first answers. Alpha ${fmt(alpha,2)} implies a single-caselet reliability of ${fmt(r1,2)} and ${fmt(relLoo,2)} for the leave-one-caselet-out ability score.</p>

   <h2>Decisions</h2>
   <div class="scroll"><table class="data" id="decisions">
     <tr><th>Caselet / decision</th><th>Preferred</th><th>Own</th><th>Delegate</th><th>Wait</th><th>Hold</th><th>Mean score</th><th>SD</th><th>Item-rest r</th><th>Changed after AI</th></tr>
     ${decStats.map(s=>`<tr><td>${esc(s.c.name)} / ${esc(s.d.n)}</td><td>${act(s.pref)}</td>
       ${ACTION_KEYS.map(a => `<td${a === s.pref ? ' style="font-weight:700"' : ""}>${pct(s.share[a])}</td>`).join("")}
       <td>${fmt(s.mean)}</td><td>${fmt(s.sd)}</td><td>${fmt(s.itemRest,2)}</td><td>${pct(s.changed)}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">Shares are of first answers; the preferred action's share is bold. Item-rest r correlates the decision's score with the other four decisions in its caselet.</p>

   <h2>What people did with the AI advice</h2>
   <div class="scroll"><table class="data" id="levels">
     <tr><th>Advice quality</th><th>Caselets</th><th>Advice score</th><th>First score</th><th>Final score</th><th>Mean change</th><th>Switched to AI</th><th>…when AI was right</th><th>…when AI was wrong</th><th>Confidence</th></tr>
     ${levelStats.map(s=>`<tr><td>${LEVEL_NAMES[s.l]}</td><td>${s.n}</td><td>${fmt(s.aiScore)}</td><td>${fmt(s.first)}</td><td>${fmt(s.final)}</td><td>${fmt(s.gain)}</td>
       <td>${pct(s.took)}</td><td>${pct(s.tookGood)} <span class="muted">(${s.goodN})</span></td><td>${pct(s.tookBad)} <span class="muted">(${s.badN})</span></td><td>${fmt(s.conf)}</td></tr>`).join("")}
   </table></div>
   <p class="small muted">Switched to AI counts decisions where the first answer differed from the AI and the final answer took the AI's action. "Right" means the AI gave the preferred action. Advice score correlates ${fmt(aiGainCorr,2)} with the change in case score. Ability correlates ${fmt(abilityGain,2)} with the better-minus-worse-advice change, which is your interaction, unadjusted.</p>

   <h2>What this means for the main run</h2>
   <div class="kpi">
     <div><b>${fmt(sigmaG)}</b><span>SD of change per caselet</span></div>
     <div><b>${fmt(sdD)}</b><span>SD of better minus worse advice</span></div>
     <div><b>${fmt(mean(dI))}</b><span>mean better minus worse advice</span></div>
   </div>
   <div class="scroll"><table class="data">
     <tr><th>Test</th><th>N=50</th><th>N=100</th><th>N=150</th><th>N=200</th></tr>
     <tr><td>Advice quality main effect, points</td>
       ${[50,100,150,200].map(n=>`<td>${fmt(Z_POWER*sdD/Math.sqrt(n))}</td>`).join("")}</tr>
     <tr><td>Ability × advice quality, points per SD of ability</td>
       ${[50,100,150,200].map(n=>`<td>${fmt(mdeInteraction(sdD,n,relLoo))}</td>`).join("")}</tr>
   </table></div>
   <p class="small muted">80% power, two-sided 5%, person fixed effects. Better advice is the high and moderate levels, worse is low and very low; every respondent sees both. To detect an interaction of 5 points per SD of ability you need about <b>${nNeeded(5,sdD,relLoo)}</b> people; 8 points, about <b>${nNeeded(8,sdD,relLoo)}</b>; 12 points, about <b>${nNeeded(12,sdD,relLoo)}</b>.</p>

   ${flags.length ? `<h2>Fix before the main run</h2>${flags.map(f=>`<p class="flag">${esc(f)}</p>`).join("")}`
     : `<h2>No automatic flags</h2><p class="small muted">${N<4?"Too few responses to flag anything yet.":"Nothing tripped a threshold. Read the comments below anyway."}</p>`}

   <h2>What people said</h2>
   <div class="scroll"><table class="data">
     <tr><td>Wait vs Hold clear</td><td style="text-align:left">${esc(tally(per.map(p=>p.pilot&&p.pilot.waitHold)))}</td></tr>
     <tr><td>Length</td><td style="text-align:left">${esc(tally(per.map(p=>p.pilot&&p.pilot.length)))}</td></tr>
     <tr><td>Hardest situation</td><td style="text-align:left">${esc(tally(per.map(p=>p.pilot&&p.pilot.hardest)))}</td></tr>
     <tr><td>Used AI or help</td><td style="text-align:left">${esc(tally(per.map(p=>p.end&&p.end.aiHelp)))}</td></tr>
     <tr><td>AI vs their own answers</td><td style="text-align:left">${esc(tally(per.map(p=>p.end&&p.end.compare)))}</td></tr>
   </table></div>
   ${list("What they think the study is testing", per.map(p=>p.end&&p.end.guess))}
   ${list("Decisions that seemed obvious", per.map(p=>p.pilot&&p.pilot.obvious))}
   ${list("Decisions hard to fit into the four actions", per.map(p=>p.pilot&&p.pilot.hardToFit))}
   ${list("Why they kept or changed answers", [].concat(...per.map(p=>p.cases.map(c=>c.reason ? `${c.name}: ${c.reason}` : ""))))}
   ${list("Other comments", per.map(p=>p.pilot&&p.pilot.other))}

   <h2>Data</h2>
   <p><button class="ghost" id="csv">Download CSV, one row per person and decision</button></p>
   <p class="small muted">The CSV is the analysis file: completed responses only, scored with the key deployed now.</p>
   ${rawButton}
   ${importUI}
   <p class="small muted" style="margin-top:1.6rem"><a href="#" id="back">Back to the survey</a></p>`, true);

  wireDash(per, raw, sources);
}

function wireDash(per, raw, sources){
  const $ = id => document.getElementById(id);
  if($("csv")) $("csv").onclick = () => downloadFile("survey-decisions.csv", toCSV(per), "text/csv");
  if($("json")) $("json").onclick = () => downloadFile("survey-raw.json", JSON.stringify(rawExport(raw, sources), null, 1), "application/json");
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
   respondent, case, decision, first, final and AI action, AI condition
   and level, the exact AI text, response times, confidence, and the
   scoring-key version. */
const CSV_HEAD = ["pid","ai_condition","programme","experience","managed","ai_use","undergrad","cat","practice_correct",
  "case_id","case_name","case_position","decision_id","decision_name","decision_position","preferred_action",
  "first_action","final_action","ai_action","ai_level","first_score","final_score","ai_action_score",
  "changed","disagreed_with_ai","took_ai",
  "case_first_score","case_final_score","case_change","case_ai_score","confidence","reason",
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
      p.bg&&p.bg.aiUse, p.bg&&p.bg.undergrad, p.end&&p.end.cat != null ? p.end.cat : "",
      p.practiceCorrect == null ? "" : b(p.practiceCorrect),
      c.id, c.name, c.pos, d.k, d.n, d.pos, d.pref,
      d.first, d.final, d.ai, c.level, d.firstScore, d.finalScore, d.aiScore,
      b(d.changed), b(d.disagreed), b(d.tookAI),
      c.first, c.final, c.gain, c.aiScore, c.conf, c.reason,
      r2(c.minA), r2(c.minB), d.tA, d.tB,
      r2(p.mda), r2(loo), d.why,
      I ? I.instrumentVersion : "", I ? I.scoringVersion : "", I ? I.casesHash : "", I ? I.keyHash : "",
      now.casesHash, now.keyHash];
    lines.push(row.map(v => { const s = String(v == null ? "" : v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }).join(","));
  });
  return lines.join("\n");
}
