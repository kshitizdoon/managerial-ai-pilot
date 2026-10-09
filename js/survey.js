/* =============================================================
   survey.js — the respondent's side.

   Flow: welcome and consent, About you, how it works, a Wait/Hold
   practice question, then for each of six caselets: five first answers,
   then the AI advice beside each decision with five final answers and
   an optional confidence and reason. Last questions, thank you.
   ============================================================= */

const app = () => document.getElementById("app");
const esc = s => String(s == null ? "" : s)
  .replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const uid = () => Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4);
/* shuffle and constrainedShuffle live in order.js */

let ST = null;              // the response being built
let pageStart = Date.now();
const since = () => { const d = Date.now()-pageStart; pageStart = Date.now(); return d; };

function setStep(text, pct){
  document.getElementById("step").textContent = text;
  document.getElementById("prog").style.width = pct + "%";
}
function paint(html, wide){
  const a = app();
  a.className = "wrap" + (wide ? "" : " narrow");
  a.innerHTML = html;
  window.scrollTo(0,0);
  pageStart = Date.now();
  const b = a.querySelector(".fade");
  if(b) requestAnimationFrame(()=> requestAnimationFrame(()=> b.classList.add("in")));
}

const actionLabel = a => (ACTIONS.find(x => x[0] === a) || [a, a])[1];

/* ------------------------------------------------------------------ start */
function startSurvey(){
  /* ?new=1 in the link forces a fresh response. Useful when several
     people take the survey on one device. The flag is removed from the
     address bar at once, so a reload does not wipe a response. */
  const url = new URLSearchParams(location.search);
  if(url.has("new")){
    url.delete("new");
    const q = url.toString();
    try{ history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash); }catch(e){}
    return startFresh();
  }
  const saved = loadLocal();
  if(saved && saved.done){
    ST = saved;
    /* a finished response whose last save failed: try again quietly */
    if(!ST.savedVia) retryFinalSave();
    return thanks();
  }
  /* An unfinished response from an earlier version of the survey cannot
     continue on these caselets. Keep it (server, device archive) and
     start this person afresh. */
  if(saved && saved.pid && saved.schemaVersion !== RECORD_SCHEMA) return startFresh();
  if(saved && saved.caseOrder){
    ST = saved;
    return resumePrompt();
  }
  welcome();
}

/* An unfinished response is on this device. It may be this person after
   a reload, or someone else on a shared device. Ask, never assume. */
function resumePrompt(){
  setStep("Welcome back", 0);
  const done = completedCaseCount(ST);
  paint(`
   <h1>${esc(CONFIG.studyTitle)}</h1>
   <div class="card">
     <p style="margin-top:0"><b>An unfinished response is saved on this device.</b></p>
     <p class="small muted" style="margin:0">It has ${done} of ${CASES.length} situations completed.</p>
   </div>
   <button class="go" id="cont">Continue my response</button>
   <p class="small muted" style="margin-top:1.4rem">Not yours? If someone else started it on this device,
     <a href="#" id="fresh">start a new response</a>. Their answers so far are already kept.</p>`);
  document.getElementById("cont").onclick = () => {
    if(ST.lastServerSaveOK === false) checkpointResponse(ST, "resume_retry");
    route();
  };
  document.getElementById("fresh").onclick = e => { e.preventDefault(); startFresh(); };
}

/* Start a clean response on this device. The previous record is sent to
   the server one more time and kept in the device archive, then cleared. */
function startFresh(){
  const old = loadLocal();
  if(old && old.pid){
    const needsSave = !old.done || !old.savedVia || old.lastServerSaveOK === false;
    const why = old.done ? "finish_retry_on_new_session"
              : old.schemaVersion !== RECORD_SCHEMA ? "left_unfinished_instrument_changed"
              : "left_unfinished_on_device";
    if(needsSave) checkpointResponse(old, why);
    archiveLocal();
  }
  clearLocal();
  ST = null;
  window.__contact = null;
  welcome();
}

/* retry the final save of a finished response; repaint when it lands */
let finalRetryRunning = false;
async function retryFinalSave(){
  if(!ST || !ST.done || ST.savedVia || finalRetryRunning) return;
  finalRetryRunning = true;
  const rec = ST;
  const how = await submitResponse(rec, "finish_retry");
  finalRetryRunning = false;
  if(how){
    rec.savedVia = how; saveLocalIfCurrent(rec);
    if(ST === rec) thanks();
  } else if(ST === rec){
    const m = document.getElementById("retrymsg");
    if(m) m.textContent = "Still could not reach the study database. Please use Copy or Download below.";
    const b = document.getElementById("retry");
    if(b){ b.disabled = false; b.textContent = "Try again"; }
  }
}

