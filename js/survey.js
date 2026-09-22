/* =============================================================
   survey.js — the respondent's side.
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
  const b = a.querySelector(".board.fade");
  if(b) requestAnimationFrame(()=> requestAnimationFrame(()=> b.classList.add("in")));
}

/* label sets by mode ----------------------------------------------------- */
function labelSet(){
  return ST.deferMode === "merged"
    ? [["own","Own",1],["delegate","Delegate",2],["defer","Set aside",2]]
    : [["own","Own",1],["delegate","Delegate",2],["wait","Wait",1],["hold","Hold",1]];
}
const need = k => (labelSet().find(l => l[0] === k) || [,,0])[2];

/* ------------------------------------------------------------------ start */
function startSurvey(){
  const saved = loadLocal();
  if(saved && saved.done){ ST = saved; return thanks(); }
  if(saved && saved.order){
    ST = saved;
    /* a session left half-finished on this browser before "Edit the AI's
       plan" was removed: send it to the editor it would get today, seeded
       from the respondent's own plan. Finished records are untouched. */
    Object.keys(ST.cases || {}).forEach(k => {
      const r = ST.cases[k]; if(r && r.menu === "edit_ai" && !r.final) r.menu = "edit_mine";
    });
    return route();
  }
  welcome();
}

/* Name and mobile. Default is the end of the survey: if a respondent gives
   a name before answering, the plans stop being anonymous while they are
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
   <p class="serif lead">You will be given six situations. Each situation has five issues. You give every issue one label.</p>
   <p class="serif">You decide what to handle yourself, what to hand to someone on your team, and what to set aside for now.</p>
   <p class="serif">After your plan is recorded, an AI advisor shows you its plan for the same situation. You then decide what your final plan is.</p>
   <div class="card small">
     <p>Please do it in one sitting, without looking anything up.</p>
     <p>Your answers are used for a student research project at IIM Ahmedabad. You are not asked who you are while you work through the situations.</p>
     <p>At the end you can leave a name and mobile number to enter the prize draw. That is optional, and if you give it, it is saved with your answers rather than kept apart from them.</p>
     <p style="margin:0">You can stop at any time by closing the page.</p>
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
    ST = {
      pid: uid(),
      version: Math.random() < 0.5 ? "A" : "B",
      deferMode: url.get("defer") || CONFIG.deferMode,
      started: new Date().toISOString(),
      bg: {programme:v[0], experience:v[1], managed:v[2], aiUse:v[3], undergrad:v[4]},
      order: caseOrder(),
      at: 0, cases: {}, msBg: since(), done: false,
      contact: window.__contact || null
    };
    saveLocal(ST);
    checkpointResponse(ST, "background_complete");
    howItWorks();
  };
}

function howItWorks(){
  setStep("How it works", 7);
  const merged = ST.deferMode === "merged";
  paint(`
   <h2>How it works</h2>
   <div class="card serif">
     <p>Each situation has five issues. You give every issue one label.</p>
     <p style="margin:.55rem 0"><b>What you are judged on.</b> In every situation you are responsible for how your unit performs over the next three months, not only today. The people on your team are part of what has to keep working over that period.</p>
     <p style="margin:.55rem 0">
       <b style="color:var(--own)">Own</b> — you handle it yourself now. One issue.<br>
       <b style="color:var(--del)">Delegate</b> — someone on your team handles it. Two issues, and you choose who.<br>
       ${merged
         ? `<b style="color:var(--wait)">Set aside</b> — you are not acting on it right now. Two issues.`
         : `<b style="color:var(--wait)">Wait</b> — it can safely be picked up later. One issue.<br>
            <b style="color:var(--hold)">Hold</b> — nobody should act on it until one missing fact is checked. One issue.`}
     </p>
     ${merged
       ? `<p style="margin:0">After you set two aside, we ask one more question about them.</p>`
       : `<p style="margin:0">Wait and Hold are different. Wait is about timing. Hold is about a fact you do not have yet.</p>`}
   </div>
   <p class="small muted">Your first plan in each situation is saved before you see the AI advisor, and cannot be changed afterwards. You can still choose a different final plan.</p>
   <button class="go" id="next">I am ready</button>`);
  document.getElementById("next").onclick = () => { ST.msIntro = since(); saveLocal(ST); route(); };
}

/* ---------------------------------------------------------------- order */
/* Both of these keep any declared "after" constraint, whether or not the
   randomisation flags are on, and both are stored on the response so the
   analysis can see the order each respondent actually saw. */
