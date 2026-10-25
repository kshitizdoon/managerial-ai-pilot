/* =============================================================
   evaluator.js — Part 2, the Evaluator stage, in the browser.

   After finishing the Producer survey, a respondent rates three earlier
   participants from their real recorded decisions. The server chooses
   the three people and decides what is shown for each; this file only
   displays what it is sent and collects the ratings.

   Same PID as the Producer stage, separate record: the Producer record
   is never touched here. The evaluator record lives under its own
   localStorage key and its own server store, is checkpointed after the
   assignment and after every person, and resumes after a reload with the
   same three people in the same order.
   ============================================================= */

const EV_KEY = "inbasket_evaluator_v1";
const EV_RETRY_WAITS_MS = [0, 1500, 4000];
let EV = null;            // the evaluator record being built
let EV_STATUS = null;     // {enabled} from the server, once per page load

function evLoad(){ try{ const r = localStorage.getItem(EV_KEY); return r ? JSON.parse(r) : null; }catch(e){ return null; } }
function evSave(){ try{ if(EV) localStorage.setItem(EV_KEY, JSON.stringify(EV)); }catch(e){} }
function evClear(){ try{ localStorage.removeItem(EV_KEY); }catch(e){} EV = null; }

async function evStatus(){
  if(EV_STATUS) return EV_STATUS;
  if(CONFIG.storage === "local"){ EV_STATUS = {enabled:false}; return EV_STATUS; }
  try{
    const r = await fetch(CONFIG.evaluatorPath + "?status=1");
    const j = await r.json().catch(() => ({}));
    EV_STATUS = {enabled: !!(r.ok && j.enabled)};
  }catch(e){ EV_STATUS = {enabled:false}; }
  return EV_STATUS;
}

/* Called from thanks() once the Producer record is on the server.
   Returns true if Part 2 takes over the screen. */
function evaluatorOffer(producer){
  const ev = evLoad();
  if(ev && ev.pid === producer.pid){
    EV = ev;
    if(ev.declined) return false;
    if(ev.done || ev.unavailable){ evFinal(); return true; }
    if(ev.view){ evRoute(); return true; }
  }
  if(EV_STATUS === null){
    setStep("Saving", 100);
    paint(`<h1>One moment</h1><p class="muted">Your answers were saved.</p>`);
    evStatus().then(() => thanks());
    return true;
  }
  if(!EV_STATUS.enabled) return false;
  evOffer(producer.pid);
  return true;
}

/* resume Part 2 without the Producer record on this device (link with ?evaluate=PID) */
function evResume(ev){
  EV = ev;
  if(ev.done || ev.unavailable) return evFinal();
  if(ev.view) return evRoute();
  return evOffer(ev.pid);
}

function evOffer(pid){
  setStep("Part 1 done", 100);
  paint(`
   <h1>Part 1 is done</h1>
   <p class="small muted">Your answers were saved.</p>
   <div class="card">
     <h2 style="margin-top:0">Part 2: rate three earlier participants</h2>
     <p class="serif">You will see decisions that three earlier participants made in one of the situations you have just worked through. You will not see who they are. For each person, you rate their managerial decision-making ability from what you see.</p>
     <p class="serif" style="margin:0">It takes about five minutes.</p>
   </div>
   <p class="err" id="e"></p>
   <button class="go" id="ev-go">Continue to part 2</button>
   <p class="small muted" style="margin-top:1.4rem"><a href="#" id="ev-skip">Finish without part 2</a></p>`);
  document.getElementById("ev-go").onclick = () => evAssign(pid);
  document.getElementById("ev-skip").onclick = e => {
    e.preventDefault();
    EV = {pid, stage:"evaluator", declined:true, declinedAt:new Date().toISOString()};
    evSave();
    if(ST && ST.pid === pid) thanks(); else evFinal();
  };
}

async function evAssign(pid){
  const btn = document.getElementById("ev-go");
  if(btn){ btn.disabled = true; btn.textContent = "Loading…"; }
  let j = null, why = "";
  try{
    const r = await fetch(CONFIG.evaluatorPath, {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({action:"assign", pid})});
    j = await r.json().catch(() => null);
    if(!r.ok) why = (j && j.error) || ("status " + r.status);
  }catch(e){ why = "network: " + String(e && e.message || e); }
  if(!j || why){
    if(btn){ btn.disabled = false; btn.textContent = "Try again"; }
    const e = document.getElementById("e");
    if(e) e.textContent = "Part 2 could not be loaded. Check your connection and try again. (" + why + ")";
    return;
  }
  const now = new Date().toISOString();
  if(j.status === "not_enough"){
    EV = {pid, stage:"evaluator", unavailable:{eligible:j.eligible, needed:j.needed, at:now}};
    evSave();
    return evFinal();
  }
  EV = {pid, stage:"evaluator", started:now, assignmentId:j.view.assignmentId, view:j.view,
        at:0, items:{}, done:false, saveSeq:0, msIntro:since()};
  evSave();
  evCheckpoint("assignment_received");
  evRoute();
}

