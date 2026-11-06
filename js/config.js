/* =============================================================
   config.js — the knobs. Change these first; nothing else needs editing.
   ============================================================= */

window.CONFIG = {

  /* ---- AI advice ---------------------------------------------------------
     Every caselet has advice at four quality levels (cases.js). Each
     respondent is given one of four conditions at random, and the
     condition rotates the levels across the five caselets: caselet i (in
     cases.js order) gets level (i + condition) mod 4. So every respondent
     sees all four levels, one of them twice, and across the four
     conditions every caselet appears at every level exactly once.
     ?ai=0 .. ?ai=3 in the link forces a condition, for testing.          */
  aiConditions: 4,

  /* ---- Name and mobile -------------------------------------------------
     "end"   asked on the last screen, for the prize draw.  (default)
     "start" asked on the first screen, before any decision is made.
     "off"   not asked at all.
     Default is "end" on purpose: a managerial-judgement task carrying the
     respondent's name is answered more carefully and more conventionally,
     and that lands in the outcome you are measuring.                       */
  contactAt: "end",

  /* ---- Fielding -------------------------------------------------------- */
  randomiseCaseOrder: true,       // order of the five caselets
  randomiseDecisionOrder: false,  // order of the four decisions: as numbered in the manual

  /* ---- Where responses go ---------------------------------------------
     Netlify Function + Blobs is the only server store. The survey saves
     at Start, after every caselet's first answers, after every caselet's
     final answers, and at Finish, and retries failed saves.
     localStorage is a browser backup.
     "local" (set by build.py for the single-file bundle) skips the server. */
  storage: "function",
  functionPath: "/api/responses",
  evaluatorPath: "/api/evaluator",

  /* ---- Consent ---------------------------------------------------------
     Stamped on every new Producer record. Version 2 is the first welcome
     text that says decisions may be shown, anonymously, to other
     participants for rating. Part 2 (the Evaluator stage) only shows
     Producers with version 2 or later, unless the researcher sets
     EVALUATOR_INCLUDE_LEGACY_CONSENT=1 in Netlify after approval.
     Version 3 is the short welcome text of November 2026; it keeps that
     sentence.                                                            */
  consentVersion: 3,

  /* The results view is at  yoursite.netlify.app/#researcher=KEY
     KEY is the DASHBOARD_KEY environment variable in Netlify. Keep it
     there only. Do not write it in this file: every visitor can read it,
     and the records hold names and mobile numbers.                       */

  /* ---- Instrument version ---------------------------------------------
     A name for this version of the cases, key and scoring. It is stamped,
     with automatic fingerprints of cases.js and key.js, on every new
     response and never changed afterwards. Give it a new name whenever
     you edit cases.js, key.js or the scoring, so responses collected
     under different versions can be told apart.                          */
  instrumentVersion: "survey-2026-11-5x4",

  /* ---- Copy ------------------------------------------------------------ */
  studyTitle: "Managerial Decision Survey",
  debrief: "The AI advisor here was not a live AI tool. We wrote its recommendations, and their quality was varied on purpose. That is how we study the way people use AI advice."
};
