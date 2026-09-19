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
  if(!r.ok) throw new Error("function " + r.status);
  return "function";
}

async function sendToForm(resp){
  const body = new URLSearchParams({
    "form-name": CONFIG.formName,
    "pid": resp.pid,
    "version": resp.version,
    "defer_mode": resp.deferMode || CONFIG.deferMode,
    "payload": JSON.stringify(resp)
  }).toString();
  const r = await fetch("/", { method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"}, body });
  if(!r.ok) throw new Error("form " + r.status);
  return "form";
}

/* returns the channel that worked, or null */
async function submitResponse(resp){
  saveLocal(resp);
  const tries = [];
  if(CONFIG.storage === "auto" || CONFIG.storage === "function") tries.push(sendToFunction);
  if(CONFIG.storage === "auto" || CONFIG.storage === "form") tries.push(sendToForm);
  for(const t of tries){
    try{ const how = await t(resp); return how; }catch(e){ /* try the next one */ }
  }
  return null;
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
