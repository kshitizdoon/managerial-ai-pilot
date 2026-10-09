/* =============================================================
   cases.js — everything respondents read.

   Source: Managerial Decision Survey researcher manual, 8 October 2026
   (round 2, tracked changes accepted). Six caselets, five decisions
   each, four actions. Decision text and AI advice are copied from the
   manual; do not edit one without the other.

   A caselet:
     id        stable id. Saved responses refer to it; never reuse one.
     art       which illustration (js/art.js) heads the caselet
     when      the time line, as written in the manual
     opening   the context paragraph
     decisions [{k, n, t}]  k is the stable decision id, n the title,
               t the text. Add after:["k"] to a decision if it must
               follow another one when decision order is randomised.
     ai        the advisor's action and one-line reason for each
               decision, at four quality levels. Quality is the plan's
               own score under key.js; it is never shown to respondents.

   Same rules as before for the text itself: no label words on a
   decision ("urgent", "can wait", "delegate", "check first"), and no
   decision states both a fact and what it implies.
   ============================================================= */

/* The four actions: key, label, short gloss shown on every option,
   and the full definition shown in the instructions and on demand. */
window.ACTIONS = [
  ["own",      "Own",      "decide personally now",
   "Make the decision yourself now. Others may advise you or carry out what you decide."],
  ["delegate", "Delegate", "team member decides",
   "Entrust the decision to a capable team member now. They choose the course of action within their authority, without needing your approval."],
  ["wait",     "Wait",     "decide later",
   "Keep the decision for yourself and address it later; it is ready to be made."],
  ["hold",     "Hold",     "prerequisite missing",
   "Do not commit until essential information, capability or another prerequisite is available. You may still respond without committing."]
];

window.INSTRUCTIONS = "For each situation, choose the most appropriate managerial action given the other demands on your time. Your choice concerns who should take responsibility for the decision and whether it can responsibly be made now, not who performs the routine implementation work. If you would make the decision yourself, including a decision to give someone a task or role, choose Own; choose Delegate only if a team member should make the decision instead of you. You may choose the same action more than once.";

/* Practice: tells Wait from Hold before the first caselet. Not scored.
   Not from the manual, which asks for a practice question but gives no
   text. Review before fielding. */
