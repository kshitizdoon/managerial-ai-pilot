/* =============================================================
   cases.js — everything respondents read.

   Six rules hold the six cases together. Break one and the key stops
   meaning anything. The page checks what it can at load.

   1  ONE SITUATION LINE. Time, your role, and the one horizon fact the
      key depends on. Nothing else above the cards.
   2  TWO SOURCES. No card states both a fact and what it implies. Who
      is good at what lives in the roster; what happened lives on the
      card. The respondent joins the two.
   3  EVERY CARD SAYS THREE THINGS: what happened, what is being asked
      of you now, and the constraint (deadline, cost of delay, or what
      is not known). The task is clear. The priority is not.
   4  ROSTER = FOUR OF YOUR OWN PEOPLE, title plus a one-line remit. No
      performance history, no "has handled this before". Every roster
      member must plausibly fit at least two issues.
   5  NO LABEL WORDS on cards: never "urgent", "can wait", "delegate",
      "check first", "handle yourself".
   6  EQUAL WEIGHT. Every card 18-40 words. One clearly low-stakes issue
      per case is deliberate, not a flaw.
   ============================================================= */

/* Case-level order. The six situations are six different organisations,
   with different people, different days and no shared timeline, so none
   has to follow another and all six stay fully randomised. If that ever
   changes, add {laterCaseId: [earlierCaseId, ...]} here and order.js
   will enforce it. */
window.CASE_AFTER = {};

