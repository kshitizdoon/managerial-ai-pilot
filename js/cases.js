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

   November 2026, five caselets with four decisions each:
   - Day Before Travel is dropped, and one decision from each other
     caselet: Monday Project Team / Client escalation, Strong Employee /
     Employee development, Fest Week / Event staffing, Friday Support
     Team / Weekend service allocation, Launch Morning / Team
     responsibilities. They duplicated decisions kept elsewhere.
   - Some AI actions were moved so that every caselet scores the same at
     each advice level on its four decisions (out of 80: high 74,
     moderate 54, low 28, very low 22; one, two, three and four
     decisions away from the preferred action). Each moved action reuses
     the reason written for that action at another level, except Monday
     Project Team / Revised recommendation at very low, which is new.
   - The practice questions and the Own-versus-Delegate example are gone,
     and the instructions are shorter.
   The key is the manual's.

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

window.INSTRUCTIONS = "For each decision, choose who should make it and when. If you would make the decision yourself, even if someone else then carries it out, choose Own. Choose Delegate only if a team member should make the decision instead of you. You may choose the same action more than once.";

/* Case-level order. The five caselets are five different organisations
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
      expansion: ["hold", "A binding scope and timeline promise depends on regulatory implications that have not been assessed. Deferring merely for convenience does not address that prerequisite."],
      recommendation: ["own", "The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations."],
      recovery: ["delegate", "Both project leads know their projects and milestones best. They can agree the reallocation between themselves, which keeps the manager's limited time for client-facing matters today."],
      career: ["wait", "The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines."]},
    moderate: {
      expansion: ["wait", "The client wants a commitment by tomorrow, not today. The manager can give the expansion proper attention tomorrow morning, once today's more pressing client matters are dealt with."],
      recommendation: ["own", "The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations."],
      recovery: ["hold", "The second lead is concerned about upcoming milestones. The effect of losing two consultants on that project should be assessed before anyone commits to the reallocation."],
      career: ["wait", "The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines."]},
    low: {
      expansion: ["own", "A long-standing client is asking to grow the engagement, and the team has delivered similar work before. A firm commitment from the manager secures the opportunity and reassures the client."],
      recommendation: ["own", "The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations."],
      recovery: ["hold", "The second lead is concerned about upcoming milestones. The effect of losing two consultants on that project should be assessed before anyone commits to the reallocation."],
      career: ["hold", "Readiness should be judged against evidence from the employee's recent additional responsibilities. Gathering that input from others before the conversation would make the discussion fairer."]},
    very_low: {
      expansion: ["own", "A long-standing client is asking to grow the engagement, and the team has delivered similar work before. A firm commitment from the manager secures the opportunity and reassures the client."],
      recommendation: ["delegate", "The project lead built the updated numbers and knows the revised assumptions in detail. The lead can finalise the recommendation and send it by 1:00 PM."],
      recovery: ["hold", "The second lead is concerned about upcoming milestones. The effect of losing two consultants on that project should be assessed before anyone commits to the reallocation."],
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
    {k:"review", n:"Performance review",
     t:"A senior analyst has challenged feedback in their year-end evaluation, arguing that it overlooks their contribution to a difficult project. You have reviewed the evidence and formed an assessment. The analyst has requested a discussion this week, while the formal evaluation meeting is scheduled for Thursday.",
     q:"how to respond to the analyst's challenge to their evaluation."}],
  ai: {
    high: {
      presentation: ["delegate", "The senior analyst built the analysis and knows the assumptions in detail. They are best placed to defend the recommendation and can set the team's position before the 2:00 PM deadline."],
      funding: ["hold", "The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs."],
      partner: ["delegate", "This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager\u2019s commercial familiarity."],
      review: ["wait", "The manager has already formed an assessment and a formal discussion is scheduled for Thursday, so a personal discussion can be deferred."]},
    moderate: {
      presentation: ["delegate", "The senior analyst built the analysis and knows the assumptions in detail. They are best placed to defend the recommendation and can set the team's position before the 2:00 PM deadline."],
      funding: ["hold", "The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs."],
      partner: ["delegate", "This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager\u2019s commercial familiarity."],
      review: ["hold", "The analyst says the feedback overlooks their part in a difficult project. Input from colleagues on that project should be collected before the feedback is discussed again."]},
    low: {
      presentation: ["hold", "The client has challenged the commercial assumptions before. The team's position should not be confirmed until those assumptions have been re-tested against the client's latest objections."],
      funding: ["own", "The extra analysis could strengthen tomorrow's presentation, and the vendor deadline is today. Approving the full amount now secures the support while the team starts with existing data."],
      partner: ["delegate", "This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager\u2019s commercial familiarity."],
      review: ["hold", "The analyst says the feedback overlooks their part in a difficult project. Input from colleagues on that project should be collected before the feedback is discussed again."]},
    very_low: {
      presentation: ["wait", "The position is not due until 2:00 PM. The manager can settle it early in the afternoon, after dealing with the vendor deadline and the partner's request."],
      funding: ["wait", "The client information is expected later today. The manager can return to the approval this evening, once the more urgent presentation matters have been handled."],
      partner: ["hold", "The opportunity could involve a different commercial model. The assessment should not go to the partner until the pricing implications of that model have been worked out."],
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
      venue: ["hold", "A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue."],
      programming: ["wait", "The programme discussion is valuable but can be resolved before the later-week schedule deadline after urgent sponsorship and registration choices."]},
    moderate: {
      registration: ["own", "The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment."],
      sponsor: ["own", "The largest sponsor's contribution and next year's agreement are both at stake. The head should negotiate the branding offer personally and settle the terms with the sponsor today."],
      venue: ["hold", "A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue."],
      programming: ["hold", "The proposed format may overlap with an existing event. The session should not be confirmed until the overlap in audience and timing with that event has been checked."]},
    low: {
      registration: ["hold", "The cause of the 22% drop is unclear: the rival festival and the coordinator's exit may both matter. Committing most of the budget should wait until the cause is better understood."],
      sponsor: ["hold", "The reduction rests on expected footfall, which registrations will show when they close next week, and the terms also cover next year\u2019s festival. Final terms can be agreed before the festival opens, so committing before footfall is known would be premature."],
      venue: ["own", "The discounted rate ends this evening and the new event has attracted strong interest. The head should approve the deposit and secure the larger venue before the offer lapses."],
      programming: ["hold", "The proposed format may overlap with an existing event. The session should not be confirmed until the overlap in audience and timing with that event has been checked."]},
    very_low: {
      registration: ["hold", "The cause of the 22% drop is unclear: the rival festival and the coordinator's exit may both matter. Committing most of the budget should wait until the cause is better understood."],
      sponsor: ["own", "The largest sponsor's contribution and next year's agreement are both at stake. The head should negotiate the branding offer personally and settle the terms with the sponsor today."],
      venue: ["own", "The discounted rate ends this evening and the new event has attracted strong interest. The head should approve the deposit and secure the larger venue before the offer lapses."],
      programming: ["hold", "The proposed format may overlap with an existing event. The session should not be confirmed until the overlap in audience and timing with that event has been checked."]}}
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
      guarantee: ["hold", "A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly."],
      process: ["wait", "The process policy is important but implementation is next month. Immediate weekend decisions take priority."],
      recovery: ["own", "The client's ratings have declined and a credible response is expected tonight. The manager should own the recovery plan to show the client senior attention."]},
    moderate: {
      escalation: ["own", "Repeated alleged failures for a major account raise service accountability and commercial relationship concerns beyond an ordinary ticket response."],
      guarantee: ["hold", "A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly."],
      process: ["hold", "The change could increase handling time for complex cases. Its effect on those cases should be measured before deciding whether senior agents get more discretion."],
      recovery: ["own", "The client's ratings have declined and a credible response is expected tonight. The manager should own the recovery plan to show the client senior attention."]},
    low: {
      escalation: ["hold", "The account lead blames unusual demand, while the client says commitments were missed. The ticket data should be reviewed to establish which account is right before the team responds."],
      guarantee: ["own", "A substantial contract renewal depends on this answer, and similar failures were fixed within a day before. The manager should give the client a firm commitment tonight."],
      process: ["wait", "The process policy is important but implementation is next month. Immediate weekend decisions take priority."],
      recovery: ["wait", "The plan uses existing staff and stays within agreed service levels, so nothing has to change before Monday. The manager can review it properly after the weekend."]},
    very_low: {
      escalation: ["hold", "The account lead blames unusual demand, while the client says commitments were missed. The ticket data should be reviewed to establish which account is right before the team responds."],
      guarantee: ["own", "A substantial contract renewal depends on this answer, and similar failures were fixed within a day before. The manager should give the client a firm commitment tonight."],
      process: ["hold", "The change could increase handling time for complex cases. Its effect on those cases should be measured before deciding whether senior agents get more discretion."],
      recovery: ["own", "The client's ratings have declined and a credible response is expected tonight. The manager should own the recovery plan to show the client senior attention."]}}
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
     q:"which group gets dedicated trainers during opening week."}],
  ai: {
    high: {
      corporate: ["own", "A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment."],
      announcement: ["delegate", "The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions."],
      readiness: ["hold", "The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check."],
      trainers: ["own", "Both groups matter: one brings loyal members, the other substantial new business. Choosing which group gets dedicated trainers is a judgement the manager should make personally today."]},
    moderate: {
      corporate: ["delegate", "The customer lead handles memberships and knows what early members paid. They can agree terms with the company within the opening plan while the manager prepares the launch."],
      announcement: ["delegate", "The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions."],
      readiness: ["hold", "The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check."],
      trainers: ["wait", "The second group can be fully supported from the following week. The allocation can be confirmed after the opening, once the manager has seen how busy the first days are."]},
    low: {
      corporate: ["own", "A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment."],
      announcement: ["hold", "A competitor has just announced a similar offer. The revised message should not go out until its likely effect on early membership sales has been checked."],
      readiness: ["own", "Staff have rearranged the equipment and expect fewer customers at first. The manager should confirm the noon opening so booked customers and classes go ahead as planned."],
      trainers: ["wait", "The second group can be fully supported from the following week. The allocation can be confirmed after the opening, once the manager has seen how busy the first days are."]},
    very_low: {
      corporate: ["delegate", "The customer lead handles memberships and knows what early members paid. They can agree terms with the company within the opening plan while the manager prepares the launch."],
      announcement: ["hold", "A competitor has just announced a similar offer. The revised message should not go out until its likely effect on early membership sales has been checked."],
      readiness: ["own", "Staff have rearranged the equipment and expect fewer customers at first. The manager should confirm the noon opening so booked customers and classes go ahead as planned."],
      trainers: ["wait", "The second group can be fully supported from the following week. The allocation can be confirmed after the opening, once the manager has seen how busy the first days are."]}}
}
];