function evRoute(){
  if(EV.done) return EV.savedVia ? evFinal() : evSubmit();
  if(EV.at >= EV.view.items.length) return evSubmit();
  evPage(EV.view.items[EV.at]);
}

/* ---- one person ------------------------------------------------------ */
const EV_CONF = ["Not at all confident","Slightly confident","Moderately confident","Very confident","Completely confident"];

function evPage(item){
  const c = caseById(EV.view.caseId);
  const n = EV.view.items.length, i = EV.at;
  setStep(`Part 2: person ${i+1} of ${n}`, Math.round(100 * i / n));
  const hasAI = item.decisions.some(d => d.ai), hasFirst = item.decisions.some(d => d.first);
  const shown = hasFirst
    ? "You see this person's first decisions, made before any AI advice, the AI advisor's recommendation they received, and their final decisions."
    : hasAI ? "You see the AI advisor's recommendation this person received, and their final decisions."
    : "You see this person's final decisions.";
  const row = (label, a, extra) => `<div class="evrow"><span class="tag">${label}</span><b>${esc(actionLabel(a))}</b>${extra || ""}</div>`;
  const cards = item.decisions.map((d, j) => {
    const dec = c.decisions.find(x => x.k === d.k);
    const changed = hasFirst ? (d.first !== d.final) : null;
    return `<article class="decision" data-k="${esc(d.k)}">
      <p class="kicker">Decision ${j+1} of ${item.decisions.length}</p>
      <h3>${esc(dec.n)}</h3>
      <p class="text serif">${esc(dec.t)}</p>
      ${dec.q ? `<p class="ask"><b>To decide:</b> ${esc(dec.q)}</p>` : ""}
      <div class="evrec">
        ${hasFirst ? row("First decision, before AI advice", d.first) : ""}
        ${d.ai ? row("AI advisor recommended", d.ai.action, `<p class="serif">${esc(d.ai.why)}</p>`) : ""}
        ${row(hasFirst ? "Final decision" : "Their decision", d.final,
              hasFirst ? `<span class="chg" data-changed="${changed}">${changed ? "Changed after the AI advice" : "Not changed after the AI advice"}</span>` : "")}
      </div>
    </article>`;
  }).join("");
  paint(`
   <header class="sit">
     <div class="art">${(window.ART || {})[c.art] || ""}</div>
     <div><p class="kicker">Part 2 · Person ${i+1} of ${n}</p>
       <h2>${esc(c.name)}</h2>
       <p class="when">${esc(c.when)}</p></div>
   </header>
   ${(c.facts || []).length ? `<ul class="facts">${c.facts.map(([v, l]) => `<li><b>${esc(v)}</b><span>${esc(l)}</span></li>`).join("")}</ul>` : ""}
   <p class="opening serif">${esc(c.opening)}</p>
   <details class="help"><summary>What the four actions mean</summary>${whoWhenHTML()}${definitionsHTML()}</details>
   <p class="evshown">${shown}</p>
   <div class="decisions fade">${cards}</div>
   <fieldset class="scale rate">
     <legend>Based on the decisions you have seen, how would you rate this person's managerial decision-making ability?</legend>
     <div class="raterow">
       <input type="range" id="rt" min="0" max="100" step="1" value="50" class="unset" aria-label="Rating from 0 to 100">
       <input type="number" id="rtn" min="0" max="100" step="1" placeholder="0-100" aria-label="Rating, typed">
     </div>
     <div class="ends"><span>0 · Very poor</span><span>50 · Average</span><span>100 · Excellent</span></div>
     <p class="small muted" id="rtv">Not rated yet.</p>
   </fieldset>
   <fieldset class="scale">
     <legend>How confident are you in this assessment?</legend>
     <div class="seg">${EV_CONF.map((o, k) => `<label><input type="radio" name="evc" value="${k+1}"><span>${esc(o)}</span></label>`).join("")}</div>
   </fieldset>
   <label class="reason" for="evw">What most influenced your assessment? <span class="muted">(optional)</span></label>
   <textarea id="evw" maxlength="1000"></textarea>
   <p class="err" id="e"></p>
   <button class="go" id="next">${i + 1 < n ? "Next person" : "Submit my ratings"}</button>`, true);

  /* the rating has no value until the respondent gives one */
  let rating = null;
  const rt = document.getElementById("rt"), rtn = document.getElementById("rtn"), rtv = document.getElementById("rtv");
  const set = v => { rating = v; rt.classList.remove("unset"); rt.value = v; rtn.value = v; rtv.textContent = "Your rating: " + v + " out of 100."; };
  ["input", "change", "pointerup", "keyup"].forEach(ev => rt.addEventListener(ev, e => {
    if(e.type === "keyup" && !/Arrow|Home|End|Page/.test(e.key)) return;
    set(+rt.value);
  }));
  rtn.addEventListener("input", () => {
    const v = Math.round(Number(rtn.value));
    if(rtn.value !== "" && v >= 0 && v <= 100) set(v);
  });
  app().querySelectorAll(".seg input").forEach(x => x.onchange = () =>
    app().querySelectorAll(".seg label").forEach(l => l.classList.toggle("on", l.querySelector("input").checked)));

  document.getElementById("next").onclick = () => {
    const conf = app().querySelector("input[name=evc]:checked");
    const err = document.getElementById("e");
    if(rating == null){ err.textContent = "Please give a rating from 0 to 100."; return; }
    if(!conf){ err.textContent = "Please say how confident you are."; return; }
    EV.items[item.token] = {rating, conf:+conf.value, why:document.getElementById("evw").value.trim(),
                            ms:since(), position:item.position};
    EV.at++;
    evSave();
    evCheckpoint("person_" + (i + 1) + "_rated");
    evRoute();
  };
}

