/* =============================================================
   art.js — one small illustration per caselet, shown in its header.

   Same size, same flat style and the same five neutral colours for all
   six. They set the scene only: no picture belongs to a decision, and
   none of the four action colours is used, so nothing here can point
   at an answer. Colours come from the --art-* tokens in styles.css.
   ============================================================= */

window.ART = {
  /* Monday Project Team: a team at a table, a chart on the wall */
  consulting: `<svg viewBox="0 0 96 96" role="img" aria-hidden="true">
    <rect class="a0" width="96" height="96" rx="14"/>
    <rect class="a2" x="18" y="14" width="60" height="30" rx="3"/>
    <rect class="a3" x="26" y="30" width="7" height="9"/><rect class="a3" x="37" y="24" width="7" height="15"/>
    <rect class="a3" x="48" y="27" width="7" height="12"/><rect class="a3" x="59" y="20" width="7" height="19"/>
    <circle class="a4" cx="24" cy="58" r="6"/><circle class="a4" cx="48" cy="55" r="6"/><circle class="a4" cx="72" cy="58" r="6"/>
    <path class="a4" d="M15 74c0-6 4-9 9-9s9 3 9 9zM39 71c0-6 4-9 9-9s9 3 9 9zM63 74c0-6 4-9 9-9s9 3 9 9z"/>
    <rect class="a1" x="10" y="72" width="76" height="8" rx="3"/>
  </svg>`,

  /* Strong Employee: an analytics screen and a presentation */
  analytics: `<svg viewBox="0 0 96 96" role="img" aria-hidden="true">
    <rect class="a0" width="96" height="96" rx="14"/>
    <rect class="a1" x="14" y="18" width="68" height="44" rx="4"/>
    <rect class="a2" x="18" y="22" width="60" height="36" rx="2"/>
    <path class="a5" d="M22 50l12-10 10 6 12-14 16 8" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="a3" cx="56" cy="32" r="3"/>
    <rect class="a1" x="44" y="62" width="8" height="10"/><rect class="a1" x="32" y="72" width="32" height="5" rx="2"/>
  </svg>`,

  /* Fest Week: a stage with bunting */
  festival: `<svg viewBox="0 0 96 96" role="img" aria-hidden="true">
    <rect class="a0" width="96" height="96" rx="14"/>
    <circle class="a3" cx="74" cy="22" r="8"/>
    <path class="a5" d="M10 26q38 16 76 0" fill="none" stroke-width="1.5"/>
    <path class="a2" d="M18 29l5 9 4-7zM34 34l5 9 4-8zM52 35l4 9 5-8zM68 31l4 9 5-9z"/>
    <path class="a1" d="M16 80V54l32-14 32 14v26z"/>
    <path class="a2" d="M30 80V60h36v20z"/>
    <rect class="a4" x="10" y="80" width="76" height="4" rx="2"/>
  </svg>`,

  /* Friday Support Team: a headset and a laptop, in the evening */
  support: `<svg viewBox="0 0 96 96" role="img" aria-hidden="true">
    <rect class="a0" width="96" height="96" rx="14"/>
    <path class="a3" d="M76 14a10 10 0 1 0 6 18 12 12 0 0 1-6-18z"/>
    <rect class="a1" x="18" y="48" width="44" height="28" rx="3"/>
    <rect class="a2" x="22" y="52" width="36" height="20" rx="1"/>
    <rect class="a1" x="12" y="76" width="56" height="5" rx="2"/>
    <path class="a5" d="M58 44a14 14 0 0 1 28 0" fill="none" stroke-width="3.5" stroke-linecap="round"/>
    <rect class="a4" x="54" y="42" width="8" height="13" rx="3"/><rect class="a4" x="82" y="42" width="8" height="13" rx="3"/>
  </svg>`,

  /* Launch Morning: a new branch with an opening ribbon */
  fitness: `<svg viewBox="0 0 96 96" role="img" aria-hidden="true">
    <rect class="a0" width="96" height="96" rx="14"/>
    <rect class="a1" x="16" y="30" width="64" height="48" rx="2"/>
    <rect class="a2" x="12" y="22" width="72" height="10" rx="2"/>
    <rect class="a2" x="38" y="52" width="20" height="26"/>
    <rect class="a3" x="12" y="60" width="72" height="5"/>
    <path class="a3" d="M44 60l-6 12h6l4-6 4 6h6l-6-12z"/>
    <rect class="a4" x="24" y="38" width="12" height="4" rx="2"/><rect class="a4" x="21" y="36" width="4" height="8" rx="1"/><rect class="a4" x="35" y="36" width="4" height="8" rx="1"/>
  </svg>`,

  /* Day Before Travel: a suitcase, a plane and a clock */
  travel: `<svg viewBox="0 0 96 96" role="img" aria-hidden="true">
    <rect class="a0" width="96" height="96" rx="14"/>
    <path class="a4" d="M30 20l38 10-4 4-10-1-8 9-4-1 4-10-10-3-4 3-3-1 3-5-3-3 3-1z"/>
    <rect class="a1" x="18" y="46" width="40" height="34" rx="4"/>
    <rect class="s2" x="30" y="40" width="16" height="7" rx="2" stroke-width="3"/>
    <rect class="a2" x="26" y="46" width="4" height="34"/><rect class="a2" x="46" y="46" width="4" height="34"/>
    <circle class="a2" cx="72" cy="66" r="13"/><path class="a5" d="M72 58v8l6 4" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`
};
