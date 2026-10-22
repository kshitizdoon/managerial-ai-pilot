/* =============================================================
   cases.js — everything respondents read.

   Source: Managerial Decision Survey researcher manual, 8 October 2026
   (round 2, tracked changes accepted), with the pilot feedback of
   22 October 2026 applied on top:
   - every decision says what is to be decided (q);
   - each caselet's key numbers are shown as tiles (facts);
   - "class schedule" in Launch Morning / Opening readiness now reads
     "group exercise classes advertised for this afternoon";
   - every AI reason for a non-preferred action is now specific to its
     decision, like the reasons for preferred actions. The manual's
     four generic sentences gave weak advice away.
   Actions recommended at each level, and the key, are the manual's.

   A caselet:
     id        stable id. Saved responses refer to it; never reuse one.
     art       which illustration (js/art.js) heads the caselet
     when      the time line, as written in the manual
     facts     [[value, label]] key numbers from the opening, shown as tiles
     opening   the context paragraph
     decisions [{k, n, t, q}]  k is the stable decision id, n the title,
               t the text, q what is to be decided (shown after
               "To decide:"). Add after:["k"] to a decision if it must
               follow another one when decision order is randomised.
     ai        the advisor's action and one-line reason for each
               decision, at four quality levels. Quality is the plan's
               own score under key.js; it is never shown to respondents.

   Same rules as before for the text itself: no label words on a
   decision ("urgent", "can wait", "delegate", "check first"), and no
   decision states both a fact and what it implies.
   ============================================================= */

/* The four actions: key, label, short gloss shown on every option,
   the full definition from the manual, and who decides / when, for the
   grid in the instructions. */
window.ACTIONS = [
  ["own",      "Own",      "you decide, now",
   "Make the decision yourself now. Others may advise you or carry out what you decide.",
   "You", "Now"],
  ["delegate", "Delegate", "a team member decides, now",
   "Entrust the decision to a capable team member now. They choose the course of action within their authority, without needing your approval.",
   "A team member, not you", "Now"],
  ["wait",     "Wait",     "you decide, later",
   "Keep the decision for yourself and address it later; it is ready to be made.",
   "You", "Later. Nothing is missing"],
  ["hold",     "Hold",     "not yet, something essential is missing",
   "Do not commit until essential information, capability or another prerequisite is available. You may still respond without committing.",
   "No one yet", "Once something missing is in place"]
];

/* Own and Delegate side by side: the difference respondents found
   least clear in the pilot. */
window.OWN_VS_DELEGATE = "Example: a team member asks whether a customer should get a refund. If you decide yes or no, that is Own, even if they then process the refund. If you let them decide, that is Delegate.";

window.INSTRUCTIONS = "For each situation, choose the most appropriate managerial action given the other demands on your time. Your choice concerns who should take responsibility for the decision and whether it can responsibly be made now, not who performs the routine implementation work. If you would make the decision yourself, including a decision to give someone a task or role, choose Own; choose Delegate only if a team member should make the decision instead of you. You may choose the same action more than once.";

/* Practice: two questions on Wait versus Hold before the first caselet.
   Not scored. Each has one answer a careful reader cannot miss, so the
   pair also serves as the attention check: practice.correct is saved,
   and the results view can leave out respondents who fail it. Not from
   the manual, which asks for a practice question but gives no text.
   Review before fielding. */
window.PRACTICE = {
  items: [
    {k:"a", n:"Training programme",
     t:"You need to choose between two training programmes for next quarter. The choice is yours to make, you already have everything you need, and it is not due until the end of the month.",
     q:"which training programme to choose.",
     answer:"wait"},
    {k:"b", n:"Supplier contract",
     t:"A supplier offers a discount if you sign a contract today. Whether its product meets your safety standard will not be known until test results arrive tomorrow.",
     q:"whether to sign the supplier contract.",
     answer:"hold"}],
  feedback: "Training programme is Wait: the decision is ready to be made, it just does not need your time today. Supplier contract is Hold: something essential is missing, so you should not commit until the test results arrive."
};