/* Name and mobile. Default is the end of the survey: if a respondent gives
   a name before answering, the answers stop being anonymous while they are
   being made, and a managerial-judgement task is exactly the kind people
   answer differently when it carries their name. Flip CONFIG.contactAt to
   "start" if you would rather have it first. */
function contactHTML(){
  const end = CONFIG.contactAt === "end";
  return `<div class="card">
    <h3 style="margin-top:0">${end ? "For the prize draw" : "Before you start"}</h3>
    <p class="small muted">${end
      ? "Optional. Every fifth respondent wins a prize. What you write here is saved together with your answers, not separately, so leave it blank if you would rather not enter."
      : "Used to run the prize draw and to reach you if a response does not save. It is stored with your answers, not separately."}</p>
    <label class="small" for="nm">Name</label>
    <input type="text" id="nm" autocomplete="name">
    <label class="small" for="mb" style="display:block;margin-top:.6rem">Mobile number</label>
    <input type="text" id="mb" inputmode="tel" autocomplete="tel">
  </div>`;
}
function readContact(){
  const nm = (document.getElementById("nm") || {}).value || "";
  const mb = (document.getElementById("mb") || {}).value || "";
  if(CONFIG.contactAt === "start" && (!nm.trim() || !mb.trim())){
    const e = document.getElementById("e");
    if(e) e.textContent = "Please give a name and a mobile number.";
    return false;
  }
  window.__contact = {name:nm.trim(), mobile:mb.trim()};
  return true;
}

function welcome(){
  setStep("Welcome", 0);
  paint(`
   <h1>${esc(CONFIG.studyTitle)}</h1>
   <p class="serif lead">You will be given six situations. Each situation has five decisions. For each decision you choose one of four actions: Own, Delegate, Wait or Hold.</p>
   <p class="serif">You decide which decisions to make yourself now, which to hand to someone on your team, and which to leave for later or until something you need is in place.</p>
   <p class="serif">After your answers are recorded, an AI advisor shows its recommendations for the same five decisions. You then give your final answers.</p>
   <div class="card small">
     <p>Please do it in one sitting, without breaks and without looking anything up.</p>
     <p>Your answers are used for a student research project at IIM Ahmedabad. You are not asked who you are while you work through the situations.</p>
     <p>At the end you can leave a name and mobile number to enter the prize draw. That is optional, and if you give it, it is saved with your answers rather than kept apart from them.</p>
     <p style="margin:0">There are no trick questions and no right answer you are expected to guess.</p>
   </div>
   ${CONFIG.contactAt === "start" ? contactHTML() : ""}
   <p class="err" id="e"></p>
   <button class="go" id="begin">Start</button>`);
  document.getElementById("begin").onclick = () => {
    if(CONFIG.contactAt === "start" && !readContact()) return;
    background();
  };
}

function background(){
  setStep("About you", 4);
  const q = (id,label,opts) => `<h3>${label}</h3><select id="${id}"><option value="">Choose one</option>${opts.map(o=>`<option>${o}</option>`).join("")}</select>`;
  paint(`
   <h2>About you</h2>
   <p class="muted small">Five quick questions.</p>
   <div class="card">
     ${q("q1","Programme",["PGP year 1","PGP year 2","PGPX","PhD or FPM","Other student","Working professional"])}
     ${q("q2","Full-time work experience",["None","Under 1 year","1 to 2 years","2 to 4 years","More than 4 years"])}
     ${q("q3","Have you managed or led other people at work?",["No","Yes, informally","Yes, formally"])}
     ${q("q4","How often do you use AI tools such as ChatGPT?",["Rarely or never","A few times a month","A few times a week","Daily"])}
     ${q("q5","Undergraduate background",["Engineering or science","Commerce or economics","Arts or humanities","Medicine","Other"])}
   </div>
   <p class="err" id="e"></p>
   <button class="go" id="next">Continue</button>`);
  document.getElementById("next").onclick = () => {
    const v = [1,2,3,4,5].map(i => document.getElementById("q"+i).value);
    if(v.some(x => !x)){ document.getElementById("e").textContent = "Please answer all five."; return; }
    const url = new URLSearchParams(location.search);
    const order = caseOrder();
    const forced = parseInt(url.get("ai"), 10);
    const condition = forced >= 0 && forced < CONFIG.aiConditions ? forced : Math.floor(Math.random() * CONFIG.aiConditions);
    ST = {
      pid: uid(),
      /* treatment: set once here. aiLevels[caseId] is the quality level
         of the advice that caselet shows this respondent. */
      aiCondition: condition,
      aiLevels: aiAssignment(condition),
      started: new Date().toISOString(),
      bg: {programme:v[0], experience:v[1], managed:v[2], aiUse:v[3], undergrad:v[4]},
      /* caseOrder holds case ids and is what the survey follows. order
         (positions in CASES) is kept for readers of older records. */
      caseOrder: order.map(i => CASES[i].id),
      order,
      at: 0, cases: {}, msBg: since(), done: false,
      contact: window.__contact || null,
      /* set once here, never changed: which cases, key and scoring this
         response was collected under */
      schemaVersion: RECORD_SCHEMA,
      instrument: instrumentMeta()
    };
    saveLocal(ST);
    checkpointResponse(ST, "background_complete");
    route();
  };
}

