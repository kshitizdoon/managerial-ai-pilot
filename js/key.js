/* =============================================================
   key.js — the scoring key. Never shown to anyone.

   Every decision scores all four actions from 0 to 20. Each decision
   has exactly one 20, its preferred action. A case score is the sum of
   its five decision scores, 0 to 100. The AI advice is scored the same
   way. Scores are expert-judgment proposals from the 8 October 2026
   manual, not validated estimates.

   checkKey() in scoring.js checks at load: four scores per decision,
   each 0-20, one unique 20, and at most two preferred Own decisions
   per caselet (a design safeguard, not a respondent quota).
   ============================================================= */

window.KEY = {
 3: { // Monday Project Team
    escalation:     {own:15, delegate:20, wait:0, hold:3},
    expansion:      {own:4, delegate:5, wait:10, hold:20},
    recommendation: {own:20, delegate:14, wait:0, hold:3},
    recovery:       {own:20, delegate:14, wait:0, hold:4},
    career:         {own:11, delegate:5, wait:20, hold:0}},

 2: { // Strong Employee
    presentation:   {own:20, delegate:14, wait:0, hold:4},
    funding:        {own:4, delegate:4, wait:11, hold:20},
    partner:        {own:14, delegate:20, wait:5, hold:0},
    appointment:    {own:20, delegate:10, wait:0, hold:5},
    review:         {own:11, delegate:5, wait:20, hold:0}},

 5: { // Fest Week
    registration:   {own:20, delegate:14, wait:0, hold:4},
    sponsor:        {own:14, delegate:5, wait:11, hold:20},
    staffing:       {own:14, delegate:20, wait:0, hold:4},
    venue:          {own:4, delegate:4, wait:10, hold:20},
    programming:    {own:11, delegate:5, wait:20, hold:0}},

 4: { // Friday Support Team
    escalation:     {own:20, delegate:14, wait:0, hold:4},
    weekend:        {own:13, delegate:20, wait:0, hold:5},
    guarantee:      {own:4, delegate:4, wait:11, hold:20},
    process:        {own:11, delegate:5, wait:20, hold:0},
    recovery:       {own:14, delegate:20, wait:0, hold:5}},

 1: { // Launch Morning
    corporate:      {own:20, delegate:14, wait:0, hold:4},
    announcement:   {own:14, delegate:20, wait:0, hold:4},
    readiness:      {own:4, delegate:4, wait:10, hold:20},
    trainers:       {own:14, delegate:20, wait:0, hold:4},
    roles:          {own:11, delegate:5, wait:20, hold:0}},

 6: { // Day Before Travel
    client:         {own:20, delegate:14, wait:0, hold:4},
    handover:       {own:14, delegate:20, wait:0, hold:4},
    opportunity:    {own:4, delegate:5, wait:10, hold:20},
    development:    {own:11, delegate:5, wait:20, hold:0},
    review:         {own:12, delegate:20, wait:7, hold:0}}
};