window.CASES = [
{
  id: 1, name: "Launch morning", goodVersion: "A",
  opening: "It is 9:30 AM. You manage a new product launch in Bengaluru, starting at 11:00 AM.",
  role: "Launch manager, new consumer product",
  issues: [
    {k:"supplier",  n:"Supplier",
     t:"Today's shipment is 15% short and the missing units cannot arrive before tomorrow. Someone has to update the supplier and re-plan today's dispatch around the smaller stock."},
    {k:"retailer",  n:"Key retailer",
     t:"A key retailer wants 400 extra units by noon for today's promotion. At most 180 can leave the warehouse before the launch; the revised number needs agreeing this morning."},
    {k:"marketing", n:"Marketing",
     t:"Marketing wants a yes or no on adding \u20b92 lakh to today's advertising. The campaign is already live, and the booking can be changed without penalty until 5:00 PM."},
    {k:"quality",   n:"Quality",
     t:"Two batches' warehouse labels do not match their quality records. Whether they meet specification is unknown until the batch records are pulled; both are on the 11:00 AM dispatch list."},
    {k:"ops",       n:"Operations",
     t:"The dispatch supervisor wants to skip the final pre-dispatch check to save 40 minutes, and wants a decision before loading starts. Standard procedure requires the check."}],
  people: [["arjun","Arjun","Logistics manager \u2014 inbound shipments and dispatch scheduling"],
           ["priya","Priya","Key accounts manager \u2014 single point of contact for the large retailers"],
           ["meera","Meera","Quality manager \u2014 signs off pre-dispatch checks, keeps the batch records"],
           ["kabir","Kabir","Marketing manager \u2014 runs the launch campaign and its budget"]],
  ai: {
    A:{own:"ops", del:{supplier:"arjun", retailer:"priya"}, wait:"marketing", hold:"quality",
       why:"Answer the dispatch supervisor yourself and keep the required check. Nothing from those two batches should move until the records are pulled. Arjun can re-plan around the short shipment and Priya can settle the revised number with the retailer. The advertising decision costs nothing before 5 PM."},
    B:{own:"retailer", del:{supplier:"arjun", marketing:"kabir"}, wait:"quality", hold:"ops",
       why:"The retailer promotion is running today, so take that conversation yourself and protect the launch. Arjun can handle the short shipment and Kabir can release the extra spend while the campaign is live. The label mismatch can be reconciled after dispatch, once the morning is clear."}}
},

{
  id: 2, name: "Strong employee", goodVersion: "B",
  opening: "It is 8:50 AM. You manage a 10-person analytics team; a major client presentation is tomorrow.",
  role: "Manager, 10-person analytics team",
  issues: [
    {k:"client",  n:"Client",
     t:"Two recent deliverables had avoidable errors. The client has asked in writing what went wrong, copied the partner, and wants a reply before 11:00 AM."},
    {k:"ananya",  n:"Ananya",
     t:"Ananya, a strong performer, has missed two deadlines this month. Sara asks whether to move some of her work before tomorrow; nobody has looked at her workload."},
    {k:"finance", n:"Finance",
     t:"The project is 6% over budget. Finance needs a written explanation by 4:00 PM, or this month's client invoice slips to the next cycle."},
    {k:"data",    n:"Data discrepancy",
     t:"One number in tomorrow's presentation does not match its source file. Someone must find which is wrong and fix it before the deck locks tonight."},
    {k:"partner", n:"Partner request",
     t:"A partner wants a two-page market note by 5:00 PM, for a proposal going out at the end of next month."}],
  people: [["riya","Riya","Engagement manager \u2014 your deputy on client-facing work and client communication"],
           ["mehul","Mehul","Senior analyst \u2014 builds and checks the numbers behind the deliverables"],
           ["varun","Varun","Project finance analyst \u2014 budgets, billing and cost explanations"],
           ["sara","Sara","Team operations lead \u2014 staffing, workload allocation and leave"]],
  ai: {
    B:{own:"client", del:{data:"mehul", finance:"varun"}, wait:"partner", hold:"ananya",
       why:"Reply to the client yourself; the partner is copied and the errors are yours to explain. Mehul can settle the number before the deck is locked and Varun can write the budget explanation. Decide nothing about Ananya's work until somebody has actually looked at what she is carrying."},
    A:{own:"ananya", del:{client:"riya", finance:"varun"}, wait:"data", hold:"partner",
       why:"Speak to Ananya yourself and take work off her before tomorrow; a strong performer under strain is worth protecting. Riya can reply to the client and Varun can write the budget explanation. The presentation number can be reconciled tomorrow, and the market note needs more input first."}}
},

{
  id: 3, name: "Monday project team", goodVersion: "A",
  opening: "It is 9:00 AM on Monday. You lead a 12-person consulting team, formed after last year's engagement for this client ended.",
  role: "Lead, 12-person consulting project team",
  issues: [
    {k:"analysis",  n:"Client analysis",
     t:"The client wants a revised cost analysis by 1:00 PM, built on assumptions agreed in last year's engagement and never written down. You ran that engagement."},
    {k:"dashboard", n:"Live dashboard",
     t:"A number on a client-facing dashboard looks wrong. Someone must trace whether the data or the calculation is at fault and fix it today."},
    {k:"hires",     n:"New hires",
     t:"Two people join next week. Their documents and IT access must be raised by 6:00 PM today, or their start slips a week."},
    {k:"event",     n:"Team event",
     t:"Friday's team event needs an agenda circulated before Thursday. The venue and speakers are confirmed and paid for."},
    {k:"software",  n:"Software",
     t:"A \u20b93 lakh annual software subscription renews in two weeks; finance wants your renew-or-cancel call. Usage is not recorded, and pulling it takes a day."}],
  people: [["tara","Tara","Consultant \u2014 joined this client account two weeks ago"],
           ["imran","Imran","Data engineer \u2014 owns the team's dashboards and data pipelines"],
           ["neel","Neel","Team administrator \u2014 joining formalities, IT access, vendor paperwork"],
           ["maya","Maya","Business analyst \u2014 floats across projects, currently between assignments"]],
  ai: {
    A:{own:"analysis", del:{dashboard:"imran", hires:"neel"}, wait:"event", hold:"software",
       why:"Write the client analysis yourself. The assumptions were never written down and nobody now on the team was on last year's engagement, so handing it over cannot meet 1 PM. Imran can trace the dashboard error and Neel can raise the joining paperwork. Give finance no answer on the subscription until the usage data is in."},
    B:{own:"dashboard", del:{hires:"neel", software:"maya"}, wait:"event", hold:"analysis",
       why:"Fix the dashboard yourself first; a wrong number is sitting in front of the client right now. Neel can raise the joining paperwork and Maya can take the renewal decision to finance. The revised analysis should wait until the client confirms the assumptions it has to use."}}
},

{
  id: 4, name: "Friday support team", goodVersion: "B",
  opening: "It is 3:00 PM on Friday. You lead a 20-person support team.",
  role: "Lead, 20-person customer support team",
  issues: [
    {k:"complaint", n:"Customer complaint",
     t:"A major client says an agent in Meher's pod was rude on yesterday's call. Nobody has heard the recording; the client expects your reply today."},
    {k:"warning",   n:"Formal warning", after:["complaint"],
     t:"Meher asks you to approve a written warning for that agent today, on the client's account alone. It would stay on the employee's record and cannot be withdrawn."},
    {k:"overtime",  n:"Overtime",
     t:"Overtime claims are due at 5:00 PM and three entries do not match the shift records. Missing the cut-off delays those agents' pay by a month."},
    {k:"meeting",   n:"Client meeting",
     t:"A client asks to move Monday's review to Tuesday. That suits the team, though one project lead would have to send notes."},
    {k:"shifts",    n:"Shift schedule",
     t:"Three shifts next week are double-booked; the roster must be fixed before Monday. Affected agents already know."}],
  people: [["meher","Meher","Team leader \u2014 runs one of the four support pods"],
           ["ashok","Ashok","Workforce planner \u2014 owns the rostering system and shift allocation"],
           ["zoya","Zoya","Payroll coordinator \u2014 processes overtime claims and monthly payroll"],
           ["karan","Karan","Account manager \u2014 handles the relationship with the two largest clients"]],
  ai: {
    B:{own:"complaint", del:{overtime:"zoya", shifts:"ashok"}, wait:"meeting", hold:"warning",
       why:"Take the complaint yourself and listen to the recording before anything else happens; the person asking for the warning also runs the agent's pod. Approve no warning until you have heard the call, because it cannot be withdrawn. Zoya can clear the claims and Ashok can fix the roster."},
    A:{own:"warning", del:{complaint:"meher", overtime:"zoya"}, wait:"shifts", hold:"meeting",
       why:"Approve the warning today. Acting in the same week shows the client that standards are enforced, and Meher is closest to what happened. Zoya can clear the overtime claims before 5 PM. The roster clash can be picked up on Monday, and the meeting move needs the project lead's view first."}}
},

{
  id: 5, name: "Fest week", goodVersion: "A",
  opening: "It is 10:00 AM on Monday. You head your institute's fest committee; the fest opens in three weeks.",
  role: "Head of the fest organising committee",
  issues: [
    {k:"drop",        n:"Registrations",
     t:"Registrations from one partner campus are 22% below last year. A rival fest moved to your weekend, and your coordinator there quit that week. The committee wants your call on the last \u20b91.5 lakh of publicity."},
    {k:"sponsor",     n:"Sponsor fee",
     t:"Your largest sponsor wants a 10% fee cut, answered this week. The fee is tied to expected footfall and registrations close next week. Any rate agreed holds for the next two fests."},
    {k:"diagnosis",   n:"Registration data", after:["drop"],
     t:"Two years of campus-level registration data would show whether the drop tracks the rival fest or the coordinator's exit. Pulling it takes two days; nobody has started."},
    {k:"coordinator", n:"New coordinator", after:["drop"],
     t:"A replacement coordinator for that campus starts in two weeks. Her induction plan is drafted and needs sign-off before she begins."},
    {k:"travel",      n:"Travel money",
     t:"Volunteers ask for \u20b930,000 to visit two partner campuses next week, from a budget line already approved for campus outreach."}],
  people: [["prakash","Prakash","Registrations and analytics \u2014 keeps the registration data"],
           ["sonia","Sonia","Volunteer coordinator \u2014 recruits and schedules the volunteer teams"],
           ["imtiaz","Imtiaz","Sponsorship lead \u2014 negotiates and signs the sponsor agreements"],
           ["kavita","Kavita","Finance and logistics \u2014 budget, vendor payments, venue bookings"]],
  ai: {
    A:{own:"drop", del:{diagnosis:"prakash", travel:"kavita"}, wait:"coordinator", hold:"sponsor",
       why:"Decide the publicity spend yourself; two causes are tangled together and the money is committed once. Prakash can pull the registration history and Kavita can release the travel money from the approved line. Agree no sponsor rate this week, because it locks the next two fests to a footfall nobody has estimated."},
    B:{own:"sponsor", del:{drop:"imtiaz", travel:"kavita"}, wait:"diagnosis", hold:"coordinator",
       why:"Close the sponsor yourself this week. Registrations are down, so a committed sponsor is worth more than the 10%, and the relationship carries into the next two fests. Imtiaz can work the weak campus and Kavita can clear the travel. The history pull and the induction plan can both come later."}}
},

{
  id: 6, name: "Day before travel", goodVersion: "B",
  opening: "It is 9:00 AM on Thursday. You lead a 15-person operations team and leave tomorrow for a three-day site visit.",
  role: "Lead, 15-person operations team",
  issues: [
    {k:"form",     n:"Compliance form",
     t:"A compliance form is due Friday, and the authority to sign it sits with the unit head personally: you. Late filing draws a regulatory penalty."},
    {k:"customer", n:"Customer escalation",
     t:"A mid-size B2B customer has escalated twice this month over response times and wants a call today. Their contract renews next quarter."},
    {k:"panel",    n:"Interview panel",
     t:"Tomorrow's interview panel is one member short and HR needs a name today. Candidates already have the timings."},
    {k:"supplier", n:"Supplier offer",
     t:"A supplier offers 5% off for a two-year commitment, open for a month. Next year's volumes are set in the annual plan the board approves at month end."},
    {k:"report",   n:"Monthly report",
     t:"The monthly report is due in ten days. Its numbers are all in the reporting pack, and nothing depends on it."}],
  people: [["harish","Harish","Service lead \u2014 owns escalations from mid-size accounts"],
           ["naina","Naina","Recruitment manager \u2014 runs the hiring process and sits on interview panels"],
           ["bhavna","Bhavna","Finance analyst \u2014 cost analyses and the monthly reporting pack"],
           ["omar","Omar","Operations manager at your level \u2014 covers for you when you travel"]],
  ai: {
    B:{own:"form", del:{customer:"harish", panel:"naina"}, wait:"report", hold:"supplier",
       why:"Sign the form today. Nobody else holds that authority and you are away when it falls due. Harish can call the customer back and Naina can complete the panel before HR closes the list. Commit to nothing on the supplier offer until the board fixes next year's volumes."},
    A:{own:"customer", del:{form:"bhavna", panel:"naina"}, wait:"supplier", hold:"report",
       why:"Call the customer yourself; a second escalation before a renewal needs to come from the manager. Bhavna can file the compliance form and Naina can complete the panel. The supplier offer is open for a month, and the report can sit until the month-end numbers are locked."}}
}
];
