/* =============================================================
   config.js — the knobs. Change these first; nothing else needs editing.
   ============================================================= */

window.CONFIG = {

  /* ---- How the deferral decision is asked ------------------------------
     "split"   1 Own, 2 Delegate, 1 Wait, 1 Hold.  (what you piloted)
     "merged"  1 Own, 2 Delegate, 2 Set aside, then ONE follow-up question:
               which of the two, if either, nobody should act on until a
               fact is checked.
     A participant can be sent to either mode with ?defer=merged in the link.
     The mode used is stored with every response.                          */
  deferMode: "split",

  /* ---- Scoring ---------------------------------------------------------
     unlistedDelegateScore: what a person who is not in the key's list for
     that issue scores. 0 is what your current key implies. 40 is gentler:
     nothing in Case 1 says Priya cannot chase the supplier.               */
  unlistedDelegateScore: 0,

  /* In "merged" mode the case score is (Own + Delegate + DeferSet) / 3.
     The hold follow-up is scored separately, not inside the case score.
     Set includeHoldInCaseScore true to fold it back in as a 4th part.     */
  includeHoldInCaseScore: false,

  /* ---- Name and mobile -------------------------------------------------
     "end"   asked on the last screen, for the prize draw.  (default)
     "start" asked on the first screen, before any decision is made.
     "off"   not asked at all.
     Default is "end" on purpose: a managerial-judgement task carrying the
     respondent's name is answered more carefully and more conventionally,
     and that lands in the outcome you are measuring.                       */
  contactAt: "end",

  /* ---- Fielding --------------------------------------------------------ies */
  randomiseCaseOrder: true,   // order of the six cases
  randomiseCardOrder: true,   // order of the five cards inside a case
  showPilotQuestions: true,   // the "help us fix the survey" block

  /* ---- Where responses go ---------------------------------------------
     Netlify Function + Blobs is the authoritative server store. The survey
     checkpoints after demographics, after every completed case, and at
     Finish. localStorage remains an additional browser-side backup.        */
  storage: "function",
  functionPath: "/api/responses",

  /* Anyone with this in the link can open the results view:
     yoursite.netlify.app/#researcher=KEY
     Set the same value as DASHBOARD_KEY in Netlify so the function will
     hand over the data. Change it before you field the study.             */
  dashboardKey: "change-me",

  /* ---- Copy ------------------------------------------------------------ */
  studyTitle: "Six managerial decisions",
  debrief: "The AI advisor here was not a live AI tool. We wrote its plans, and some of them were weak on purpose. That is how we study the way people use AI advice."
};