window.PRACTICE = {
  items: [
    {k:"a", n:"Training programme",
     t:"Your team has asked you to choose between two training programmes for next quarter. You have everything you need to decide, and the choice is due at the end of the month.",
     answer:"wait"},
    {k:"b", n:"Supplier contract",
     t:"A supplier offers a discount if you sign a contract today. Whether its product meets your safety standard will not be known until test results arrive tomorrow.",
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
  opening: "You manage a 12-person consulting team handling several client assignments. Your project leads regularly manage client relationships and delivery decisions for their own projects independently, while you remain accountable for major commitments. You have approximately three hours available today for direct involvement in these matters.",
  decisions: [
    {k:"escalation", n:"Client escalation",
     t:"A client has questioned the team's recommendation after receiving conflicting figures from two departments. The project lead developed the recommendation and understands both data sources, but the client relationship has become sensitive following delays in the previous engagement. A response is expected today."},
    {k:"expansion", n:"Project expansion",
     t:"A long-standing client wants to expand an ongoing engagement into a new business area. The team has delivered similar work before, but the proposed scope involves regulatory requirements that have not yet been reviewed. The client wants a firm commitment on scope and delivery timelines by tomorrow."},
    {k:"recommendation", n:"Revised recommendation",
     t:"A client requests a revised cost recommendation by 1:00 PM. The current project lead has developed the updated numbers, but the recommendation involves changing assumptions that you agreed directly with the client during last year's engagement. The client expects a final recommendation today."},
    {k:"recovery", n:"Delivery recovery",
     t:"A project is behind schedule after the client requested additional analysis. Its project lead proposes borrowing two consultants from another assignment. The second project lead believes the change is manageable but is concerned about upcoming milestones. Both clients expect updates today, and the team needs a decision on the proposed reallocation."},
    {k:"career", n:"Performance discussion",
     t:"A high-performing project lead has requested a discussion about taking on a larger role. The employee has recently taken on additional responsibilities and expects clarity about future opportunities. You have a view on their readiness, and the next formal role review is scheduled for later this month."}],
  ai: {
    high: {
      escalation: ["delegate", "Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline."],
      expansion: ["hold", "A binding scope and timeline promise depends on regulatory implications that have not been assessed. Deferring merely for convenience does not address that prerequisite."],
      recommendation: ["own", "The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations."],
      recovery: ["delegate", "A capable lead can take responsibility while the manager preserves attention for other commitments."],
      career: ["wait", "The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines."]},
    moderate: {
      escalation: ["delegate", "Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline."],
      expansion: ["wait", "The manager can revisit this decision after addressing more immediate matters."],
      recommendation: ["own", "The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations."],
      recovery: ["hold", "A further check would reduce the risk of committing too early."],
      career: ["wait", "The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines."]},
    low: {
      escalation: ["delegate", "Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline."],
      expansion: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      recommendation: ["own", "The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations."],
      recovery: ["hold", "A further check would reduce the risk of committing too early."],
      career: ["hold", "A further check would reduce the risk of committing too early."]},
    very_low: {
      escalation: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      expansion: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      recommendation: ["hold", "A further check would reduce the risk of committing too early."],
      recovery: ["wait", "The manager can revisit this decision after addressing more immediate matters."],
      career: ["hold", "A further check would reduce the risk of committing too early."]}}
},

{
  id: 2, name: "Strong Employee", art: "analytics",
  when: "9:00 AM, Monday",
  opening: "You manage an eight-person analytics team preparing a major client presentation for tomorrow. Two senior analysts can independently lead assignments, although you remain accountable for client commitments. You have approximately three hours available today for direct involvement in the matters below.",
  decisions: [
    {k:"presentation", n:"Client presentation",
     t:"A client has questioned a recommendation that could affect its annual operating budget. The senior analyst who developed the analysis believes the recommendation is sound, but the client has challenged the team's commercial assumptions in earlier discussions. The client expects your team's position by 2:00 PM."},
    {k:"funding", n:"Financial commitment",
     t:"Finance has asked you to approve \u20b94 lakh for additional analytical support before today\u2019s vendor deadline. The support could strengthen tomorrow\u2019s client presentation. The team can begin some work using existing data, but completing the proposed analysis depends on client information expected later today. The vendor requires a commitment for the full amount."},
    {k:"partner", n:"Partner request",
     t:"A partner has requested an initial assessment of an opportunity with an existing client by tomorrow morning. The opportunity builds on the team's current work but could involve a different commercial model. A senior analyst has worked closely with the client, while you have participated in earlier discussions about the account."},
    {k:"appointment", n:"Employee development",
     t:"A strong-performing analyst has asked to lead a new client workstream beginning next week. The employee has managed internal teams successfully but has limited experience handling difficult client conversations. The workstream is commercially important, and a decision on whether to appoint the analyst as lead is needed today. If appointed, the analyst would manage the workstream\u2019s delivery."},
    {k:"review", n:"Performance review",
     t:"A senior analyst has challenged feedback in their year-end evaluation, arguing that it overlooks their contribution to a difficult project. You have reviewed the evidence and formed an assessment. The analyst has requested a discussion this week, while the formal evaluation meeting is scheduled for Thursday."}],
  ai: {
    high: {
      presentation: ["delegate", "A capable lead can take responsibility while the manager preserves attention for other commitments."],
      funding: ["hold", "The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs."],
      partner: ["delegate", "This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager\u2019s commercial familiarity."],
      appointment: ["own", "Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst\u2019s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no."],
      review: ["wait", "The manager has already formed an assessment and a formal discussion is scheduled for Thursday, so a personal discussion can be deferred."]},
    moderate: {
      presentation: ["delegate", "A capable lead can take responsibility while the manager preserves attention for other commitments."],
      funding: ["hold", "The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs."],
      partner: ["delegate", "This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager\u2019s commercial familiarity."],
      appointment: ["own", "Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst\u2019s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no."],
      review: ["hold", "A further check would reduce the risk of committing too early."]},
    low: {
      presentation: ["hold", "A further check would reduce the risk of committing too early."],
      funding: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      partner: ["delegate", "This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager\u2019s commercial familiarity."],
      appointment: ["own", "Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst\u2019s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no."],
      review: ["hold", "A further check would reduce the risk of committing too early."]},
    very_low: {
      presentation: ["wait", "The manager can revisit this decision after addressing more immediate matters."],
      funding: ["wait", "The manager can revisit this decision after addressing more immediate matters."],
      partner: ["hold", "A further check would reduce the risk of committing too early."],
      appointment: ["wait", "The manager can revisit this decision after addressing more immediate matters."],
      review: ["own", "The potential consequences justify direct managerial involvement despite competing demands."]}}
},

{
  id: 5, name: "Fest Week", art: "festival",
  when: "10:00 AM, Monday",
  opening: "You head your institute's festival committee. The festival opens in three weeks, with registrations closing next week. Your committee leads independently manage sponsorships, outreach, operations, and event teams within agreed budgets. You remain accountable for major financial commitments and event safety. You have approximately three hours available today for direct involvement in the following matters.",
  decisions: [
    {k:"registration", n:"Registration strategy",
     t:"Registrations from a major partner campus are 22% below last year. A rival festival has moved to the same weekend, while the campus coordinator recently stepped down. The outreach team proposes using most of the remaining \u20b91.5 lakh publicity budget on a targeted campaign. A decision is needed today to secure the campaign slots."},
    {k:"sponsor", n:"Sponsor negotiation",
     t:"Your largest sponsor wants to reduce its contribution by 10%, citing weaker expected footfall. The sponsorship lead proposes offering additional branding opportunities instead of accepting the reduction. Some of these opportunities could also interest other sponsors, and the agreement covers next year's festival. The sponsor expects a response today, although final terms can be agreed any time before the festival opens."},
    {k:"staffing", n:"Event staffing",
     t:"Registrations for one of the festival's largest events have exceeded expectations. Its lead requests additional experienced volunteers, which would reduce support for two smaller events. The volunteer committee has proposed a revised allocation, but the affected event leads disagree about the impact. Staffing plans must be confirmed today."},
    {k:"venue", n:"Venue commitment",
     t:"A new event has attracted strong interest, and a larger off-campus venue is available at a discounted rate until this evening. The venue has hosted similar events, but the expected attendance is considerably higher than at previous institute events. The committee's entry and exit arrangements were designed for smaller venues, and it is unclear whether they would work for the expected crowd. Confirmation requires a non-refundable deposit."},
    {k:"programming", n:"Festival programming",
     t:"Several alumni have offered to participate in an industry networking session, which could strengthen the festival's professional outreach. You have been developing the programme with the student team, but its proposed format may overlap with an existing event. The schedule will be finalized later this week, while sponsor and registration decisions require attention today."}],
  ai: {
    high: {
      registration: ["own", "The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment."],
      sponsor: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      staffing: ["delegate", "The volunteer committee can reconcile staffing among planned events. It is consequential but within its remit, so the head should avoid taking over the allocation."],
      venue: ["hold", "A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue."],
      programming: ["wait", "The programme discussion is valuable but can be resolved before the later-week schedule deadline after urgent sponsorship and registration choices."]},
    moderate: {
      registration: ["own", "The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment."],
      sponsor: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      staffing: ["delegate", "The volunteer committee can reconcile staffing among planned events. It is consequential but within its remit, so the head should avoid taking over the allocation."],
      venue: ["hold", "A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue."],
      programming: ["hold", "A further check would reduce the risk of committing too early."]},
    low: {
      registration: ["own", "The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment."],
      sponsor: ["hold", "The reduction rests on expected footfall, which registrations will show when they close next week, and the terms also cover next year\u2019s festival. Final terms can be agreed before the festival opens, so committing before footfall is known would be premature."],
      staffing: ["hold", "A further check would reduce the risk of committing too early."],
      venue: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      programming: ["hold", "A further check would reduce the risk of committing too early."]},
    very_low: {
      registration: ["hold", "A further check would reduce the risk of committing too early."],
      sponsor: ["delegate", "A capable lead can take responsibility while the manager preserves attention for other commitments."],
      staffing: ["hold", "A further check would reduce the risk of committing too early."],
      venue: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      programming: ["delegate", "A capable lead can take responsibility while the manager preserves attention for other commitments."]}}
},

{
  id: 4, name: "Friday Support Team", art: "support",
  when: "6:30 PM, Friday",
  opening: "You lead a 10-person customer support team serving several business clients. Your two team leads independently manage client relationships, service delivery, and staffing within agreed commitments. You remain responsible for major contractual decisions. You have approximately two hours available this evening, and the team operates with reduced staffing over the weekend.",
  decisions: [
    {k:"escalation", n:"Customer escalation",
     t:"A major client has complained about repeated delays in resolving support requests. The account represents a significant share of your team's revenue, and the client has questioned whether agreed service standards are being maintained. The account lead attributes the delays to unusually high demand, while the client believes the team has repeatedly missed its commitments. A response is expected before the weekend."},
    {k:"weekend", n:"Weekend service allocation",
     t:"A major client expects additional weekend support following recent complaints. The account lead proposes temporarily moving an experienced agent from another account, where service has been stable but an important client review is due next week. Both accounts would remain within existing service commitments, and the weekend arrangement must be confirmed tonight."},
    {k:"guarantee", n:"Service commitment",
     t:"A client experiencing recurring system failures wants guaranteed resolution by Monday morning. Similar failures have previously been resolved within a day, but the current incident has persisted despite the team's initial intervention. The client is considering renewing a substantial support contract and wants a firm commitment tonight."},
    {k:"process", n:"Process improvement",
     t:"A team lead has proposed changing the escalation process after several customers complained about being transferred between agents. The proposal would give senior agents greater discretion to resolve complaints but could increase handling time for complex cases. The change is planned for next month's operating cycle, and the lead wants your decision before finalizing the implementation plan."},
    {k:"recovery", n:"Client recovery plan",
     t:"A client whose service ratings have declined wants a recovery plan before the weekend. The account lead proposes closer monitoring and changes to how complaints are escalated. The plan would use the account\u2019s existing staff and stay within agreed service levels, though responses to new requests may be slower. The client expects a credible response tonight."}],
  ai: {
    high: {
      escalation: ["own", "Repeated alleged failures for a major account raise service accountability and commercial relationship concerns beyond an ordinary ticket response."],
      weekend: ["delegate", "The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time."],
      guarantee: ["hold", "A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly."],
      process: ["wait", "The process policy is important but implementation is next month. Immediate weekend decisions take priority."],
      recovery: ["own", "The potential consequences justify direct managerial involvement despite competing demands."]},
    moderate: {
      escalation: ["own", "Repeated alleged failures for a major account raise service accountability and commercial relationship concerns beyond an ordinary ticket response."],
      weekend: ["delegate", "The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time."],
      guarantee: ["hold", "A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly."],
      process: ["hold", "A further check would reduce the risk of committing too early."],
      recovery: ["own", "The potential consequences justify direct managerial involvement despite competing demands."]},
    low: {
      escalation: ["hold", "A further check would reduce the risk of committing too early."],
      weekend: ["delegate", "The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time."],
      guarantee: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      process: ["wait", "The process policy is important but implementation is next month. Immediate weekend decisions take priority."],
      recovery: ["wait", "The manager can revisit this decision after addressing more immediate matters."]},
    very_low: {
      escalation: ["wait", "The manager can revisit this decision after addressing more immediate matters."],
      weekend: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      guarantee: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      process: ["delegate", "A capable lead can take responsibility while the manager preserves attention for other commitments."],
      recovery: ["wait", "The manager can revisit this decision after addressing more immediate matters."]}}
},

{
  id: 1, name: "Launch Morning", art: "fitness",
  when: "9:00 AM, Tuesday",
  opening: "You manage a chain of fitness centres and are opening a new branch at noon today. A 12-person team is handling the opening, with experienced leads who independently manage customers, operations, and marketing within the approved opening plan. You remain accountable for pricing and customer safety. You have around two hours available this morning for direct involvement in the following matters.",
  decisions: [
    {k:"corporate", n:"Corporate membership",
     t:"A nearby company wants discounted memberships for 40 employees before the branch opens. The offer could bring regular business, but the proposed price is lower than what early members have already paid. The company wants confirmation before noon."},
    {k:"announcement", n:"Opening announcement",
     t:"A competing fitness centre has announced a similar membership offer nearby. Your marketing lead proposes changing today's opening promotion to emphasize personal training rather than discounted memberships. The revised message would stay within the approved marketing budget, and the announcement is due this morning."},
    {k:"readiness", n:"Opening readiness",
     t:"The branch opens at noon, with customers booked for the afternoon. During yesterday\u2019s trial, the exercise area became crowded when several groups used it together. Staff have rearranged the equipment and expect fewer customers at first, but the revised layout has not been tested with a full group. Confirming the opening would also confirm the advertised class schedule."},
    {k:"trainers", n:"Customer experience",
     t:"Two groups have requested dedicated trainers during opening week. One includes long-standing members transferring from another branch; the other could bring substantial new business. The team can fully support only one without reducing regular services, but the other can be fully supported from the following week. The customer experience lead knows both groups and has proposed an arrangement, and both groups expect confirmation today."},
    {k:"roles", n:"Team responsibilities",
     t:"A senior trainer has suggested changing how staff responsibilities are divided to reduce delays in handling member requests. The proposed changes could improve service but would alter the schedules of employees who have worked together for several months. The new arrangements would begin next month."}],
  ai: {
    high: {
      corporate: ["own", "A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment."],
      announcement: ["delegate", "The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions."],
      readiness: ["hold", "The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check."],
      trainers: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      roles: ["wait", "Workstream changes begin next month and can receive personal attention after today\u2019s opening."]},
    moderate: {
      corporate: ["own", "A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment."],
      announcement: ["delegate", "The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions."],
      readiness: ["hold", "The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check."],
      trainers: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      roles: ["hold", "A further check would reduce the risk of committing too early."]},
    low: {
      corporate: ["own", "A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment."],
      announcement: ["hold", "A further check would reduce the risk of committing too early."],
      readiness: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      trainers: ["delegate", "Allocating dedicated trainers for opening week sits with the customer experience lead, who knows both groups. The other group can be fully supported from the following week and no price or policy exception is involved, so the manager can keep attention for higher-stakes decisions."],
      roles: ["hold", "A further check would reduce the risk of committing too early."]},
    very_low: {
      corporate: ["delegate", "A capable lead can take responsibility while the manager preserves attention for other commitments."],
      announcement: ["hold", "A further check would reduce the risk of committing too early."],
      readiness: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      trainers: ["wait", "The manager can revisit this decision after addressing more immediate matters."],
      roles: ["hold", "A further check would reduce the risk of committing too early."]}}
},

{
  id: 6, name: "Day Before Travel", art: "travel",
  when: "4:00 PM, Wednesday",
  opening: "You manage a 10-person team handling several client projects. You are travelling tomorrow morning for a three-day meeting and will have limited availability during the trip. Your team leads can independently manage projects and client discussions within existing commitments. You have approximately two hours available today to address the following matters.",
  decisions: [
    {k:"client", n:"Client disagreement",
     t:"A client has questioned a recommendation made by your team and wants a discussion before you travel. The project lead developed the recommendation and believes it is justified, but the client has raised concerns about its effect on their costs. The client has worked directly with you on earlier projects."},
    {k:"handover", n:"Project handover",
     t:"A major project reaches an important deadline while you are away. The project lead has proposed a delivery plan that requires adjusting responsibilities across the team. The plan could improve delivery speed but may increase the workload of two experienced employees. The team needs clarity before you leave."},
    {k:"opportunity", n:"New client opportunity",
     t:"A potential client has offered a substantial assignment beginning next week. The team has completed similar work, and the project lead believes it can be managed by adjusting current schedules. Two existing projects also have important deadlines next week. The client wants a firm start-date commitment before you travel."},
    {k:"development", n:"Team development",
     t:"A high-performing employee has requested a discussion about taking responsibility for a larger project. You have reviewed their recent performance and have a view on their readiness. The project would begin next month, and the employee would like to discuss the opportunity before you travel."},
    {k:"review", n:"Project review",
     t:"Two client projects have recently suffered delays because problems were identified too late. The team lead running both projects proposes testing a shorter weekly progress review on them during your three-day absence. The change could identify issues earlier but would take time from employees already working toward deadlines. The team wants direction before you leave."}],
  ai: {
    high: {
      client: ["own", "The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead\u2019s analytical familiarity supports but does not replace personal engagement."],
      handover: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      opportunity: ["hold", "A firm start date risks disrupting two existing deadlines; the team\u2019s optimistic scheduling view is not sufficient confirmation of capacity."],
      development: ["wait", "The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel."],
      review: ["delegate", "The lead running both projects can trial the change on them while the manager is away. This preserves learning without committing the organization to a permanent process change."]},
    moderate: {
      client: ["own", "The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead\u2019s analytical familiarity supports but does not replace personal engagement."],
      handover: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      opportunity: ["hold", "A firm start date risks disrupting two existing deadlines; the team\u2019s optimistic scheduling view is not sufficient confirmation of capacity."],
      development: ["wait", "The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel."],
      review: ["hold", "A further check would reduce the risk of committing too early."]},
    low: {
      client: ["own", "The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead\u2019s analytical familiarity supports but does not replace personal engagement."],
      handover: ["hold", "A further check would reduce the risk of committing too early."],
      opportunity: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      development: ["wait", "The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel."],
      review: ["hold", "A further check would reduce the risk of committing too early."]},
    very_low: {
      client: ["delegate", "A capable lead can take responsibility while the manager preserves attention for other commitments."],
      handover: ["hold", "A further check would reduce the risk of committing too early."],
      opportunity: ["own", "The potential consequences justify direct managerial involvement despite competing demands."],
      development: ["hold", "A further check would reduce the risk of committing too early."],
      review: ["hold", "A further check would reduce the risk of committing too early."]}}
}
];