/* the four actions with their full definitions */
function definitionsHTML(){
  return `<dl class="defs">${ACTIONS.map(([k,n,,def]) =>
    `<div data-a="${k}"><dt>${n}</dt><dd>${esc(def)}</dd></div>`).join("")}</dl>`;
}

function howItWorks(){
  setStep("How it works", 7);
  paint(`
   <h2>How it works</h2>
   <div class="card serif">
     <p style="margin-top:0">${esc(INSTRUCTIONS)}</p>
     ${definitionsHTML()}
   </div>
   <p class="small muted">Your first answers in each situation are saved before you see the AI advisor, and cannot be changed afterwards. You can still choose different final answers.</p>
   <button class="go" id="next">I am ready</button>`);
  document.getElementById("next").onclick = () => { ST.msIntro = since(); saveLocal(ST); route(); };
}

/* ------------------------------------------------------------- practice */
/* One practice screen on Wait versus Hold. Not scored; the answers and
   whether they matched are kept, as a comprehension check. */
function practice(){
  setStep("Practice", 9);
  const n = PRACTICE.items.length;
  paint(`
   <h2>Practice</h2>
   <p class="muted">One practice question before the first situation. It is not scored.</p>
   <div class="decisions">${PRACTICE.items.map((d, i) =>
     decisionCard(d, `Practice ${i+1} of ${n}`, "p")).join("")}</div>
   <div id="fb" class="card hide"><p style="margin:0" class="serif">${esc(PRACTICE.feedback)}</p></div>
   <p class="err" id="e"></p>
   <button class="go" id="next">Check my answers</button>`);
  const t = wireDecisions("p");
  let checked = false;
  document.getElementById("next").onclick = () => {
    const ans = readDecisions(PRACTICE.items, "p");
    if(!checked){
      if(!requireAll(PRACTICE.items, ans)) return;
      checked = true;
      ST.practice = {answers: ans, correct: PRACTICE.items.every(d => ans[d.k] === d.answer),
                     ms: since(), times: t()};
      app().querySelectorAll(".decision input").forEach(x => { x.disabled = true; });
      document.getElementById("fb").classList.remove("hide");
      document.getElementById("next").textContent = "Continue";
      saveLocal(ST);
      return;
    }
    ST.practice.msFeedback = since();
    saveLocal(ST); route();
  };
}

/* ---------------------------------------------------------------- order */
/* Both of these keep any declared "after" constraint, whether or not the
   randomisation flags are on, and both are stored on the response so the
   analysis can see the order each respondent actually saw. */
function caseOrder(){
  const ids = CASES.map(c => c.id), edges = caseEdges();
  const seq = CONFIG.randomiseCaseOrder ? constrainedShuffle(ids, edges) : fixedOrder(ids, edges);
  return seq.map(id => CASES.findIndex(c => c.id === id));
}
function decisionOrderFor(c){
  const keys = c.decisions.map(d => d.k), edges = cardEdges(c);
  return CONFIG.randomiseDecisionOrder ? constrainedShuffle(keys, edges) : fixedOrder(keys, edges);
}

/* This respondent's sequence of cases. New records store case ids, so a
   later reordering of CASES cannot move a resumed respondent to another
   case. */
function caseSequence(rec){
  return Array.isArray(rec.caseOrder) ? rec.caseOrder.map(caseById)
                                      : (rec.order || []).map(i => CASES[i]);
}

