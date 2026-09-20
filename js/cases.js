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
   6  EQUAL WEIGHT. Every card 28-45 words. One clearly low-stakes issue
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
  opening: "It is 9:30 AM and you are the launch manager for a new consumer product in Bengaluru. The launch starts at 11:00 AM.",
  role: "Launch manager, new consumer product",
  issues: [
    {k:"supplier",  n:"Supplier",
     t:"Today's shipment will arrive 15% short of the confirmed quantity, and the missing units cannot reach the warehouse before tomorrow. The supplier has to be told what we now expect, and today's dispatch re-planned around the smaller stock."},
    {k:"retailer",  n:"Key retailer",
     t:"A key retailer wants 400 extra units delivered by noon for a promotion running today. The warehouse can release at most 180 before the launch. The revised number has to be agreed with the retailer this morning."},
    {k:"marketing", n:"Marketing",
     t:"Marketing wants \u20b92 lakh added to today's advertising and needs a yes or no. The campaign is already live at the agreed spend, and the booking can be changed or cancelled without penalty until 5:00 PM."},
    {k:"quality",   n:"Quality",
     t:"Two batches show a mismatch between the warehouse label and the quality record. Whether those units meet specification will not be known until the batch records are pulled. Both batches are on the 11:00 AM dispatch list."},
    {k:"ops",       n:"Operations",
     t:"The dispatch supervisor wants to skip the final pre-dispatch check to save 40 minutes and has asked for a decision before loading starts. The check is required under the standard dispatch procedure."}],
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
  opening: "It is 8:50 AM and you manage a 10-person analytics team. A major client presentation is tomorrow.",
  role: "Manager, 10-person analytics team",
  issues: [
    {k:"client",  n:"Client",
     t:"Two recent deliverables went out with avoidable errors. The client has asked in writing what went wrong, has copied the partner on the account, and wants a reply before 11:00 AM."},
    {k:"ananya",  n:"Ananya",
     t:"Ananya, one of your strongest performers, has missed two deadlines this month. Sara has asked whether to move part of her work to someone else before tomorrow. Nobody has yet looked at what is on her plate."},
    {k:"finance", n:"Finance",
     t:"The project is 6% over budget and finance needs a written explanation by 4:00 PM. If it misses the cut-off, this month's invoice to the client is held back until the next cycle."},
    {k:"data",    n:"Data discrepancy",
     t:"One number in tomorrow's presentation does not match the source file. Someone has to work out whether the slide or the source is wrong and correct it before the deck is locked tonight."},
    {k:"partner", n:"Partner request",
     t:"A partner has asked for a two-page note on a new market by 5:00 PM today. It feeds a proposal that goes out at the end of next month."}],
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
  opening: "It is 9:00 AM on Monday. You lead a 12-person consulting project team, formed after last year's engagement for this client ended.",
  role: "Lead, 12-person consulting project team",
  issues: [
    {k:"analysis",  n:"Client analysis",
     t:"A client wants a revised cost analysis by 1:00 PM today. It has to use the assumptions agreed with the client during last year's engagement, which were never written down. You ran that engagement."},
    {k:"dashboard", n:"Live dashboard",
     t:"A number on a client-facing dashboard looks wrong. Someone has to work out whether the error is in the source data or in the dashboard calculation, and correct it today."},
    {k:"hires",     n:"New hires",
     t:"Two people join next week. Their joining documents and IT access have to be raised by 6:00 PM today, or their first day moves back by a week."},
    {k:"event",     n:"Team event",
     t:"Friday's team event needs an agenda circulated to the team before Thursday. The venue and the speakers are already confirmed and paid for."},
    {k:"software",  n:"Software",
     t:"A \u20b93 lakh annual software subscription renews in two weeks and finance wants a renew-or-cancel decision from you. How many people still use it is not recorded anywhere; pulling the usage data takes a day."}],
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
  opening: "It is 3:00 PM on Friday and you lead a 20-person customer support team.",
  role: "Lead, 20-person customer support team",
  issues: [
    {k:"complaint", n:"Customer complaint",
     t:"One of your two largest clients says an agent in Meher's pod was rude on yesterday's call. The call was recorded and nobody has listened to it yet. The client expects a reply from you today."},
    {k:"warning",   n:"Formal warning", after:["complaint"],
     t:"Meher has asked you to approve a written warning for that agent today, on the strength of the client's account alone. A written warning stays on the employee's record and cannot be withdrawn."},
    {k:"overtime",  n:"Overtime",
     t:"This month's overtime claims must be submitted by 5:00 PM and three entries do not match the shift records. Missing the cut-off delays payment to those agents by one month."},
    {k:"meeting",   n:"Client meeting",
     t:"A client asks to move Monday's review meeting to Tuesday. Tuesday works for the team, though one project lead cannot attend and would have to send written notes instead."},
    {k:"shifts",    n:"Shift schedule",
     t:"Three shifts next week have been double-booked and the roster has to be corrected before Monday morning. The agents affected have already been told there is a clash."}],
  people: [["meher","Meher","Team leader \u2014 runs one of the four support pods"],
           ["ashok","Ashok","Workforce planner \u2014 owns the rostering system and shift allocation"],
           ["zoya","Zoya","Payroll coordinator \u2014 processes overtime claims and monthly payroll"],
           ["karan","Karan","Account manager \u2014 handles the relationship with the two largest clients"]],
  ai: {
    B:{own:"complaint", del:{overtime:"zoya", shifts:"ashok"}, wait:"meeting", hold:"warning",
       why:"Take the complaint yourself and listen to the recording before anything else happens; the person who raised it also runs the agent's pod. Approve no warning until you have heard the call, because it cannot be withdrawn. Zoya can clear the claims and Ashok can fix the roster."},
    A:{own:"warning", del:{complaint:"meher", overtime:"zoya"}, wait:"shifts", hold:"meeting",
       why:"Approve the warning today. Acting in the same week shows the client that standards are enforced, and Meher is closest to what happened. Zoya can clear the overtime claims before 5 PM. The roster clash can be picked up on Monday, and the meeting move needs the project lead's view first."}}
},