/* Case-level order. The six caselets are six different organisations
   with no shared timeline, so all stay fully randomised. To force one
   after another, add {laterCaseId: [earlierCaseId]} and order.js will
   enforce it. */
window.CASE_AFTER = {};

window.CASES = [
{
  id: 3, name: "Monday Project Team", art: "consulting",
  when: "9:00 AM, Monday",
  facts: [["12 people", "in your consulting team"], ["3 hours", "available today for involvement"]],
  opening: "You manage a 12-person consulting team handling several client assignments. Your project leads regularly manage client relationships and delivery decisions for their own projects independently, while you remain accountable for major commitments. You have approximately three hours available today for direct involvement in these matters.",
  decisions: [
    {k:"escalation", n:"Client escalation",
     t:"A client has questioned the team's recommendation after receiving conflicting figures from two departments. The project lead developed the recommendation and understands both data sources, but the client relationship has become sensitive following delays in the previous engagement. A response is expected today.",
     q:"the team's response to the client's challenge, due today."},
    {k:"expansion", n:"Project expansion",
     t:"A long-standing client wants to expand an ongoing engagement into a new business area. The team has delivered similar work before, but the proposed scope involves regulatory requirements that have not yet been reviewed. The client wants a firm commitment on scope and delivery timelines by tomorrow.",
     q:"whether to commit to the expanded scope and timeline by tomorrow."},
    {k:"recommendation", n:"Revised recommendation",
     t:"A client requests a revised cost recommendation by 1:00 PM. The current project lead has developed the updated numbers, but the recommendation involves changing assumptions that you agreed directly with the client during last year's engagement. The client expects a final recommendation today.",
     q:"the final cost recommendation to send the client today."},
    {k:"recovery", n:"Delivery recovery",
     t:"A project is behind schedule after the client requested additional analysis. Its project lead proposes borrowing two consultants from another assignment. The second project lead believes the change is manageable but is concerned about upcoming milestones. Both clients expect updates today, and the team needs a decision on the proposed reallocation.",
     q:"whether to move two consultants from the other assignment."},
    {k:"career", n:"Performance discussion",
     t:"A high-performing project lead has requested a discussion about taking on a larger role. The employee has recently taken on additional responsibilities and expects clarity about future opportunities. You have a view on their readiness, and the next formal role review is scheduled for later this month.",
     q:"how to respond to the project lead's request about a larger role."}],
  ai: {
    high: {
      escalation: ["delegate", "Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline."],
      expansion: ["hold", "A binding scope and timeline promise depends on regulatory implications that have not been assessed. Deferring merely for convenience does not address that prerequisite."],
      recommendation: ["own", "The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations."],
      recovery: ["delegate", "Both project leads know their projects and milestones best. They can agree the reallocation between themselves, which keeps the manager's limited time for client-facing matters today."],
      career: ["wait", "The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines."]},
    moderate: {
      escalation: ["delegate", "Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline."],
      expansion: ["wait", "The client wants a commitment by tomorrow, not today. The manager can give the expansion proper attention tomorrow morning, once today's more pressing client matters are dealt with."],
      recommendation: ["own", "The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations."],
      recovery: ["hold", "The second lead is concerned about upcoming milestones. The effect of losing two consultants on that project should be assessed before anyone commits to the reallocation."],
      career: ["wait", "The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines."]},
    low: {
      escalation: ["delegate", "Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline."],
      expansion: ["own", "A long-standing client is asking to grow the engagement, and the team has delivered similar work before. A firm commitment from the manager secures the opportunity and reassures the client."],
      recommendation: ["own", "The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations."],
      recovery: ["hold", "The second lead is concerned about upcoming milestones. The effect of losing two consultants on that project should be assessed before anyone commits to the reallocation."],
      career: ["hold", "Readiness should be judged against evidence from the employee's recent additional responsibilities. Gathering that input from others before the conversation would make the discussion fairer."]},
    very_low: {
      escalation: ["own", "The relationship became sensitive after delays in the previous engagement, and conflicting figures are now in dispute. A personal response from the manager shows the client the concern is taken seriously."],
      expansion: ["own", "A long-standing client is asking to grow the engagement, and the team has delivered similar work before. A firm commitment from the manager secures the opportunity and reassures the client."],
      recommendation: ["hold", "The revised numbers change assumptions agreed last year. The updated figures should be independently verified before anything goes to the client, so the recommendation does not need correcting later."],
      recovery: ["wait", "Both clients expect updates today, but the staffing change itself need not be settled this morning. It can be decided once today's client responses have gone out."],
      career: ["hold", "Readiness should be judged against evidence from the employee's recent additional responsibilities. Gathering that input from others before the conversation would make the discussion fairer."]}}
},

{
  id: 2, name: "Strong Employee", art: "analytics",
  when: "9:00 AM, Monday",
  facts: [["Tomorrow", "major client presentation"], ["8 people", "in your analytics team"], ["3 hours", "available today for involvement"]],
  opening: "You manage an eight-person analytics team preparing a major client presentation for tomorrow. Two senior analysts can independently lead assignments, although you remain accountable for client commitments. You have approximately three hours available today for direct involvement in the matters below.",
  decisions: [
    {k:"presentation", n:"Client presentation",
     t:"A client has questioned a recommendation that could affect its annual operating budget. The senior analyst who developed the analysis believes the recommendation is sound, but the client has challenged the team's commercial assumptions in earlier discussions. The client expects your team's position by 2:00 PM.",
     q:"the team's position on the challenged recommendation, due by 2:00 PM."},
    {k:"funding", n:"Financial commitment",
     t:"Finance has asked you to approve \u20b94 lakh for additional analytical support before today\u2019s vendor deadline. The support could strengthen tomorrow\u2019s client presentation. The team can begin some work using existing data, but completing the proposed analysis depends on client information expected later today. The vendor requires a commitment for the full amount.",
     q:"whether to approve the \u20b94 lakh vendor commitment today."},
    {k:"partner", n:"Partner request",
     t:"A partner has requested an initial assessment of an opportunity with an existing client by tomorrow morning. The opportunity builds on the team's current work but could involve a different commercial model. A senior analyst has worked closely with the client, while you have participated in earlier discussions about the account.",
     q:"the initial assessment of the opportunity, due to the partner tomorrow morning."},
    {k:"appointment", n:"Employee development",
     t:"A strong-performing analyst has asked to lead a new client workstream beginning next week. The employee has managed internal teams successfully but has limited experience handling difficult client conversations. The workstream is commercially important, and a decision on whether to appoint the analyst as lead is needed today. If appointed, the analyst would manage the workstream\u2019s delivery.",
     q:"whether to appoint the analyst as lead of the new workstream."},
    {k:"review", n:"Performance review",
     t:"A senior analyst has challenged feedback in their year-end evaluation, arguing that it overlooks their contribution to a difficult project. You have reviewed the evidence and formed an assessment. The analyst has requested a discussion this week, while the formal evaluation meeting is scheduled for Thursday.",
     q:"how to respond to the analyst's challenge to their evaluation."}],
  ai: {
    high: {
      presentation: ["delegate", "The senior analyst built the analysis and knows the assumptions in detail. They are best placed to defend the recommendation and can set the team's position before the 2:00 PM deadline."],
      funding: ["hold", "The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs."],
      partner: ["delegate", "This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager\u2019s commercial familiarity."],
      appointment: ["own", "Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst\u2019s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no."],
      review: ["wait", "The manager has already formed an assessment and a formal discussion is scheduled for Thursday, so a personal discussion can be deferred."]},
    moderate: {
      presentation: ["delegate", "The senior analyst built the analysis and knows the assumptions in detail. They are best placed to defend the recommendation and can set the team's position before the 2:00 PM deadline."],
      funding: ["hold", "The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs."],
      partner: ["delegate", "This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager\u2019s commercial familiarity."],
      appointment: ["own", "Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst\u2019s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no."],
      review: ["hold", "The analyst says the feedback overlooks their part in a difficult project. Input from colleagues on that project should be collected before the feedback is discussed again."]},
    low: {
      presentation: ["hold", "The client has challenged the commercial assumptions before. The team's position should not be confirmed until those assumptions have been re-tested against the client's latest objections."],
      funding: ["own", "The extra analysis could strengthen tomorrow's presentation, and the vendor deadline is today. Approving the full amount now secures the support while the team starts with existing data."],
      partner: ["delegate", "This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager\u2019s commercial familiarity."],
      appointment: ["own", "Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst\u2019s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no."],
      review: ["hold", "The analyst says the feedback overlooks their part in a difficult project. Input from colleagues on that project should be collected before the feedback is discussed again."]},
    very_low: {
      presentation: ["wait", "The position is not due until 2:00 PM. The manager can settle it early in the afternoon, after dealing with the vendor deadline and the partner's request."],
      funding: ["wait", "The client information is expected later today. The manager can return to the approval this evening, once the more urgent presentation matters have been handled."],
      partner: ["hold", "The opportunity could involve a different commercial model. The assessment should not go to the partner until the pricing implications of that model have been worked out."],
      appointment: ["wait", "Tomorrow's client presentation takes priority today. The appointment matters for next week's workstream and can be settled once the presentation is behind the team."],
      review: ["own", "The analyst has challenged the evaluation directly and asked to meet this week. Meeting them personally now keeps the disagreement from growing before Thursday's formal meeting."]}}
},

{
  id: 5, name: "Fest Week", art: "festival",
  when: "10:00 AM, Monday",
  facts: [["3 weeks", "festival opens"], ["Next week", "registrations close"], ["3 hours", "available today for involvement"]],
  opening: "You head your institute's festival committee. The festival opens in three weeks, with registrations closing next week. Your committee leads independently manage sponsorships, outreach, operations, and event teams within agreed budgets. You remain accountable for major financial commitments and event safety. You have approximately three hours available today for direct involvement in the following matters.",
  decisions: [
    {k:"registration", n:"Registration strategy",
     t:"Registrations from a major partner campus are 22% below last year. A rival festival has moved to the same weekend, while the campus coordinator recently stepped down. The outreach team proposes using most of the remaining \u20b91.5 lakh publicity budget on a targeted campaign. A decision is needed today to secure the campaign slots.",
     q:"whether to spend most of the remaining \u20b91.5 lakh on the targeted campaign."},
    {k:"sponsor", n:"Sponsor negotiation",
     t:"Your largest sponsor wants to reduce its contribution by 10%, citing weaker expected footfall. The sponsorship lead proposes offering additional branding opportunities instead of accepting the reduction. Some of these opportunities could also interest other sponsors, and the agreement covers next year's festival. The sponsor expects a response today, although final terms can be agreed any time before the festival opens.",
     q:"how to respond to the sponsor's proposed 10% reduction."},
    {k:"staffing", n:"Event staffing",
     t:"Registrations for one of the festival's largest events have exceeded expectations. Its lead requests additional experienced volunteers, which would reduce support for two smaller events. The volunteer committee has proposed a revised allocation, but the affected event leads disagree about the impact. Staffing plans must be confirmed today.",
     q:"the final volunteer allocation across the three events."},
    {k:"venue", n:"Venue commitment",
     t:"A new event has attracted strong interest, and a larger off-campus venue is available at a discounted rate until this evening. The venue has hosted similar events, but the expected attendance is considerably higher than at previous institute events. The committee's entry and exit arrangements were designed for smaller venues, and it is unclear whether they would work for the expected crowd. Confirmation requires a non-refundable deposit.",
     q:"whether to pay the non-refundable deposit for the larger venue."},
    {k:"programming", n:"Festival programming",
     t:"Several alumni have offered to participate in an industry networking session, which could strengthen the festival's professional outreach. You have been developing the programme with the student team, but its proposed format may overlap with an existing event. The schedule will be finalized later this week, while sponsor and registration decisions require attention today.",
     q:"whether and how to include the alumni networking session."}],
  ai: {
    high: {
      registration: ["own", "The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment."],
      sponsor: ["own", "The largest sponsor's contribution and next year's agreement are both at stake. The head should negotiate the branding offer personally and settle the terms with the sponsor today."],
      staffing: ["delegate", "The volunteer committee can reconcile staffing among planned events. It is consequential but within its remit, so the head should avoid taking over the allocation."],
      venue: ["hold", "A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue."],
      programming: ["wait", "The programme discussion is valuable but can be resolved before the later-week schedule deadline after urgent sponsorship and registration choices."]},
    moderate: {
      registration: ["own", "The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment."],
      sponsor: ["own", "The largest sponsor's contribution and next year's agreement are both at stake. The head should negotiate the branding offer personally and settle the terms with the sponsor today."],
      staffing: ["delegate", "The volunteer committee can reconcile staffing among planned events. It is consequential but within its remit, so the head should avoid taking over the allocation."],
      venue: ["hold", "A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue."],
      programming: ["hold", "The proposed format may overlap with an existing event. The session should not be confirmed until the overlap in audience and timing with that event has been checked."]},
    low: {
      registration: ["own", "The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment."],
      sponsor: ["hold", "The reduction rests on expected footfall, which registrations will show when they close next week, and the terms also cover next year\u2019s festival. Final terms can be agreed before the festival opens, so committing before footfall is known would be premature."],
      staffing: ["hold", "The affected event leads disagree about the impact. The revised allocation should not be confirmed until its effect on the two smaller events has been checked with those leads."],
      venue: ["own", "The discounted rate ends this evening and the new event has attracted strong interest. The head should approve the deposit and secure the larger venue before the offer lapses."],
      programming: ["hold", "The proposed format may overlap with an existing event. The session should not be confirmed until the overlap in audience and timing with that event has been checked."]},
    very_low: {
      registration: ["hold", "The cause of the 22% drop is unclear: the rival festival and the coordinator's exit may both matter. Committing most of the budget should wait until the cause is better understood."],
      sponsor: ["delegate", "The sponsorship lead already has a proposal and knows the sponsor. The negotiation sits within their remit and agreed budget, which keeps the head free for other matters."],
      staffing: ["hold", "The affected event leads disagree about the impact. The revised allocation should not be confirmed until its effect on the two smaller events has been checked with those leads."],
      venue: ["own", "The discounted rate ends this evening and the new event has attracted strong interest. The head should approve the deposit and secure the larger venue before the offer lapses."],
      programming: ["delegate", "The student team has been developing the programme and knows the schedule. They can decide how to fit in the alumni session before the schedule is finalised later this week."]}}
},

{
  id: 4, name: "Friday Support Team", art: "support",
  when: "6:30 PM, Friday",
  facts: [["10 people", "in your support team"], ["2 hours", "available this evening"], ["Weekend", "reduced staffing"]],
  opening: "You lead a 10-person customer support team serving several business clients. Your two team leads independently manage client relationships, service delivery, and staffing within agreed commitments. You remain responsible for major contractual decisions. You have approximately two hours available this evening, and the team operates with reduced staffing over the weekend.",
  decisions: [
    {k:"escalation", n:"Customer escalation",
     t:"A major client has complained about repeated delays in resolving support requests. The account represents a significant share of your team's revenue, and the client has questioned whether agreed service standards are being maintained. The account lead attributes the delays to unusually high demand, while the client believes the team has repeatedly missed its commitments. A response is expected before the weekend.",
     q:"the response to the major client's complaint about delays."},
    {k:"weekend", n:"Weekend service allocation",
     t:"A major client expects additional weekend support following recent complaints. The account lead proposes temporarily moving an experienced agent from another account, where service has been stable but an important client review is due next week. Both accounts would remain within existing service commitments, and the weekend arrangement must be confirmed tonight.",
     q:"whether to move the experienced agent to the other account for the weekend."},
    {k:"guarantee", n:"Service commitment",
     t:"A client experiencing recurring system failures wants guaranteed resolution by Monday morning. Similar failures have previously been resolved within a day, but the current incident has persisted despite the team's initial intervention. The client is considering renewing a substantial support contract and wants a firm commitment tonight.",
     q:"whether to guarantee the client resolution by Monday morning."},
    {k:"process", n:"Process improvement",
     t:"A team lead has proposed changing the escalation process after several customers complained about being transferred between agents. The proposal would give senior agents greater discretion to resolve complaints but could increase handling time for complex cases. The change is planned for next month's operating cycle, and the lead wants your decision before finalizing the implementation plan.",
     q:"whether to approve the proposed change to the escalation process."},
    {k:"recovery", n:"Client recovery plan",
     t:"A client whose service ratings have declined wants a recovery plan before the weekend. The account lead proposes closer monitoring and changes to how complaints are escalated. The plan would use the account\u2019s existing staff and stay within agreed service levels, though responses to new requests may be slower. The client expects a credible response tonight.",
     q:"the recovery plan to give the client tonight."}],
  ai: {
    high: {
      escalation: ["own", "Repeated alleged failures for a major account raise service accountability and commercial relationship concerns beyond an ordinary ticket response."],
      weekend: ["delegate", "The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time."],
      guarantee: ["hold", "A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly."],
      process: ["wait", "The process policy is important but implementation is next month. Immediate weekend decisions take priority."],
      recovery: ["own", "The client's ratings have declined and a credible response is expected tonight. The manager should own the recovery plan to show the client senior attention."]},
    moderate: {
      escalation: ["own", "Repeated alleged failures for a major account raise service accountability and commercial relationship concerns beyond an ordinary ticket response."],
      weekend: ["delegate", "The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time."],
      guarantee: ["hold", "A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly."],
      process: ["hold", "The change could increase handling time for complex cases. Its effect on those cases should be measured before deciding whether senior agents get more discretion."],
      recovery: ["own", "The client's ratings have declined and a credible response is expected tonight. The manager should own the recovery plan to show the client senior attention."]},
    low: {
      escalation: ["hold", "The account lead blames unusual demand, while the client says commitments were missed. The ticket data should be reviewed to establish which account is right before the team responds."],
      weekend: ["delegate", "The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time."],
      guarantee: ["own", "A substantial contract renewal depends on this answer, and similar failures were fixed within a day before. The manager should give the client a firm commitment tonight."],
      process: ["wait", "The process policy is important but implementation is next month. Immediate weekend decisions take priority."],
      recovery: ["wait", "The plan uses existing staff and stays within agreed service levels, so nothing has to change before Monday. The manager can review it properly after the weekend."]},
    very_low: {
      escalation: ["wait", "The client wants a response before the weekend, and there are still some hours left. It can be written after the weekend coverage is settled, when the evening is quieter."],
      weekend: ["own", "Moving an experienced agent affects two accounts, one with an important client review next week. The manager should make this staffing call personally to balance both clients."],
      guarantee: ["own", "A substantial contract renewal depends on this answer, and similar failures were fixed within a day before. The manager should give the client a firm commitment tonight."],
      process: ["delegate", "The team lead designed the proposal and will carry it out next month. They are best placed to settle the details of the escalation process within the team's commitments."],
      recovery: ["wait", "The plan uses existing staff and stays within agreed service levels, so nothing has to change before Monday. The manager can review it properly after the weekend."]}}
},

{
  id: 1, name: "Launch Morning", art: "fitness",
  when: "9:00 AM, Tuesday",
  facts: [["Noon", "new branch opens"], ["12 people", "handling the opening"], ["2 hours", "available this morning"]],
  opening: "You manage a chain of fitness centres and are opening a new branch at noon today. A 12-person team is handling the opening, with experienced leads who independently manage customers, operations, and marketing within the approved opening plan. You remain accountable for pricing and customer safety. You have around two hours available this morning for direct involvement in the following matters.",
  decisions: [
    {k:"corporate", n:"Corporate membership",
     t:"A nearby company wants discounted memberships for 40 employees before the branch opens. The offer could bring regular business, but the proposed price is lower than what early members have already paid. The company wants confirmation before noon.",
     q:"whether to accept the company's discounted price for 40 memberships."},
    {k:"announcement", n:"Opening announcement",
     t:"A competing fitness centre has announced a similar membership offer nearby. Your marketing lead proposes changing today's opening promotion to emphasize personal training rather than discounted memberships. The revised message would stay within the approved marketing budget, and the announcement is due this morning.",
     q:"whether to change today's opening promotion."},
    {k:"readiness", n:"Opening readiness",
     t:"The branch opens at noon, with customers booked for the afternoon. During yesterday\u2019s trial, the exercise area became crowded when several groups used it together. Staff have rearranged the equipment and expect fewer customers at first, but the revised layout has not been tested with a full group. Confirming the opening would also confirm the group exercise classes advertised for this afternoon.",
     q:"whether to confirm the noon opening and this afternoon's classes as planned."},
    {k:"trainers", n:"Customer experience",
     t:"Two groups have requested dedicated trainers during opening week. One includes long-standing members transferring from another branch; the other could bring substantial new business. The team can fully support only one without reducing regular services, but the other can be fully supported from the following week. The customer experience lead knows both groups and has proposed an arrangement, and both groups expect confirmation today.",
     q:"which group gets dedicated trainers during opening week."},
    {k:"roles", n:"Team responsibilities",
     t:"A senior trainer has suggested changing how staff responsibilities are divided to reduce delays in handling member requests. The proposed changes could improve service but would alter the schedules of employees who have worked together for several months. The new arrangements would begin next month.",
     q:"whether to adopt the new division of staff responsibilities."}],
  ai: {
    high: {
      corporate: ["own", "A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment."],
      announcement: ["delegate", "The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions."],
      readiness: ["hold", "The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check."],
      trainers: ["own", "Both groups matter: one brings loyal members, the other substantial new business. Choosing which group gets dedicated trainers is a judgement the manager should make personally today."],
      roles: ["wait", "Workstream changes begin next month and can receive personal attention after today\u2019s opening."]},
    moderate: {
      corporate: ["own", "A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment."],
      announcement: ["delegate", "The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions."],
      readiness: ["hold", "The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check."],
      trainers: ["own", "Both groups matter: one brings loyal members, the other substantial new business. Choosing which group gets dedicated trainers is a judgement the manager should make personally today."],
      roles: ["hold", "The change would alter the schedules of a team that has worked together for months. Staff views on the proposal should be gathered before any decision is taken."]},
    low: {
      corporate: ["own", "A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment."],
      announcement: ["hold", "A competitor has just announced a similar offer. The revised message should not go out until its likely effect on early membership sales has been checked."],
      readiness: ["own", "Staff have rearranged the equipment and expect fewer customers at first. The manager should confirm the noon opening so booked customers and classes go ahead as planned."],
      trainers: ["delegate", "Allocating dedicated trainers for opening week sits with the customer experience lead, who knows both groups. The other group can be fully supported from the following week and no price or policy exception is involved, so the manager can keep attention for higher-stakes decisions."],
      roles: ["hold", "The change would alter the schedules of a team that has worked together for months. Staff views on the proposal should be gathered before any decision is taken."]},
    very_low: {
      corporate: ["delegate", "The customer lead handles memberships and knows what early members paid. They can agree terms with the company within the opening plan while the manager prepares the launch."],
      announcement: ["hold", "A competitor has just announced a similar offer. The revised message should not go out until its likely effect on early membership sales has been checked."],
      readiness: ["own", "Staff have rearranged the equipment and expect fewer customers at first. The manager should confirm the noon opening so booked customers and classes go ahead as planned."],
      trainers: ["wait", "The second group can be fully supported from the following week. The allocation can be confirmed after the opening, once the manager has seen how busy the first days are."],
      roles: ["hold", "The change would alter the schedules of a team that has worked together for months. Staff views on the proposal should be gathered before any decision is taken."]}}
},

{
  id: 6, name: "Day Before Travel", art: "travel",
  when: "4:00 PM, Wednesday",
  facts: [["Tomorrow", "you travel for three days"], ["10 people", "in your team"], ["2 hours", "available today"]],
  opening: "You manage a 10-person team handling several client projects. You are travelling tomorrow morning for a three-day meeting and will have limited availability during the trip. Your team leads can independently manage projects and client discussions within existing commitments. You have approximately two hours available today to address the following matters.",
  decisions: [
    {k:"client", n:"Client disagreement",
     t:"A client has questioned a recommendation made by your team and wants a discussion before you travel. The project lead developed the recommendation and believes it is justified, but the client has raised concerns about its effect on their costs. The client has worked directly with you on earlier projects.",
     q:"how to respond to the client's concerns about the recommendation."},
    {k:"handover", n:"Project handover",
     t:"A major project reaches an important deadline while you are away. The project lead has proposed a delivery plan that requires adjusting responsibilities across the team. The plan could improve delivery speed but may increase the workload of two experienced employees. The team needs clarity before you leave.",
     q:"whether to adopt the project lead's delivery plan for the deadline."},
    {k:"opportunity", n:"New client opportunity",
     t:"A potential client has offered a substantial assignment beginning next week. The team has completed similar work, and the project lead believes it can be managed by adjusting current schedules. Two existing projects also have important deadlines next week. The client wants a firm start-date commitment before you travel.",
     q:"whether to commit to a start date for the new assignment."},
    {k:"development", n:"Team development",
     t:"A high-performing employee has requested a discussion about taking responsibility for a larger project. You have reviewed their recent performance and have a view on their readiness. The project would begin next month, and the employee would like to discuss the opportunity before you travel.",
     q:"how to respond to the employee's request about a larger project."},
    {k:"review", n:"Project review",
     t:"Two client projects have recently suffered delays because problems were identified too late. The team lead running both projects proposes testing a shorter weekly progress review on them during your three-day absence. The change could identify issues earlier but would take time from employees already working toward deadlines. The team wants direction before you leave.",
     q:"whether to trial the shorter weekly review during your absence."}],
  ai: {
    high: {
      client: ["own", "The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead\u2019s analytical familiarity supports but does not replace personal engagement."],
      handover: ["own", "The plan adds to the workload of two experienced employees around an important deadline. The manager should settle the new responsibilities personally before leaving."],
      opportunity: ["hold", "A firm start date risks disrupting two existing deadlines; the team\u2019s optimistic scheduling view is not sufficient confirmation of capacity."],
      development: ["wait", "The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel."],
      review: ["delegate", "The lead running both projects can trial the change on them while the manager is away. This preserves learning without committing the organization to a permanent process change."]},
    moderate: {
      client: ["own", "The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead\u2019s analytical familiarity supports but does not replace personal engagement."],
      handover: ["own", "The plan adds to the workload of two experienced employees around an important deadline. The manager should settle the new responsibilities personally before leaving."],
      opportunity: ["hold", "A firm start date risks disrupting two existing deadlines; the team\u2019s optimistic scheduling view is not sufficient confirmation of capacity."],
      development: ["wait", "The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel."],
      review: ["hold", "The trial would take time from employees working toward deadlines. Its effect on those deadlines should be estimated before the shorter review is introduced."]},
    low: {
      client: ["own", "The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead\u2019s analytical familiarity supports but does not replace personal engagement."],
      handover: ["hold", "The plan may overload two experienced employees. Their capacity during the deadline should be confirmed before the new responsibilities are agreed."],
      opportunity: ["own", "The assignment is substantial, the team has done similar work, and the lead believes schedules can adjust. The manager should confirm the start date before the client looks elsewhere."],
      development: ["wait", "The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel."],
      review: ["hold", "The trial would take time from employees working toward deadlines. Its effect on those deadlines should be estimated before the shorter review is introduced."]},
    very_low: {
      client: ["delegate", "The project lead developed the recommendation and can explain its effect on the client's costs. Letting the lead hold the discussion keeps the manager's last two hours for the handover."],
      handover: ["hold", "The plan may overload two experienced employees. Their capacity during the deadline should be confirmed before the new responsibilities are agreed."],
      opportunity: ["own", "The assignment is substantial, the team has done similar work, and the lead believes schedules can adjust. The manager should confirm the start date before the client looks elsewhere."],
      development: ["hold", "Readiness for a larger project should be checked against feedback from the leads the employee has worked with. That input would make the discussion better grounded."],
      review: ["hold", "The trial would take time from employees working toward deadlines. Its effect on those deadlines should be estimated before the shorter review is introduced."]}}
}
];