/* ------------------------------------------------------------------ route */
function route(){
  if(ST.msIntro == null) return howItWorks();
  if(!ST.practice || ST.practice.msFeedback == null) return practice();
  const seq = caseSequence(ST);
  if(ST.at >= seq.length) return closing();
  const c = seq[ST.at];
  const rec = ST.cases[c.id] || (ST.cases[c.id] = {
    pos: ST.at + 1, errA: 0, errB: 0, decisionOrder: decisionOrderFor(c)
  });
  if(!rec.first) return pageFirst(c, rec);
  if(!rec.final) return pageFinal(c, rec);
  /* A completed caselet is the durable unit of progress. Save it to the
     server before advancing; the request runs in parallel with the next page. */
  if(!rec.serverCheckpointed){
    rec.serverCheckpointed = true;
    saveLocal(ST);
    checkpointResponse(ST, "case_" + c.id + "_complete");
  }
  ST.at++; saveLocal(ST); route();
}

/* ------------------------------------------------------------ the board */
function situationHeader(c){
  return `<header class="sit">
     <div class="art">${(window.ART || {})[c.art] || ""}</div>
     <div><p class="kicker">Situation ${ST.at+1} of ${CASES.length}</p>
       <h2>${esc(c.name)}</h2>
       <p class="when">${esc(c.when)}</p></div>
   </header>
   <p class="opening serif">${esc(c.opening)}</p>
   <details class="help"><summary>What the four actions mean</summary>${definitionsHTML()}</details>`;
}

/* one decision with its four actions. extra goes between the text and
   the options (the first answer and the AI advice, on the final page). */
function decisionCard(d, kicker, prefix, extra, legend){
  return `<article class="decision" data-k="${esc(d.k)}">
    <p class="kicker">${esc(kicker)}</p>
    <h3>${esc(d.n)}</h3>
    <p class="text serif">${esc(d.t)}</p>
    ${extra || ""}
    <fieldset class="acts"><legend class="${legend ? "lg" : "sr"}">${legend || "Your answer"}</legend>
      ${ACTIONS.map(([a, n, gloss]) =>
        `<label class="act" data-a="${a}"><input type="radio" name="${prefix}-${esc(d.k)}" value="${a}">
          <span><b>${n}</b> — ${esc(gloss)}</span></label>`).join("")}
    </fieldset>
  </article>`;
}

/* keeps the selected style in step with the radios, and notes when each
   decision was last answered (ms since the page opened) */
function wireDecisions(prefix){
  const times = {};
  const t0 = Date.now();
  app().querySelectorAll(".decision").forEach(box => {
    box.querySelectorAll(`input[name^="${prefix}-"]`).forEach(inp => {
      inp.onchange = () => {
        box.querySelectorAll(".act").forEach(l => l.classList.toggle("on", l.querySelector("input").checked));
        box.classList.remove("missing");
        times[box.dataset.k] = Date.now() - t0;
      };
    });
  });
  return () => ({...times});
}
function readDecisions(list, prefix){
  const out = {};
  list.forEach(d => {
    const x = app().querySelector(`input[name="${prefix}-${d.k}"]:checked`);
    out[d.k] = x ? x.value : null;
  });
  return out;
}
function setDecisions(plan, prefix){
  Object.keys(plan || {}).forEach(k => {
    const x = app().querySelector(`input[name="${prefix}-${k}"][value="${plan[k]}"]`);
    if(x){ x.checked = true; x.closest(".act").classList.add("on"); }
  });
}
function requireAll(list, ans){
  const missing = list.filter(d => !ans[d.k]);
  app().querySelectorAll(".decision").forEach(b => b.classList.toggle("missing", missing.some(d => d.k === b.dataset.k)));
  if(!missing.length) return true;
  document.getElementById("e").textContent = missing.length === 1
    ? `Choose an action for “${missing[0].n}”.`
    : `Choose an action for each decision. ${missing.length} are still open.`;
  const first = app().querySelector(".decision.missing");
  if(first && first.scrollIntoView) first.scrollIntoView({behavior:"smooth", block:"center"});
  return false;
}
const ordered = (c, rec) => rec.decisionOrder.map(k => c.decisions.find(d => d.k === k));