/* ---- saving ------------------------------------------------------------ */
async function evCheckpoint(reason){
  if(!EV || !EV.assignmentId || CONFIG.storage === "local") return null;
  EV.saveSeq = (EV.saveSeq || 0) + 1;
  EV.clientSavedAt = new Date().toISOString();
  EV.saveReason = reason;
  evSave();
  const seq = EV.saveSeq, rec = EV;
  const record = {...EV}; delete record.view;           // the server has the assignment already
  const body = JSON.stringify({action:"save", record});
  let lastErr = null;
  for(let i = 0; i < EV_RETRY_WAITS_MS.length; i++){
    if(EV_RETRY_WAITS_MS[i]) await sleep(EV_RETRY_WAITS_MS[i]);
    if(i > 0 && (rec.lastServerSeq || 0) >= seq) return "function";
    try{
      const r = await fetch(CONFIG.evaluatorPath, {method:"POST", headers:{"Content-Type":"application/json"}, body, keepalive:true});
      if(!r.ok){ const t = await r.text().catch(() => ""); throw new Error("function " + r.status + (t ? ": " + t : "")); }
      if(seq >= (rec.lastServerSeq || 0)){ rec.lastServerSeq = seq; rec.lastServerSaveError = null; }
      if(EV === rec) evSave();
      return "function";
    }catch(e){ lastErr = e; }
  }
  if(seq >= (rec.lastServerSeq || 0)) rec.lastServerSaveError = String(lastErr && lastErr.message || lastErr);
  if(EV === rec) evSave();
  return null;
}

async function evSubmit(){
  if(!EV.done){
    EV.done = true;
    EV.finished = new Date().toISOString();
    EV.totalMin = Math.round(((new Date(EV.finished) - new Date(EV.started)) / 60000) * 10) / 10;
    evSave();
  }
  setStep("Part 2", 100);
  paint(`<h1>Saving your ratings…</h1>`);
  const how = await evCheckpoint("finish");
  EV.savedVia = how; evSave();
  evFinal();
}

/* ---- the end ----------------------------------------------------------- */
function evFinal(){
  setStep("Done", 100);
  const failed = EV && EV.done && !EV.savedVia;
  paint(`
   <h1>Thank you</h1>
   ${EV && EV.unavailable ? `<p class="serif">Part 2 cannot be offered yet: not enough earlier responses are available. Your answers to part 1 were saved.</p>`
     : EV && EV.done ? `<p class="serif">You have completed both parts.</p>` : ""}
   <p class="serif">${esc(CONFIG.debrief)}</p>
   <p class="serif">Please do not discuss these situations with anyone who may take the survey later.</p>
   ${failed ? `<div class="card"><p><b>Your ratings could not reach the study database yet.</b></p>
     <p class="small muted">${esc(EV.lastServerSaveError ? "Technical detail: " + EV.lastServerSaveError.slice(0, 300) : "")}</p>
     <p style="margin:.5rem 0 0"><button class="go" id="ev-retry">Try again</button></p></div>`
     : EV && EV.done ? `<p class="small muted">Your ratings were saved.</p>` : ""}
   <p class="small muted" style="margin-top:2rem">Someone else taking the survey on this device?
     <a href="#" id="fresh">Start a new response</a>.</p>`);
  document.getElementById("fresh").onclick = e => { e.preventDefault(); startFresh(); };
  const b = document.getElementById("ev-retry");
  if(b) b.onclick = () => { b.disabled = true; b.textContent = "Trying…"; evSubmit(); };
}