function caseOrder(){
  const ids = CASES.map(c => c.id), edges = caseEdges();
  const seq = CONFIG.randomiseCaseOrder ? constrainedShuffle(ids, edges) : topoOrder(ids, edges);
  return seq.map(id => CASES.findIndex(c => c.id === id));
}
function cardOrderFor(c){
  const keys = c.issues.map(i => i.k), edges = cardEdges(c);
  return CONFIG.randomiseCardOrder ? constrainedShuffle(keys, edges) : topoOrder(keys, edges);
}

/* ------------------------------------------------------------------ route */
function route(){
  if(ST.at >= CASES.length) return closing();
  const c = CASES[ST.order[ST.at]];
  const rec = ST.cases[c.id] || (ST.cases[c.id] = {
    pos: ST.at + 1, errA: 0, errC: 0,
    cardOrder: cardOrderFor(c)
  });
  if(!rec.seen)   return pageIntro(c, rec);
  if(!rec.first)  return pageBoard(c, rec, "first");
  if(!rec.menu)   return pageAdvisor(c, rec);
  if(rec.menu === "edit_mine" && !rec.final) return pageBoard(c, rec, "final");
  /* A completed final plan is the durable unit of progress. Save it to the
     server before advancing; the request runs in parallel with the next page. */
  if(rec.final && !rec.serverCheckpointed){
    rec.serverCheckpointed = true;
    saveLocal(ST);
    checkpointResponse(ST, "case_" + c.id + "_complete");
  }
  ST.at++; saveLocal(ST); route();
}

/* a clean screen between situations, so no page carries two jobs */
function pageIntro(c, rec){
  setStep(`Situation ${ST.at+1} of ${CASES.length}`, 10 + ST.at*13);
  paint(`
   <p class="small muted">Situation ${ST.at+1} of ${CASES.length}</p>
   <h1>${esc(c.name)}</h1>
   <p class="serif lead">${esc(c.opening)}</p>
   <p class="serif lead muted">Five things need attention at the same time. You will give each one a label.</p>
   <button class="go" id="next">See the situation</button>`);
  document.getElementById("next").onclick = () => {
    rec.seen = true; rec.msIntro = since(); saveLocal(ST); route();
  };
}

function header(c){
  return `<p class="small muted">Situation ${ST.at+1} of ${CASES.length}</p>
   <h2>${esc(c.name)}</h2>
   <p class="situation serif">${esc(c.opening)}</p>`;
}

/* people are stored as [key, name, "Title \u2014 remit"] */
function person(p){
  const bits = String(p[2]).split(" \u2014 ");
  return {k:p[0], name:p[1], title:bits[0] || p[2], remit:bits.slice(1).join(" \u2014 ")};
}

/* the roster must be readable while choosing, not only inside the dropdown:
   the case text never says who is good at what, so the respondent has to
   join the two. */
function rosterHTML(c){
  return `<div class="roster"><h4>Your team</h4><ul>` + c.people.map(p => {
    const q = person(p);
    return `<li><b>${esc(q.name)}</b><span class="t">${esc(q.title)}</span><span class="r">${esc(q.remit)}</span></li>`;
  }).join("") + `</ul></div>`;
}

/* the situation again, on the advisor screen */
function recapHTML(c, rec){
  const byKey = k => c.issues.find(i => i.k === k);
  return `<div class="recap"><h4>The situation again</h4>
    <div class="recap-grid">${rec.cardOrder.map(k => { const i = byKey(k);
      return `<div class="rcard"><b>${esc(i.n)}</b><span>${esc(i.t)}</span></div>`; }).join("")}</div>
    ${rosterHTML(c)}</div>`;
}

const LIKERT = ["Not sure at all","Not very sure","Fairly sure","Very sure","Completely sure"];
function likertHTML(id, label){
  return `<fieldset class="likert"><legend>${label}</legend>` + LIKERT.map((o,i) =>
    `<label><input type="radio" name="${id}" value="${i+1}"><span>${esc(o)}</span></label>`).join("") + `</fieldset>`;
}

function issueCards(c, rec, prefix){
  const byKey = k => c.issues.find(i => i.k === k);
  return `<div class="board fade">` + rec.cardOrder.map(k => {
    const is = byKey(k);
    return `<article class="issue" data-i="${is.k}">
      <h3 class="name">${esc(is.n)}</h3>
      <p class="what">${esc(is.t)}</p>
      <div class="chips">${labelSet().map(([lk,ln]) =>
        `<button type="button" class="chip" data-l="${lk}">${ln}</button>`).join("")}</div>
      <div class="who"><label for="${prefix}-${is.k}">Who handles it?</label>
        <select id="${prefix}-${is.k}"><option value="">Choose a person</option>
        ${c.people.map(p=>{const q=person(p);return `<option value="${q.k}">${esc(q.name)} — ${esc(q.title)}</option>`;}).join("")}</select></div>
    </article>`;
  }).join("") + `</div>`;
}