/* first answers --------------------------------------------------------- */
function pageFirst(c, rec){
  setStep(`Situation ${ST.at+1} of ${CASES.length}`, 12 + ST.at*13);
  const list = ordered(c, rec);
  paint(`${situationHeader(c)}
   <h3 class="part">Your first answers</h3>
   <p class="small muted">Choose one action for each decision. You may choose the same action more than once.</p>
   <div class="decisions fade">${list.map((d, i) => decisionCard(d, `Decision ${i+1} of ${list.length}`, "a")).join("")}</div>
   <p class="err" id="e"></p>
   <button class="go" id="next">Save my answers</button>`);
  const t = wireDecisions("a");
  document.getElementById("next").onclick = () => {
    const ans = readDecisions(list, "a");
    if(!requireAll(list, ans)){ rec.errA++; return; }
    rec.first = ans; rec.msA = since(); rec.tA = t();
    saveLocal(ST);
    /* the pre-AI answers feed the ability score: save them before the advisor shows */
    checkpointResponse(ST, "case_" + c.id + "_first_plan");
    route();
  };
}

/* AI advice and final answers ------------------------------------------ */
const LIKERT = ["Not sure at all","Not very sure","Fairly sure","Very sure","Completely sure"];
function confidenceHTML(){
  return `<fieldset class="scale">
    <legend>How sure are you that your final answers are close to the best answers for this situation? <span class="muted">(optional)</span></legend>
    <div class="seg">${LIKERT.map((o, i) =>
      `<label><input type="radio" name="conf" value="${i+1}"><span>${esc(o)}</span></label>`).join("")}</div>
  </fieldset>
  <label class="reason" for="why">Why did you keep or change your answers? <span class="muted">(optional)</span></label>
  <textarea id="why" maxlength="1000"></textarea>`;
}

function pageFinal(c, rec){
  setStep(`Situation ${ST.at+1} of ${CASES.length}`, 18 + ST.at*13);
  const list = ordered(c, rec);
  const level = ST.aiLevels[c.id];
  const ai = aiPlan(c, level);
  /* what the advisor showed, kept with the answers, so the record stands
     on its own if the advice is edited later. Set once. */
  if(!rec.ai) rec.ai = {condition: ST.aiCondition, level, actions: ai.actions, why: ai.why,
                        score: aiPlanScore(c, level)};
  const shown = rec.ai;
  paint(`${situationHeader(c)}
   <h3 class="part">AI advice and your final answers</h3>
   <p class="small muted">Your first answers are saved and cannot be changed. An AI advisor looked at the same five decisions; its recommendation is under each one. Your first answers are selected below. Change any you want.</p>
   <div class="decisions fade">${list.map((d, i) => decisionCard(d, `Decision ${i+1} of ${list.length}`, "b",
     `<div class="compare">
        <div class="mine"><span class="tag">Your first answer</span><b data-a="${rec.first[d.k]}">${actionLabel(rec.first[d.k])}</b></div>
        <div class="advice"><span class="tag">AI advisor</span><b data-a="${shown.actions[d.k]}">${actionLabel(shown.actions[d.k])}</b>
          <p class="serif">${esc(shown.why[d.k])}</p></div>
      </div>`, "Your final answer")).join("")}</div>
   ${confidenceHTML()}
   <p class="err" id="e"></p>
   <button class="go" id="next">Save my final answers</button>`);
  const t = wireDecisions("b");
  setDecisions(rec.first, "b");
  app().querySelectorAll(".seg input").forEach(x => x.onchange = () =>
    app().querySelectorAll(".seg label").forEach(l => l.classList.toggle("on", l.querySelector("input").checked)));
  document.getElementById("next").onclick = () => {
    const ans = readDecisions(list, "b");
    if(!requireAll(list, ans)){ rec.errB++; return; }
    const conf = app().querySelector("input[name=conf]:checked");
    rec.final = ans; rec.msB = since(); rec.tB = t();
    rec.conf = conf ? +conf.value : null;
    rec.reason = document.getElementById("why").value.trim();
    saveLocal(ST); route();
  };
}

