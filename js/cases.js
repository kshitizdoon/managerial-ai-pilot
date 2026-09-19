/* =============================================================
   cases.js — what respondents read. Edit freely.

   Rules that keep the study clean, if you edit:
   - every issue needs an entry in key.js for own / wait / hold / delegate
   - keep the five issue texts close in length; the cards are equal size
   - context pills may only repeat facts from the opening line
   - the good and the bad AI plan should be about the same length
   The page checks the first two at load and logs a warning in the console.
   ============================================================= */

window.CASES = [
{
  id: 1, name: "Launch morning", goodVersion: "A",
  opening: "It is 9:30 AM. You manage the launch of a new consumer product in Bengaluru. The launch starts at 11:00 AM.",
  context: [["Now","9:30 AM"],["You","Launch manager"],["Where","Bengaluru"],["Launch","11:00 AM"]],
  issues: [
    {k:"supplier",  n:"Supplier",
     t:"Today's shipment will be 15% below the confirmed quantity. The missing units cannot arrive before tomorrow."},
    {k:"retailer",  n:"Key retailer",
     t:"A key retailer asks for 400 additional units by noon for today's promotion. Only 180 of those units are expected to materially affect today's promotion."},
    {k:"marketing", n:"Marketing",
     t:"Marketing asks for ₹2 lakh of additional advertising. The campaign can still be changed until 5:00 PM without penalty."},
    {k:"quality",   n:"Quality",
     t:"Two batches have a mismatch between the warehouse label and the quality record. It is not yet known whether the products are affected. If affected units are dispatched before verification, the expected recall exposure can be high."},
    {k:"ops",       n:"Operations",
     t:"Operations proposes skipping the final quality check to avoid a dispatch delay. The check is required before dispatch under the normal procedure."}],
  people: [["arjun","Arjun","Supplier and logistics"],["priya","Priya","Retailer"],
           ["meera","Meera","Quality and data"],["kabir","Kabir","Marketing"]],
  ai: {
    A:{own:"ops", del:{supplier:"arjun", retailer:"priya"}, wait:"marketing", hold:"quality",
       why:"Keep the final quality check and deal with the operations request yourself. Do not dispatch the two batches until the quality record is checked. Priya and Arjun can manage the retailer and supplier, and the advertising can be changed until 5 PM."},
    B:{own:"marketing", del:{retailer:"priya", supplier:"arjun"}, wait:"ops", hold:"quality",
       why:"The retailer request matters most today, so ask Priya to handle it and Arjun to manage the supplier shortage. Approve the additional advertising yourself to protect launch momentum. The dispatch process can be reviewed after the launch."}}
},
{
  id: 2, name: "Strong employee", goodVersion: "B",
  opening: "It is 8:50 AM. You manage a 10-person project team. Ananya has been one of the strongest performers on the team, but she has missed two deadlines in the last month. A major client presentation is tomorrow.",
  context: [["Now","8:50 AM"],["You","Manager, 10-person project team"],
            ["Ananya","A strong performer; two missed deadlines in the last month"],
            ["Client presentation","Tomorrow"]],
  issues: [
    {k:"client",  n:"Client",
     t:"Two recent deliverables contained avoidable errors. The client wants a response before 11:00 AM."},
    {k:"ananya",  n:"Ananya",
     t:"Ananya says she has been working late for several weeks and is struggling with the workload."},
    {k:"finance", n:"Finance",
     t:"The project is 6% over budget. An explanation is due by 4:00 PM."},
    {k:"data",    n:"Data discrepancy",
     t:"One number in tomorrow's presentation does not reconcile with the source data."},
    {k:"partner", n:"Partner request",
     t:"A two-page note on a new market is requested by 5:00 PM."}],
  people: [["riya","Riya","Client"],["mehul","Mehul","Data"],
           ["kabir","Kabir","Budget"],["sara","Sara","People and workload"]],
  ai: {
    B:{own:"data", del:{client:"riya", finance:"kabir"}, wait:"partner", hold:"ananya",
       why:"Check the number in tomorrow's presentation yourself. Make no decision about Ananya until you know whether workload caused the missed deadlines. Riya can reply to the client before 11 AM and Kabir can explain the budget; the market note can wait."},
    A:{own:"client", del:{data:"mehul", finance:"kabir"}, wait:"ananya", hold:"partner",
       why:"Ananya has historically been one of the strongest performers, so I would not reduce her responsibilities; ask her to improve execution. Protect the client relationship first and reply yourself. Mehul can fix the number and Kabir the budget; the market note can wait for now."}},

  /* In merged mode the weak plan above stops being weak: its only flaw is
     the wait/hold split, which merged scoring does not look at. This is the
     weak plan for merged mode. Keep both in step if you edit the case. */
  aiMerged: {
    B:{own:"data", del:{client:"riya", finance:"kabir"}, defer:["partner","ananya"], holdPick:"ananya",
       why:"Check the number in tomorrow's presentation yourself. Make no decision about Ananya until you know whether workload caused the missed deadlines. Riya can reply to the client before 11 AM and Kabir can explain the budget; the market note can wait."},
    A:{own:"client", del:{partner:"riya", finance:"kabir"}, defer:["data","ananya"], holdPick:"ananya",
       why:"Protect the client relationship first and reply yourself; two bad deliverables need a senior voice. Riya can write the market note and Kabir can explain the budget. The presentation number and Ananya's workload can both sit until the client is settled."}}
},
{
  id: 3, name: "Monday project team", goodVersion: "B",
  opening: "It is 9:00 AM. You lead a 12-person project team. Five things need attention.",
  context: [["Now","Monday, 9:00 AM"],["You","Lead, 12-person project team"]],
  issues: [
    {k:"analysis",  n:"Client analysis",
     t:"A client needs a revised analysis by 1:00 PM. It requires background on the client's cost structure that only you and Sanjay have. Sanjay is away today."},
    {k:"dashboard", n:"Live dashboard",
     t:"A number on a client-facing dashboard looks wrong. The underlying data are available, but someone needs to identify whether the problem is in the source data or the dashboard calculation."},
    {k:"hires",     n:"New hires",
     t:"Two people joining next week need their documents sent by 6 PM today."},
    {k:"event",     n:"Team event",
     t:"Friday's team event needs an agenda. The venue and speakers are already confirmed."},
    {k:"software",  n:"Software",
     t:"A ₹3 lakh annual software subscription renews in two weeks. You can cancel it any time before then."}],
  people: [["tara","Tara","Client delivery, on this account for two weeks"],
           ["imran","Imran","Dashboard and pipeline"],["neel","Neel","Joining paperwork"],
           ["maya","Maya","General project support"]],
  ai: {
    B:{own:"analysis", del:{dashboard:"imran", hires:"neel"}, wait:"event", hold:"software",
       why:"Do the client analysis yourself: only you have the cost background, and Sanjay is away. Imran can trace the dashboard error and Neel can send the joining documents. Check how many people use the software before deciding; the event agenda can wait."},
    A:{own:"dashboard", del:{analysis:"tara", hires:"neel"}, wait:"software", hold:"event",
       why:"Fix the client dashboard yourself first because the wrong number is visible to the client. Give the client analysis to Tara so it still lands by 1 PM, and ask Neel to handle the joining documents. The software can wait, since you can cancel any time."}}
},
{
  id: 4, name: "Friday support team", goodVersion: "A",
  opening: "It is 3:00 PM on Friday. You lead a 20-person customer support team.",
  context: [["Now","Friday, 3:00 PM"],["You","Lead, 20-person support team"]],
  issues: [
    {k:"complaint", n:"Customer complaint",
     t:"A customer says one of your agents was rude. The call was recorded, but nobody has reviewed it."},
    {k:"warning",   n:"Formal warning",
     t:"Meher, the team lead who reported the complaint, asks you to approve a written warning today. The warning stays on the employee record and cannot later be withdrawn."},
    {k:"overtime",  n:"Overtime",
     t:"Overtime claims must be submitted by 5:00 PM. Missing the cut-off delays payment by one month."},
    {k:"meeting",   n:"Client meeting",
     t:"A client asks to move Monday's review meeting to Tuesday."},
    {k:"shifts",    n:"Shift schedule",
     t:"An agent says the shift system has been double-booking people for the last two weeks. Ashok manages the system."}],
  people: [["ashok","Ashok","Shift system"],["meher","Meher","Team lead, reported the complaint"],
           ["zoya","Zoya","Payroll"],["karan","Karan","Client relationships"]],
  ai: {
    A:{own:"complaint", del:{overtime:"zoya", shifts:"ashok"}, wait:"meeting", hold:"warning",
       why:"Do not approve the warning until the call recording is reviewed; it cannot be withdrawn later. Oversee that review yourself, since Meher raised the complaint. Zoya can submit overtime before 5 PM, Ashok can check the shift system, and the meeting change can wait."},
    B:{own:"warning", del:{complaint:"meher", overtime:"zoya"}, wait:"meeting", hold:"shifts",
       why:"Approve the written warning today. Acting quickly on a customer complaint shows that standards are enforced, and Meher is closest to the situation. The recording can be reviewed afterwards if the agent disputes it. Zoya can submit the overtime claims."}}
},
{
  id: 5, name: "University outreach", goodVersion: "A",
  opening: "It is 10:00 AM on Monday at a famous management institute. You coordinate an outreach programme across several cities. Applications from one city fell 22% last month. The quarter ends in three weeks.",
  context: [["Now","Monday, 10:00 AM"],["You","Outreach coordinator, several cities"],
            ["One city","Applications fell 22% last month"],["Quarter ends","In three weeks"]],
  issues: [
    {k:"city",        n:"City performance",
     t:"Applications in one city fell 22%. A competing university launched a campaign, and your most experienced student coordinator left at about the same time. Deciding the response is yours."},
    {k:"waiver",      n:"Fee waiver",
     t:"A partner asks for a 10% fee waiver this week. Once announced, the waiver must remain for six months."},
    {k:"analysis",    n:"Analysis",
     t:"Your analytics team can spend two days checking whether the fall came mainly from the competitor campaign or from the vacant coordinator role."},
    {k:"coordinator", n:"New coordinator",
     t:"A new coordinator joins in two weeks. The onboarding plan needs approval."},
    {k:"travel",      n:"Travel request",
     t:"A team member asks for approval of a ₹30,000 travel budget that is within the normal limit."}],
  people: [["prakash","Prakash","Analytics"],["sonia","Sonia","People operations"],
           ["imtiaz","Imtiaz","Partner relationships"],["kavita","Kavita","Finance and admin"]],
  ai: {
    A:{own:"city", del:{analysis:"prakash", travel:"kavita"}, wait:"coordinator", hold:"waiver",
       why:"Do not announce the waiver yet: it stays for six months, and the fall may come from the vacant coordinator role. Ask Prakash to run the two-day analysis, and decide the city response yourself. Kavita can approve the travel; the onboarding plan can wait."},
    B:{own:"waiver", del:{city:"imtiaz", travel:"kavita"}, wait:"analysis", hold:"coordinator",
       why:"Give the partner the 10% waiver now. A 22% fall means you are losing students on price, and three weeks is not long enough to wait. Imtiaz can lead the city response. The analysis can tell you what to do next cycle."}}
},
{
  id: 6, name: "Day before travel", goodVersion: "B",
  opening: "It is 9:00 AM on Thursday in an FMCG giant. You lead a 15-person operations team and leave tomorrow for a three-day site visit.",
  context: [["Now","Thursday, 9:00 AM"],["You","Lead, 15-person operations team"],
            ["Travel","Leave tomorrow, three days"]],
  issues: [
    {k:"form",     n:"Required form",
     t:"A form requiring the unit head's personal signature is due Friday while you are travelling. No one else is authorised to sign."},
    {k:"customer", n:"Customer issue",
     t:"A mid-size B2B customer is unhappy with response times. Harish has handled three similar complaints successfully."},
    {k:"panel",    n:"Interview panel",
     t:"Tomorrow's interview panel needs one more member. Omar and Naina are both qualified."},
    {k:"supplier", n:"Supplier offer",
     t:"A supplier offers 5% off for a two-year commitment. The offer stays open for one month. Next year's volume forecast is not yet available."},
    {k:"report",   n:"Monthly report",
     t:"A report is needed in ten days. All the information is already available."}],
  people: [["harish","Harish","Service lead"],["naina","Naina","Recruiting"],
           ["bhavna","Bhavna","Finance analyst"],["omar","Omar","Senior colleague, qualified panellist"]],
  ai: {
    B:{own:"form", del:{customer:"harish", panel:"naina"}, wait:"report", hold:"supplier",
       why:"Sign the form yourself today: no one else can sign it, and you are away on Friday. Harish has handled three similar complaints, so give him the customer. Do not commit to the supplier until next year's forecast is in; the report has ten days."},
    A:{own:"customer", del:{form:"bhavna", panel:"naina"}, wait:"supplier", hold:"report",
       why:"Take the customer issue yourself. When a customer is unhappy, it needs to come from the manager. Ask Bhavna to handle the required form and Naina to sit on the panel. The supplier offer is open for a month, so it can wait."}}
}
];