const meterHTML = () => `<div class="meter">` + labelSet().map(([k,n,q]) =>
  `<span class="tally" data-k="${k}" data-n="${n}" data-q="${q}">${n} 0/${q}</span>`).join("") + `</div>`;

/* L is {issueKey: {label, person}} */
function wireBoard(c, L, onChange, onBlock){
  const nameOf = k => (c.issues.find(i => i.k === k) || {}).n || k;
  function repaint(){
    app().querySelectorAll(".issue").forEach(box => {
      const k = box.dataset.i, cur = L[k];
      box.querySelectorAll(".chip").forEach(b =>
        (cur && cur.label === b.dataset.l) ? b.setAttribute("data-on", b.dataset.l) : b.removeAttribute("data-on"));
      const who = box.querySelector(".who");
      if(cur && cur.label === "delegate") who.classList.add("show");
      else { who.classList.remove("show"); box.querySelector("select").value = ""; if(cur) cur.person = null; }
    });
    const counts = {}; labelSet().forEach(([k]) => counts[k] = 0);
    Object.values(L).forEach(v => counts[v.label]++);
    app().querySelectorAll(".tally").forEach(t => {
      const k = t.dataset.k, q = +t.dataset.q;
      t.textContent = `${t.dataset.n} ${counts[k]}/${q}`;
      t.classList.toggle("done", counts[k] === q);
    });
    onChange && onChange(L);
  }
  app().querySelectorAll(".issue").forEach(box => {
    const k = box.dataset.i;
    box.querySelectorAll(".chip").forEach(btn => {
      btn.onclick = () => {
        const lab = btn.dataset.l, cur = L[k];
        if(cur && cur.label === lab){ delete L[k]; }
        else {
          let used = 0, holder = null;
          for(const kk in L) if(kk !== k && L[kk].label === lab){ used++; holder = kk; }
          if(used >= need(lab)){
            const nm = labelSet().find(x => x[0] === lab)[1];
            onBlock && onBlock(`${nm} is already on ${nameOf(holder)}. Take it off there first.`);
            return;
          }
          L[k] = {label: lab, person: (cur && cur.person) || null};
        }
        repaint();
      };
    });
    box.querySelector("select").onchange = e => { if(L[k]) L[k].person = e.target.value || null; repaint(); };
  });
  repaint();
  return repaint;
}

function problemWith(L){
  const counts = {}; labelSet().forEach(([k]) => counts[k] = 0);
  Object.values(L).forEach(v => counts[v.label]++);
  for(const [k,n,q] of labelSet()){
    if(counts[k] < q) return `Give ${q - counts[k]} more issue${q - counts[k] > 1 ? "s" : ""} the label ${n}.`;
    if(counts[k] > q) return `${n} can be used on ${q} issue${q > 1 ? "s" : ""} only.`;
  }
  if(Object.values(L).some(v => v.label === "delegate" && !v.person)) return "Choose a person for each delegated issue.";
  return null;
}

function toPlan(L){
  const p = {own:null, del:{}, wait:null, hold:null, defer:[], holdPick:null};
  for(const k in L){
    const v = L[k];
    if(v.label === "own") p.own = k;
    else if(v.label === "wait") p.wait = k;
    else if(v.label === "hold") p.hold = k;
    else if(v.label === "defer") p.defer.push(k);
    else if(v.label === "delegate") p.del[k] = v.person;
  }
  return p;
}

/* the extra question in merged mode -------------------------------------- */
function holdQuestionHTML(){
  return `<div id="holdq" class="card hide">
    <h3 style="margin-top:0">One more question about the two you set aside</h3>
    <p class="small muted">Is there one of them that nobody should act on until a fact is checked?</p>
    <div class="opts" id="holdopts"></div></div>`;
}
function refreshHoldQuestion(c, L, pick, onPick){
  const box = document.getElementById("holdq"); if(!box) return;
  const two = Object.keys(L).filter(k => L[k].label === "defer");
  if(two.length !== 2){ box.classList.add("hide"); return; }
  box.classList.remove("hide");
  const opts = document.getElementById("holdopts");
  const nameOf = k => c.issues.find(i => i.k === k).n;
  const rows = two.map(k => [k, nameOf(k)]).concat([["none","Neither — both are only waiting for time"]]);
  opts.innerHTML = rows.map(([v,n]) =>
    `<label${pick.v === v ? ' class="sel"' : ''}><input type="radio" name="hq" value="${v}"${pick.v === v ? " checked" : ""}>${esc(n)}</label>`).join("");
  opts.querySelectorAll("label").forEach(l => l.onclick = () => {
    opts.querySelectorAll("label").forEach(x => x.classList.remove("sel"));
    l.classList.add("sel"); pick.v = l.querySelector("input").value; onPick && onPick();
  });
}