/* closing ----------------------------------------------------------------- */
function closing(){
  setStep("Last few questions", 92);
  const sel = (id,label,opts) => `<h3>${label}</h3><select id="${id}"><option value="">Choose one</option>${opts.map(o=>`<option>${o}</option>`).join("")}</select>`;
  paint(`
   <h2>Last few questions</h2>
   <div class="card">
     ${sel("e1","While answering, did you use ChatGPT or another AI tool, or ask anyone for help?",["No","Yes, for some situations","Yes, for most situations"])}
     <p class="small muted" style="margin:.3rem 0 0">Your answer changes nothing for you.</p>
     ${sel("e2","Overall, how did the AI advisor's recommendations compare with yours?",["Mostly better","About the same","Mostly worse","Some better, some worse"])}
     <h3>In one line, what do you think this study is testing?</h3>
     <textarea id="e3"></textarea>
     <h3>Your CAT overall percentile (optional)</h3>
     <input type="number" id="e4" min="0" max="100" step="0.01" placeholder="e.g. 98.5">
   </div>
   ${CONFIG.contactAt === "end" ? contactHTML() : ""}
   ${CONFIG.showPilotQuestions ? `
   <h2 style="margin-top:1.8rem">Help us fix the survey</h2>
   <div class="card">
     ${sel("f1","Which situation was hardest to decide?", CASES.map(c=>c.name).concat(["None stood out"]))}
     ${sel("f2","Was the difference between Wait and Hold clear?",["Clear","Somewhat clear","Not clear"])}
     <h3>Did any decision seem to have an obvious answer? Which one, and what gave it away?</h3>
     <textarea id="f3"></textarea>
     <h3>Was any decision hard to fit into the four actions? Which one?</h3>
     <textarea id="f4"></textarea>
     ${sel("f5","How did the length feel?",["Too long","About right","Too short"])}
     <h3>Anything else we should change?</h3>
     <textarea id="f6"></textarea>
   </div>` : ""}
   <p class="err" id="e"></p>
   <button class="go" id="next">Finish</button>`);
  document.getElementById("next").onclick = async () => {
    const g = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
    const required = CONFIG.showPilotQuestions ? ["e1","e2","f1","f2","f5"] : ["e1","e2"];
    if(required.some(id => !g(id))){ document.getElementById("e").textContent = "Please answer the dropdown questions."; return; }
    if(CONFIG.contactAt === "end"){ readContact(); ST.contact = window.__contact || null; }
    ST.end = {aiHelp:g("e1"), compare:g("e2"), guess:g("e3"), cat: g("e4") ? +g("e4") : null};
    if(CONFIG.showPilotQuestions)
      ST.pilot = {hardest:g("f1"), waitHold:g("f2"), obvious:g("f3"), hardToFit:g("f4"), length:g("f5"), other:g("f6")};
    ST.msEnd = since(); ST.finished = new Date().toISOString(); ST.done = true;
    ST.totalMin = Math.round(((new Date(ST.finished) - new Date(ST.started))/60000)*10)/10;
    saveLocal(ST);
    const btn = document.getElementById("next"); btn.disabled = true; btn.textContent = "Saving…";
    ST.savedVia = await submitResponse(ST);
    saveLocal(ST); thanks();
  };
}

function thanks(){
  setStep("Done", 100);
  const ok = !!ST.savedVia;
  paint(`
   <h1>Thank you</h1>
   <p class="serif">${esc(CONFIG.debrief)}</p>
   <p class="serif">Please do not discuss these situations with anyone who may take the survey later.</p>
   ${ok ? `<p class="small muted">Your answers were saved.</p>` : `
   <div class="card">
     <p><b>Your answers could not reach the study database yet.</b></p>
     <p class="small" id="retrymsg">${finalRetryRunning ? "Trying again…" : "Check your connection and press Try again."}</p>
     <p style="margin:.5rem 0 0"><button class="go" id="retry"${finalRetryRunning ? " disabled" : ""}>${finalRetryRunning ? "Trying…" : "Try again"}</button></p>
     <p class="small" style="margin-top:1rem">If it still fails, copy the text below and send it to the person who shared this link, or download it as a file. It holds your answers, and any contact details you chose to give.</p>
     <textarea id="dump" readonly style="min-height:6rem"></textarea>
     <p style="margin:.5rem 0 0"><button class="ghost" id="copy">Copy</button>
     <button class="ghost" id="dl">Download file</button></p>
   </div>`}
   <p class="small muted" style="margin-top:2rem">Someone else taking the survey on this device?
     <a href="#" id="fresh">Start a new response</a>.</p>`);
  document.getElementById("fresh").onclick = e => { e.preventDefault(); startFresh(); };
  if(!ok){
    const t = document.getElementById("dump"); t.value = JSON.stringify(ST);
    document.getElementById("copy").onclick = () => { t.select();
      try{ document.execCommand("copy"); document.getElementById("copy").textContent = "Copied"; }catch(e){} };
    document.getElementById("dl").onclick = () => downloadFile(`response-${ST.pid}.json`, JSON.stringify(ST,null,1), "application/json");
    document.getElementById("retry").onclick = () => {
      const b = document.getElementById("retry"); b.disabled = true; b.textContent = "Trying…";
      document.getElementById("retrymsg").textContent = "Trying again…";
      retryFinalSave();
    };
  }
}
