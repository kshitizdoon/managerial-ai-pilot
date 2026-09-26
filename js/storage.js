/* =============================================================
   storage.js — where responses go.

   1. The Netlify function (Netlify Blobs). This is the only server
      store. It needs the netlify/ folder deployed, which needs a git
      or CLI deploy. A drag-and-drop deploy has no function, and then
      nothing reaches the server.
   2. The browser (localStorage). Always. It is a backup, and it is what
      lets a participant resume after a reload.

   The survey saves a full copy of the response (a "checkpoint") after
   the About-you page, after every first plan, after every final plan,
   and at Finish. Each checkpoint replaces the same PID record on the
   server. saveSeq numbers the checkpoints, so an older copy never
   replaces a newer one. Failed saves are retried.
   ============================================================= */

const LS_KEY = "inbasket_pilot_v2";
const ARCHIVE_KEY = "inbasket_pilot_archive_v2";   // earlier sessions on this device
const RETRY_WAITS_MS = [0, 1500, 4000];            // three tries per save
const KEEPALIVE_MAX_BYTES = 60000;                 // browsers cap keepalive bodies at 64 KB

function loadLocal(){
  try{ const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; }
  catch(e){ return null; }
}
function saveLocal(obj){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(obj)); }catch(e){}
}
function clearLocal(){ try{ localStorage.removeItem(LS_KEY); }catch(e){} }

/* A save that finishes late must not write an old participant's record
   back over a new participant on the same device. */
function saveLocalIfCurrent(obj){
  const cur = loadLocal();
  if(cur && obj && cur.pid === obj.pid) saveLocal(obj);
}

/* Before a new person starts on this device, keep the old record here
   too. The results view reads this list, so a response whose server
   save failed can still be recovered from the device. */
function archivedRows(){
  try{ return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]"); }catch(e){ return []; }
}
function archiveLocal(){
  const cur = loadLocal(); if(!cur || !cur.pid) return;
  try{
    const arr = archivedRows().filter(r => r && r.pid !== cur.pid);
    arr.push(cur);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(arr.slice(-20)));
  }catch(e){}
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function sendBody(body){
  let bytes = body.length;
  try{ bytes = new TextEncoder().encode(body).length; }catch(e){}
  const r = await fetch(CONFIG.functionPath, {
    method:"POST", headers:{"Content-Type":"application/json"}, body,
    /* keepalive lets the request finish if the tab closes */
    keepalive: bytes < KEEPALIVE_MAX_BYTES
  });
  if(!r.ok){
    const detail = await r.text().catch(() => "");
    throw new Error("function " + r.status + (detail ? ": " + detail : ""));
  }
  return "function";
}

function completedCaseCount(resp){
  return Object.values((resp && resp.cases) || {}).filter(r => r && r.final).length;
}
function firstPlanCount(resp){
  return Object.values((resp && resp.cases) || {}).filter(r => r && r.first).length;
}

/* Save a full checkpoint. Returns "function" if the server has this
   checkpoint (or a newer one), otherwise null. The body is frozen when
   the call is made, so later edits to the live record do not leak into
   a retry of an older checkpoint. */
async function checkpointResponse(resp, reason){
  if(!resp || !resp.pid) return null;
  resp.saveSeq = (resp.saveSeq || 0) + 1;
  resp.clientSavedAt = new Date().toISOString();
  resp.saveReason = reason || "checkpoint";
  resp.casesCompleted = completedCaseCount(resp);
  resp.firstPlans = firstPlanCount(resp);
  resp.status = resp.done ? "complete" : "in_progress";
  saveLocalIfCurrent(resp);
  if(CONFIG.storage === "local") return null;       // single-file bundle: no server

  const seq = resp.saveSeq;
  const body = JSON.stringify(resp);
  let lastErr = null;
  for(let i = 0; i < RETRY_WAITS_MS.length; i++){
    if(RETRY_WAITS_MS[i]) await sleep(RETRY_WAITS_MS[i]);
    /* a newer checkpoint already reached the server: it holds everything this one did */
    if(i > 0 && (resp.lastServerSeq || 0) >= seq) return "function";
    try{
      await sendBody(body);
      if(seq >= (resp.lastServerSeq || 0)){
        resp.lastServerSeq = seq;
        resp.lastServerSaveOK = true;
        resp.lastServerSaveError = null;
      }
      saveLocalIfCurrent(resp);
      console.info("Checkpoint saved", {pid:resp.pid, reason, seq, try:i+1});
      return "function";
    }catch(e){
      lastErr = e;
      console.warn("Checkpoint try failed", {pid:resp.pid, reason, seq, try:i+1, error:String(e && e.message || e)});
    }
  }
  if(seq >= (resp.lastServerSeq || 0)){
    resp.lastServerSaveOK = false;
    resp.lastServerSaveError = String(lastErr && lastErr.message ? lastErr.message : lastErr);
  }
  saveLocalIfCurrent(resp);
  console.error("Checkpoint save failed", {pid:resp.pid, reason, seq, error:lastErr});
  return null;
}

/* Final submission uses the same server path as checkpoints. */
async function submitResponse(resp, reason){
  return checkpointResponse(resp, reason || "finish");
}

/* results view: read everything back from the function */
async function fetchResponses(key){
  try{
    const r = await fetch(CONFIG.functionPath + "?key=" + encodeURIComponent(key || ""));
    if(!r.ok){
      const j = await r.json().catch(() => ({}));
      return {ok:false, rows:[], why:"status " + r.status + (j.error ? " — " + j.error : "")};
    }
    const j = await r.json();
    return {ok:true, rows: j.responses || []};
  }catch(e){ return {ok:false, rows:[], why:"no function on this host"}; }
}

/* When two copies of the same PID exist (server, import, device), keep
   the better one: a finished record beats an unfinished one, then the
   higher saveSeq wins. On a tie the copy seen first is kept. */
function betterRecord(a, b){
  if(!a) return b; if(!b) return a;
  if(!!a.done !== !!b.done) return a.done ? a : b;
  const sa = Number(a.saveSeq || 0), sb = Number(b.saveSeq || 0);
  return sb > sa ? b : a;
}
function mergeRecords(...lists){
  const m = new Map();
  lists.flat().forEach(r => { if(r && r.pid) m.set(r.pid, betterRecord(m.get(r.pid), r)); });
  return [...m.values()];
}

/* responses the researcher pasted or imported, kept in this browser */
const IMPORT_KEY = "inbasket_imported_v2";
function importedRows(){
  try{ return JSON.parse(localStorage.getItem(IMPORT_KEY) || "[]"); }catch(e){ return []; }
}
function addImported(rows){
  const merged = mergeRecords(importedRows(), rows);
  try{ localStorage.setItem(IMPORT_KEY, JSON.stringify(merged)); }catch(e){}
  return merged.length;
}
function clearImported(){ try{ localStorage.removeItem(IMPORT_KEY); }catch(e){} }

/* browser download, no capability needed */
function downloadFile(name, text, type){
  const blob = new Blob([text], {type: type || "text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
