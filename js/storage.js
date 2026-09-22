/* =============================================================
   storage.js — where responses go, in order of preference.

   1. POST to the Netlify function (live results view). Needs the
      netlify/ folder deployed, which needs a git or CLI deploy.
   2. POST to a Netlify form (works on a drag-and-drop deploy).
      Results appear under Forms in the Netlify UI; export the CSV
      and import it in the results view.
   3. The browser. Always. The last screen shows the participant a
      block of text to send you if 1 and 2 both failed.
   ============================================================= */

const LS_KEY = "inbasket_pilot_v2";

function loadLocal(){
  try{ const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; }
  catch(e){ return null; }
}
function saveLocal(obj){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(obj)); }catch(e){}
}
function clearLocal(){ try{ localStorage.removeItem(LS_KEY); }catch(e){} }

async function sendToFunction(resp){
  const r = await fetch(CONFIG.functionPath, {
    method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(resp)
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

/* Save a full checkpoint to the single authoritative server store.
   Each checkpoint replaces the same PID record, so it never creates
   duplicate respondents. saveSeq protects against an older, slower request
   arriving after a newer one. localStorage remains a browser-side backup. */
async function checkpointResponse(resp, reason){
  if(!resp || !resp.pid) return null;
  resp.saveSeq = (resp.saveSeq || 0) + 1;
  resp.clientSavedAt = new Date().toISOString();
  resp.saveReason = reason || "checkpoint";
  resp.casesCompleted = completedCaseCount(resp);
  resp.status = resp.done ? "complete" : "in_progress";
  saveLocal(resp);
  try{
    const how = await sendToFunction(resp);
    resp.lastServerSaveOK = true;
    resp.lastServerSaveError = null;
    resp.savedVia = how;
    saveLocal(resp);
    console.info("Checkpoint saved", {pid:resp.pid, reason:resp.saveReason, casesCompleted:resp.casesCompleted, saveSeq:resp.saveSeq});
    return how;
  }catch(e){
    resp.lastServerSaveOK = false;
    resp.lastServerSaveError = String(e && e.message ? e.message : e);
    saveLocal(resp);
    console.error("Checkpoint save failed", {pid:resp.pid, reason:resp.saveReason, error:e});
    return null;
  }
}

/* Final submission uses the same server path as checkpoints. */
async function submitResponse(resp){
  return checkpointResponse(resp, "finish");
}

/* results view: read everything back from the function */
async function fetchResponses(key){
  try{
    const r = await fetch(CONFIG.functionPath + "?key=" + encodeURIComponent(key || ""));
    if(!r.ok) return {ok:false, rows:[], why:"status " + r.status};
    const j = await r.json();
    return {ok:true, rows: j.responses || []};
  }catch(e){ return {ok:false, rows:[], why:"no function on this host"}; }
}

/* responses the researcher pasted or imported, kept in this browser */
const IMPORT_KEY = "inbasket_imported_v2";
function importedRows(){
  try{ return JSON.parse(localStorage.getItem(IMPORT_KEY) || "[]"); }catch(e){ return []; }
}
function addImported(rows){
  const have = importedRows();
  const ids = new Set(have.map(r=>r.pid));
  rows.forEach(r => { if(r && r.pid && !ids.has(r.pid)){ have.push(r); ids.add(r.pid); } });
  try{ localStorage.setItem(IMPORT_KEY, JSON.stringify(have)); }catch(e){}
  return have.length;
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