{
  id: 5, name: "Fest week", goodVersion: "A",
  opening: "It is 10:00 AM on Monday. You head the student organising committee for your institute's annual fest, which opens in three weeks.",
  role: "Head of the fest organising committee",
  issues: [
    {k:"drop",        n:"Registrations",
     t:"Registrations from one large partner campus are 22% below last year. A rival fest moved to the same weekend, and your coordinator on that campus quit in the same week. \u20b91.5 lakh of publicity budget is unspent and the committee wants your decision on where it goes."},
    {k:"sponsor",     n:"Sponsor fee",
     t:"Your largest sponsor asks for a 10% cut in their fee and wants an answer this week. The fee is tied to expected footfall, and registrations do not close for another week. Whatever rate you agree holds for the next two fests."},
    {k:"diagnosis",   n:"Registration data", after:["drop"],
     t:"A campus-by-campus pull of two years of registration history would show whether the drop tracks the rival fest's dates or the coordinator's exit. It takes two days of work and nobody has started it."},
    {k:"coordinator", n:"New coordinator", after:["drop"],
     t:"A replacement coordinator for that campus starts in two weeks and her induction plan needs sign-off before she begins. The plan itself has already been drafted."},
    {k:"travel",      n:"Travel money",
     t:"A volunteer team asks for \u20b930,000 to visit two partner campuses next week. The amount sits inside a budget line that is already approved for campus outreach."}],
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
  opening: "It is 9:00 AM on Thursday. You lead a 15-person operations team and you leave tomorrow morning for a three-day site visit.",
  role: "Lead, 15-person operations team",
  issues: [
    {k:"form",     n:"Compliance form",
     t:"A compliance form is due on Friday and the authority to sign it sits with the unit head personally, which is you. A late filing is reported to the regulator and carries a penalty."},
    {k:"customer", n:"Customer escalation",
     t:"A mid-size B2B customer has escalated twice this month about response times and wants a call back today. Their contract comes up for renewal next quarter."},
    {k:"panel",    n:"Interview panel",
     t:"Tomorrow's interview panel is one member short and HR needs a name before the end of today. The candidates have already been told the panel's timing."},
    {k:"supplier", n:"Supplier offer",
     t:"A supplier offers 5% off list price for a two-year commitment and the offer stays open for a month. Next year's volumes are fixed in the annual plan the board approves at the end of this month."},
    {k:"report",   n:"Monthly report",
     t:"The monthly operations report is due in ten days. Every number it needs is already in the reporting pack and nothing else depends on it."}],
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