/* board page: first plan or final plan ------------------------------------ */
function pageBoard(c, rec, which){
  const first = which === "first";
  setStep(`Situation ${ST.at+1} of ${CASES.length}`, 10 + ST.at*13 + (first ? 0 : 6));
  const merged = ST.deferMode === "merged";
  const L = {}; const pick = {v:null};

  let seed = null;
  if(!first){
    seed = rec.first;
    L[seed.own] = {label:"own", person:null};
    Object.keys(seed.del).forEach(i => L[i] = {label:"delegate", person:seed.del[i]});
    if(merged){ (seed.defer || [seed.wait, seed.hold]).forEach(i => L[i] = {label:"defer", person:null});
                pick.v = seed.holdPick || seed.hold || null; }
    else { L[seed.wait] = {label:"wait", person:null}; L[seed.hold] = {label:"hold", person:null}; }
  }

  const rule = labelSet().map(([,n,q]) => `${q} ${n}`).join(", ");
  paint(`${header(c)}
   ${first ? "" : `<div class="plans">
      <div class="plan"><h4>Your first plan</h4>${planRows(c, rec.first)}</div>
      <div class="plan"><h4>AI advisor's plan</h4>${planRows(c, aiPlan(c, ST.version))}</div></div>`}
   <h3>${first ? "Your first plan" : "Your final plan"}</h3>
   <p class="small muted">${first
      ? `Give each issue one label: ${rule}.`
      : `Started from your first plan. Change whatever you want. Same rule: ${rule}.`}</p>
   ${rosterHTML(c)}
   ${issueCards(c, rec, first ? "a" : "c")}
   ${merged ? holdQuestionHTML() : ""}
   ${first ? likertHTML("conf", "How sure are you that this plan is close to the best plan for this situation?") : ""}
   <p class="err" id="e"></p>
   <button class="go" id="next">${first ? "Save my plan" : "Save final plan"}</button>
   ${meterHTML()}`, true);

  const repaint = wireBoard(c, L,
    () => { document.getElementById("e").textContent = "";
            if(merged) refreshHoldQuestion(c, L, pick); },
    (m) => { rec[first ? "errA" : "errC"]++; document.getElementById("e").textContent = m; });

  if(!first){ // restore the delegate names the seed plan carried
    app().querySelectorAll(".issue").forEach(box => {
      const k = box.dataset.i;
      if(L[k] && L[k].label === "delegate"){
        box.querySelector(".who").classList.add("show");
        box.querySelector("select").value = L[k].person || "";
      }
    });
  }
  if(merged) refreshHoldQuestion(c, L, pick);

  document.getElementById("next").onclick = () => {
    const p = problemWith(L);
    if(p){ rec[first ? "errA" : "errC"]++; document.getElementById("e").textContent = p; return; }
    if(merged && !pick.v){ document.getElementById("e").textContent = "Answer the question about the two you set aside."; return; }
    const conf = first ? app().querySelector("input[name=conf]:checked") : null;
    if(first && !conf){ document.getElementById("e").textContent = "Say how sure you are about this plan."; return; }
    const plan = toPlan(L);
    if(merged) plan.holdPick = pick.v === "none" ? null : pick.v;
    if(first){ rec.first = plan; rec.conf1 = +conf.value; rec.msA = since(); }
    else { rec.final = plan; rec.msC = since(); }
    saveLocal(ST); route();
  };
}

function planRows(c, plan){
  const nm = k => (c.issues.find(i => i.k === k) || {}).n || k;
  const pn = k => { const p = c.people.find(p => p[0] === k); return p ? p[1] : k; };
  const rows = [["own","Own", nm(plan.own)]];
  Object.keys(plan.del).forEach(i => rows.push(["delegate","Delegate", `${nm(i)} → ${pn(plan.del[i])}`]));
  if(ST.deferMode === "merged"){
    (plan.defer || [plan.wait, plan.hold]).forEach(i => rows.push(["defer","Set aside", nm(i)]));
    const h = plan.holdPick ?? plan.hold;
    rows.push(["hold","Check first", h ? nm(h) : "Neither"]);
  } else {
    rows.push(["wait","Wait", nm(plan.wait)]);
    rows.push(["hold","Hold", nm(plan.hold)]);
  }
  return rows.map(r => `<div class="prow" data-k="${r[0]}"><b>${r[1]}</b><span>${esc(r[2])}</span></div>`).join("");
}

/* advisor page ------------------------------------------------------------ */
function pageAdvisor(c, rec){
  setStep(`Situation ${ST.at+1} of ${CASES.length}`, 14 + ST.at*13);
  const ai = aiPlan(c, ST.version);
  paint(`${header(c)}
   <p>Your first plan is saved and cannot be changed. An AI advisor looked at the same situation.</p>
   ${recapHTML(c, rec)}
   <div class="plans">
     <div class="plan"><h4>Your first plan</h4>${planRows(c, rec.first)}</div>
     <div class="plan"><h4>AI advisor's plan</h4>${planRows(c, ai)}
       <div class="why">${esc(ai.why)}</div></div>
   </div>
   <h3>What do you want your final plan to be?</h3>
   <div class="opts" id="opts">
     <label><input type="radio" name="m" value="keep">Keep my first plan</label>
     <label><input type="radio" name="m" value="use_ai">Use the AI's plan</label>
     <label><input type="radio" name="m" value="edit_mine">Edit my first plan</label>
   </div>
   <p class="err" id="e"></p>
   <button class="go" id="next">Continue</button>`, true);
  app().querySelectorAll(".opts label").forEach(l => l.onclick = () => {
    app().querySelectorAll(".opts label").forEach(x => x.classList.remove("sel")); l.classList.add("sel");
  });
  document.getElementById("next").onclick = () => {
    const v = app().querySelector("input[name=m]:checked");
    if(!v){ document.getElementById("e").textContent = "Choose one."; return; }
    rec.menu = v.value; rec.msB = since();
    if(v.value === "keep") rec.final = rec.first;
    if(v.value === "use_ai") rec.final = {own:ai.own, del:{...ai.del}, wait:ai.wait, hold:ai.hold,
                                          defer:[...ai.defer], holdPick:ai.holdPick};
    saveLocal(ST); route();
  };
}

/* closing ----------------------------------------------------------------- */
function closing(){
  setStep("Last few questions", 90);
  const sel = (id,label,opts) => `<h3>${label}</h3><select id="${id}"><option value="">Choose one</option>${opts.map(o=>`<option>${o}</option>`).join("")}</select>`;
  paint(`
   <h2>Last few questions</h2>
   <div class="card">
     ${sel("e1","While answering, did you use ChatGPT or another AI tool, or ask anyone for help?",["No","Yes, for some situations","Yes, for most situations"])}
     <p class="small muted" style="margin:.3rem 0 0">Your answer changes nothing for you.</p>
     ${sel("e2","Overall, how did the AI advisor's plans compare with yours?",["Mostly better","About the same","Mostly worse","Some better, some worse"])}
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
     ${ST.deferMode === "merged"
       ? sel("f2","Was the question about setting issues aside clear?",["Clear","Somewhat clear","Not clear"])
       : sel("f2","Was the difference between Wait and Hold clear?",["Clear","Somewhat clear","Not clear"])}
     <h3>Did any situation seem to have an obvious answer? Which one, and what gave it away?</h3>
     <textarea id="f3"></textarea>
     <h3>Did the one-label rule stop you from doing what you would really do? Where?</h3>
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
      ST.pilot = {hardest:g("f1"), waitHold:g("f2"), obvious:g("f3"), ruleBind:g("f4"), length:g("f5"), other:g("f6")};
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
     <p><b>Your answers could not reach the study database from this device.</b></p>
     <p class="small">Copy the text below and send it to the person who shared this link, or download it as a file. It holds your answers, and any contact details you chose to give.</p>
     <textarea id="dump" readonly style="min-height:6rem"></textarea>
     <p style="margin:.5rem 0 0"><button class="ghost" id="copy">Copy</button>
     <button class="ghost" id="dl">Download file</button></p>
   </div>`}`);
  if(!ok){
    const t = document.getElementById("dump"); t.value = JSON.stringify(ST);
    document.getElementById("copy").onclick = () => { t.select();
      try{ document.execCommand("copy"); document.getElementById("copy").textContent = "Copied"; }catch(e){} };
    document.getElementById("dl").onclick = () => downloadFile(`response-${ST.pid}.json`, JSON.stringify(ST,null,1), "application/json");
  }
}
