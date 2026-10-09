# Instrument

Generated from `js/cases.js`, `js/key.js` and `js/scoring.js`. Do not edit by hand; run `node make-docs.js`.

Instrument version `survey-2026-10-round2`, cases `4242e73d`, key `5505a7da`, scoring v2.

## Instructions respondents read

For each situation, choose the most appropriate managerial action given the other demands on your time. Your choice concerns who should take responsibility for the decision and whether it can responsibly be made now, not who performs the routine implementation work. If you would make the decision yourself, including a decision to give someone a task or role, choose Own; choose Delegate only if a team member should make the decision instead of you. You may choose the same action more than once.

| Action | Shown on each option | Definition |
| --- | --- | --- |
| Own | decide personally now | Make the decision yourself now. Others may advise you or carry out what you decide. |
| Delegate | team member decides | Entrust the decision to a capable team member now. They choose the course of action within their authority, without needing your approval. |
| Wait | decide later | Keep the decision for yourself and address it later; it is ready to be made. |
| Hold | prerequisite missing | Do not commit until essential information, capability or another prerequisite is available. You may still respond without committing. |

## Practice question (Wait versus Hold, not scored)

- **Training programme** (expected: Wait). Your team has asked you to choose between two training programmes for next quarter. You have everything you need to decide, and the choice is due at the end of the month.
- **Supplier contract** (expected: Hold). A supplier offers a discount if you sign a contract today. Whether its product meets your safety standard will not be known until test results arrive tomorrow.

Feedback shown after answering: Training programme is Wait: the decision is ready to be made, it just does not need your time today. Supplier contract is Hold: something essential is missing, so you should not commit until the test results arrive.

## Order and AI advice assignment

Caselet order is randomised per respondent. Decision order inside a caselet is fixed, as numbered below. Both orders are stored on every response.

Each respondent is given one of 4 AI conditions at random. The condition rotates the four advice levels across the caselets, so every respondent sees every level, and across the conditions every caselet appears at every level once. Levels and scores are never shown to respondents.

| Caselet | Condition 0 | Condition 1 | Condition 2 | Condition 3 |
| --- | --- | --- | --- | --- |
| Monday Project Team | High | Moderate | Low | Very low |
| Strong Employee | Moderate | Low | Very low | High |
| Fest Week | Low | Very low | High | Moderate |
| Friday Support Team | Very low | High | Moderate | Low |
| Launch Morning | High | Moderate | Low | Very low |
| Day Before Travel | Moderate | Low | Very low | High |

## Scoring

Every decision scores all four actions from 0 to 20; each decision has exactly one 20, its preferred action. A caselet score is the sum of its five decision scores, 0 to 100, for the first answers, the final answers and the AI advice alike.

| Caselet | High advice | Moderate advice | Low advice | Very low advice |
| --- | --- | --- | --- | --- |
| Monday Project Team | 94 | 74 | 48 | 22 |
| Strong Employee | 94 | 74 | 48 | 22 |
| Fest Week | 94 | 74 | 48 | 22 |
| Friday Support Team | 94 | 74 | 48 | 22 |
| Launch Morning | 94 | 74 | 48 | 22 |
| Day Before Travel | 94 | 74 | 48 | 22 |

## Monday Project Team (case 3)

*9:00 AM, Monday*

You manage a 12-person consulting team handling several client assignments. Your project leads regularly manage client relationships and delivery decisions for their own projects independently, while you remain accountable for major commitments. You have approximately three hours available today for direct involvement in these matters.

1. **Client escalation** (`escalation`). A client has questioned the team's recommendation after receiving conflicting figures from two departments. The project lead developed the recommendation and understands both data sources, but the client relationship has become sensitive following delays in the previous engagement. A response is expected today.
2. **Project expansion** (`expansion`). A long-standing client wants to expand an ongoing engagement into a new business area. The team has delivered similar work before, but the proposed scope involves regulatory requirements that have not yet been reviewed. The client wants a firm commitment on scope and delivery timelines by tomorrow.
3. **Revised recommendation** (`recommendation`). A client requests a revised cost recommendation by 1:00 PM. The current project lead has developed the updated numbers, but the recommendation involves changing assumptions that you agreed directly with the client during last year's engagement. The client expects a final recommendation today.
4. **Delivery recovery** (`recovery`). A project is behind schedule after the client requested additional analysis. Its project lead proposes borrowing two consultants from another assignment. The second project lead believes the change is manageable but is concerned about upcoming milestones. Both clients expect updates today, and the team needs a decision on the proposed reallocation.
5. **Performance discussion** (`career`). A high-performing project lead has requested a discussion about taking on a larger role. The employee has recently taken on additional responsibilities and expects clarity about future opportunities. You have a view on their readiness, and the next formal role review is scheduled for later this month.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Client escalation | 15 | 20 | 0 | 3 | Delegate |
| Project expansion | 4 | 5 | 10 | 20 | Hold |
| Revised recommendation | 20 | 14 | 0 | 3 | Own |
| Delivery recovery | 20 | 14 | 0 | 4 | Own |
| Performance discussion | 11 | 5 | 20 | 0 | Wait |

**AI advice**

*High: 94/100, 4 of 5 preferred*

1. Client escalation: **Delegate**. Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline.
2. Project expansion: **Hold**. A binding scope and timeline promise depends on regulatory implications that have not been assessed. Deferring merely for convenience does not address that prerequisite.
3. Revised recommendation: **Own**. The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations.
4. Delivery recovery: **Delegate**. A capable lead can take responsibility while the manager preserves attention for other commitments.
5. Performance discussion: **Wait**. The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines.

*Moderate: 74/100, 3 of 5 preferred*

1. Client escalation: **Delegate**. Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline.
2. Project expansion: **Wait**. The manager can revisit this decision after addressing more immediate matters.
3. Revised recommendation: **Own**. The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations.
4. Delivery recovery: **Hold**. A further check would reduce the risk of committing too early.
5. Performance discussion: **Wait**. The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines.

*Low: 48/100, 2 of 5 preferred*

1. Client escalation: **Delegate**. Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline.
2. Project expansion: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
3. Revised recommendation: **Own**. The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations.
4. Delivery recovery: **Hold**. A further check would reduce the risk of committing too early.
5. Performance discussion: **Hold**. A further check would reduce the risk of committing too early.

*Very low: 22/100, 0 of 5 preferred*

1. Client escalation: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
2. Project expansion: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
3. Revised recommendation: **Hold**. A further check would reduce the risk of committing too early.
4. Delivery recovery: **Wait**. The manager can revisit this decision after addressing more immediate matters.
5. Performance discussion: **Hold**. A further check would reduce the risk of committing too early.

## Strong Employee (case 2)

*9:00 AM, Monday*

You manage an eight-person analytics team preparing a major client presentation for tomorrow. Two senior analysts can independently lead assignments, although you remain accountable for client commitments. You have approximately three hours available today for direct involvement in the matters below.

1. **Client presentation** (`presentation`). A client has questioned a recommendation that could affect its annual operating budget. The senior analyst who developed the analysis believes the recommendation is sound, but the client has challenged the team's commercial assumptions in earlier discussions. The client expects your team's position by 2:00 PM.
2. **Financial commitment** (`funding`). Finance has asked you to approve ₹4 lakh for additional analytical support before today’s vendor deadline. The support could strengthen tomorrow’s client presentation. The team can begin some work using existing data, but completing the proposed analysis depends on client information expected later today. The vendor requires a commitment for the full amount.
3. **Partner request** (`partner`). A partner has requested an initial assessment of an opportunity with an existing client by tomorrow morning. The opportunity builds on the team's current work but could involve a different commercial model. A senior analyst has worked closely with the client, while you have participated in earlier discussions about the account.
4. **Employee development** (`appointment`). A strong-performing analyst has asked to lead a new client workstream beginning next week. The employee has managed internal teams successfully but has limited experience handling difficult client conversations. The workstream is commercially important, and a decision on whether to appoint the analyst as lead is needed today. If appointed, the analyst would manage the workstream’s delivery.
5. **Performance review** (`review`). A senior analyst has challenged feedback in their year-end evaluation, arguing that it overlooks their contribution to a difficult project. You have reviewed the evidence and formed an assessment. The analyst has requested a discussion this week, while the formal evaluation meeting is scheduled for Thursday.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Client presentation | 20 | 14 | 0 | 4 | Own |
| Financial commitment | 4 | 4 | 11 | 20 | Hold |
| Partner request | 14 | 20 | 5 | 0 | Delegate |
| Employee development | 20 | 10 | 0 | 5 | Own |
| Performance review | 11 | 5 | 20 | 0 | Wait |

**AI advice**

*High: 94/100, 4 of 5 preferred*

1. Client presentation: **Delegate**. A capable lead can take responsibility while the manager preserves attention for other commitments.
2. Financial commitment: **Hold**. The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs.
3. Partner request: **Delegate**. This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager’s commercial familiarity.
4. Employee development: **Own**. Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst’s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no.
5. Performance review: **Wait**. The manager has already formed an assessment and a formal discussion is scheduled for Thursday, so a personal discussion can be deferred.

*Moderate: 74/100, 3 of 5 preferred*

1. Client presentation: **Delegate**. A capable lead can take responsibility while the manager preserves attention for other commitments.
2. Financial commitment: **Hold**. The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs.
3. Partner request: **Delegate**. This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager’s commercial familiarity.
4. Employee development: **Own**. Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst’s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no.
5. Performance review: **Hold**. A further check would reduce the risk of committing too early.

*Low: 48/100, 2 of 5 preferred*

1. Client presentation: **Hold**. A further check would reduce the risk of committing too early.
2. Financial commitment: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
3. Partner request: **Delegate**. This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager’s commercial familiarity.
4. Employee development: **Own**. Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst’s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no.
5. Performance review: **Hold**. A further check would reduce the risk of committing too early.

*Very low: 22/100, 0 of 5 preferred*

1. Client presentation: **Wait**. The manager can revisit this decision after addressing more immediate matters.
2. Financial commitment: **Wait**. The manager can revisit this decision after addressing more immediate matters.
3. Partner request: **Hold**. A further check would reduce the risk of committing too early.
4. Employee development: **Wait**. The manager can revisit this decision after addressing more immediate matters.
5. Performance review: **Own**. The potential consequences justify direct managerial involvement despite competing demands.

## Fest Week (case 5)

*10:00 AM, Monday*

You head your institute's festival committee. The festival opens in three weeks, with registrations closing next week. Your committee leads independently manage sponsorships, outreach, operations, and event teams within agreed budgets. You remain accountable for major financial commitments and event safety. You have approximately three hours available today for direct involvement in the following matters.

1. **Registration strategy** (`registration`). Registrations from a major partner campus are 22% below last year. A rival festival has moved to the same weekend, while the campus coordinator recently stepped down. The outreach team proposes using most of the remaining ₹1.5 lakh publicity budget on a targeted campaign. A decision is needed today to secure the campaign slots.
2. **Sponsor negotiation** (`sponsor`). Your largest sponsor wants to reduce its contribution by 10%, citing weaker expected footfall. The sponsorship lead proposes offering additional branding opportunities instead of accepting the reduction. Some of these opportunities could also interest other sponsors, and the agreement covers next year's festival. The sponsor expects a response today, although final terms can be agreed any time before the festival opens.
3. **Event staffing** (`staffing`). Registrations for one of the festival's largest events have exceeded expectations. Its lead requests additional experienced volunteers, which would reduce support for two smaller events. The volunteer committee has proposed a revised allocation, but the affected event leads disagree about the impact. Staffing plans must be confirmed today.
4. **Venue commitment** (`venue`). A new event has attracted strong interest, and a larger off-campus venue is available at a discounted rate until this evening. The venue has hosted similar events, but the expected attendance is considerably higher than at previous institute events. The committee's entry and exit arrangements were designed for smaller venues, and it is unclear whether they would work for the expected crowd. Confirmation requires a non-refundable deposit.
5. **Festival programming** (`programming`). Several alumni have offered to participate in an industry networking session, which could strengthen the festival's professional outreach. You have been developing the programme with the student team, but its proposed format may overlap with an existing event. The schedule will be finalized later this week, while sponsor and registration decisions require attention today.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Registration strategy | 20 | 14 | 0 | 4 | Own |
| Sponsor negotiation | 14 | 5 | 11 | 20 | Hold |
| Event staffing | 14 | 20 | 0 | 4 | Delegate |
| Venue commitment | 4 | 4 | 10 | 20 | Hold |
| Festival programming | 11 | 5 | 20 | 0 | Wait |

**AI advice**

*High: 94/100, 4 of 5 preferred*

1. Registration strategy: **Own**. The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment.
2. Sponsor negotiation: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
3. Event staffing: **Delegate**. The volunteer committee can reconcile staffing among planned events. It is consequential but within its remit, so the head should avoid taking over the allocation.
4. Venue commitment: **Hold**. A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue.
5. Festival programming: **Wait**. The programme discussion is valuable but can be resolved before the later-week schedule deadline after urgent sponsorship and registration choices.

*Moderate: 74/100, 3 of 5 preferred*

1. Registration strategy: **Own**. The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment.
2. Sponsor negotiation: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
3. Event staffing: **Delegate**. The volunteer committee can reconcile staffing among planned events. It is consequential but within its remit, so the head should avoid taking over the allocation.
4. Venue commitment: **Hold**. A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue.
5. Festival programming: **Hold**. A further check would reduce the risk of committing too early.

*Low: 48/100, 2 of 5 preferred*

1. Registration strategy: **Own**. The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment.
2. Sponsor negotiation: **Hold**. The reduction rests on expected footfall, which registrations will show when they close next week, and the terms also cover next year’s festival. Final terms can be agreed before the festival opens, so committing before footfall is known would be premature.
3. Event staffing: **Hold**. A further check would reduce the risk of committing too early.
4. Venue commitment: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
5. Festival programming: **Hold**. A further check would reduce the risk of committing too early.

*Very low: 22/100, 0 of 5 preferred*

1. Registration strategy: **Hold**. A further check would reduce the risk of committing too early.
2. Sponsor negotiation: **Delegate**. A capable lead can take responsibility while the manager preserves attention for other commitments.
3. Event staffing: **Hold**. A further check would reduce the risk of committing too early.
4. Venue commitment: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
5. Festival programming: **Delegate**. A capable lead can take responsibility while the manager preserves attention for other commitments.

## Friday Support Team (case 4)

*6:30 PM, Friday*

You lead a 10-person customer support team serving several business clients. Your two team leads independently manage client relationships, service delivery, and staffing within agreed commitments. You remain responsible for major contractual decisions. You have approximately two hours available this evening, and the team operates with reduced staffing over the weekend.

1. **Customer escalation** (`escalation`). A major client has complained about repeated delays in resolving support requests. The account represents a significant share of your team's revenue, and the client has questioned whether agreed service standards are being maintained. The account lead attributes the delays to unusually high demand, while the client believes the team has repeatedly missed its commitments. A response is expected before the weekend.
2. **Weekend service allocation** (`weekend`). A major client expects additional weekend support following recent complaints. The account lead proposes temporarily moving an experienced agent from another account, where service has been stable but an important client review is due next week. Both accounts would remain within existing service commitments, and the weekend arrangement must be confirmed tonight.
3. **Service commitment** (`guarantee`). A client experiencing recurring system failures wants guaranteed resolution by Monday morning. Similar failures have previously been resolved within a day, but the current incident has persisted despite the team's initial intervention. The client is considering renewing a substantial support contract and wants a firm commitment tonight.
4. **Process improvement** (`process`). A team lead has proposed changing the escalation process after several customers complained about being transferred between agents. The proposal would give senior agents greater discretion to resolve complaints but could increase handling time for complex cases. The change is planned for next month's operating cycle, and the lead wants your decision before finalizing the implementation plan.
5. **Client recovery plan** (`recovery`). A client whose service ratings have declined wants a recovery plan before the weekend. The account lead proposes closer monitoring and changes to how complaints are escalated. The plan would use the account’s existing staff and stay within agreed service levels, though responses to new requests may be slower. The client expects a credible response tonight.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Customer escalation | 20 | 14 | 0 | 4 | Own |
| Weekend service allocation | 13 | 20 | 0 | 5 | Delegate |
| Service commitment | 4 | 4 | 11 | 20 | Hold |
| Process improvement | 11 | 5 | 20 | 0 | Wait |
| Client recovery plan | 14 | 20 | 0 | 5 | Delegate |

**AI advice**

*High: 94/100, 4 of 5 preferred*

1. Customer escalation: **Own**. Repeated alleged failures for a major account raise service accountability and commercial relationship concerns beyond an ordinary ticket response.
2. Weekend service allocation: **Delegate**. The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time.
3. Service commitment: **Hold**. A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly.
4. Process improvement: **Wait**. The process policy is important but implementation is next month. Immediate weekend decisions take priority.
5. Client recovery plan: **Own**. The potential consequences justify direct managerial involvement despite competing demands.

*Moderate: 74/100, 3 of 5 preferred*

1. Customer escalation: **Own**. Repeated alleged failures for a major account raise service accountability and commercial relationship concerns beyond an ordinary ticket response.
2. Weekend service allocation: **Delegate**. The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time.
3. Service commitment: **Hold**. A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly.
4. Process improvement: **Hold**. A further check would reduce the risk of committing too early.
5. Client recovery plan: **Own**. The potential consequences justify direct managerial involvement despite competing demands.

*Low: 48/100, 2 of 5 preferred*

1. Customer escalation: **Hold**. A further check would reduce the risk of committing too early.
2. Weekend service allocation: **Delegate**. The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time.
3. Service commitment: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
4. Process improvement: **Wait**. The process policy is important but implementation is next month. Immediate weekend decisions take priority.
5. Client recovery plan: **Wait**. The manager can revisit this decision after addressing more immediate matters.

*Very low: 22/100, 0 of 5 preferred*

1. Customer escalation: **Wait**. The manager can revisit this decision after addressing more immediate matters.
2. Weekend service allocation: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
3. Service commitment: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
4. Process improvement: **Delegate**. A capable lead can take responsibility while the manager preserves attention for other commitments.
5. Client recovery plan: **Wait**. The manager can revisit this decision after addressing more immediate matters.

## Launch Morning (case 1)

*9:00 AM, Tuesday*

You manage a chain of fitness centres and are opening a new branch at noon today. A 12-person team is handling the opening, with experienced leads who independently manage customers, operations, and marketing within the approved opening plan. You remain accountable for pricing and customer safety. You have around two hours available this morning for direct involvement in the following matters.

1. **Corporate membership** (`corporate`). A nearby company wants discounted memberships for 40 employees before the branch opens. The offer could bring regular business, but the proposed price is lower than what early members have already paid. The company wants confirmation before noon.
2. **Opening announcement** (`announcement`). A competing fitness centre has announced a similar membership offer nearby. Your marketing lead proposes changing today's opening promotion to emphasize personal training rather than discounted memberships. The revised message would stay within the approved marketing budget, and the announcement is due this morning.
3. **Opening readiness** (`readiness`). The branch opens at noon, with customers booked for the afternoon. During yesterday’s trial, the exercise area became crowded when several groups used it together. Staff have rearranged the equipment and expect fewer customers at first, but the revised layout has not been tested with a full group. Confirming the opening would also confirm the advertised class schedule.
4. **Customer experience** (`trainers`). Two groups have requested dedicated trainers during opening week. One includes long-standing members transferring from another branch; the other could bring substantial new business. The team can fully support only one without reducing regular services, but the other can be fully supported from the following week. The customer experience lead knows both groups and has proposed an arrangement, and both groups expect confirmation today.
5. **Team responsibilities** (`roles`). A senior trainer has suggested changing how staff responsibilities are divided to reduce delays in handling member requests. The proposed changes could improve service but would alter the schedules of employees who have worked together for several months. The new arrangements would begin next month.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Corporate membership | 20 | 14 | 0 | 4 | Own |
| Opening announcement | 14 | 20 | 0 | 4 | Delegate |
| Opening readiness | 4 | 4 | 10 | 20 | Hold |
| Customer experience | 14 | 20 | 0 | 4 | Delegate |
| Team responsibilities | 11 | 5 | 20 | 0 | Wait |

**AI advice**

*High: 94/100, 4 of 5 preferred*

1. Corporate membership: **Own**. A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment.
2. Opening announcement: **Delegate**. The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions.
3. Opening readiness: **Hold**. The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check.
4. Customer experience: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
5. Team responsibilities: **Wait**. Workstream changes begin next month and can receive personal attention after today’s opening.

*Moderate: 74/100, 3 of 5 preferred*

1. Corporate membership: **Own**. A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment.
2. Opening announcement: **Delegate**. The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions.
3. Opening readiness: **Hold**. The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check.
4. Customer experience: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
5. Team responsibilities: **Hold**. A further check would reduce the risk of committing too early.

*Low: 48/100, 2 of 5 preferred*

1. Corporate membership: **Own**. A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment.
2. Opening announcement: **Hold**. A further check would reduce the risk of committing too early.
3. Opening readiness: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
4. Customer experience: **Delegate**. Allocating dedicated trainers for opening week sits with the customer experience lead, who knows both groups. The other group can be fully supported from the following week and no price or policy exception is involved, so the manager can keep attention for higher-stakes decisions.
5. Team responsibilities: **Hold**. A further check would reduce the risk of committing too early.

*Very low: 22/100, 0 of 5 preferred*

1. Corporate membership: **Delegate**. A capable lead can take responsibility while the manager preserves attention for other commitments.
2. Opening announcement: **Hold**. A further check would reduce the risk of committing too early.
3. Opening readiness: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
4. Customer experience: **Wait**. The manager can revisit this decision after addressing more immediate matters.
5. Team responsibilities: **Hold**. A further check would reduce the risk of committing too early.

## Day Before Travel (case 6)

*4:00 PM, Wednesday*

You manage a 10-person team handling several client projects. You are travelling tomorrow morning for a three-day meeting and will have limited availability during the trip. Your team leads can independently manage projects and client discussions within existing commitments. You have approximately two hours available today to address the following matters.

1. **Client disagreement** (`client`). A client has questioned a recommendation made by your team and wants a discussion before you travel. The project lead developed the recommendation and believes it is justified, but the client has raised concerns about its effect on their costs. The client has worked directly with you on earlier projects.
2. **Project handover** (`handover`). A major project reaches an important deadline while you are away. The project lead has proposed a delivery plan that requires adjusting responsibilities across the team. The plan could improve delivery speed but may increase the workload of two experienced employees. The team needs clarity before you leave.
3. **New client opportunity** (`opportunity`). A potential client has offered a substantial assignment beginning next week. The team has completed similar work, and the project lead believes it can be managed by adjusting current schedules. Two existing projects also have important deadlines next week. The client wants a firm start-date commitment before you travel.
4. **Team development** (`development`). A high-performing employee has requested a discussion about taking responsibility for a larger project. You have reviewed their recent performance and have a view on their readiness. The project would begin next month, and the employee would like to discuss the opportunity before you travel.
5. **Project review** (`review`). Two client projects have recently suffered delays because problems were identified too late. The team lead running both projects proposes testing a shorter weekly progress review on them during your three-day absence. The change could identify issues earlier but would take time from employees already working toward deadlines. The team wants direction before you leave.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Client disagreement | 20 | 14 | 0 | 4 | Own |
| Project handover | 14 | 20 | 0 | 4 | Delegate |
| New client opportunity | 4 | 5 | 10 | 20 | Hold |
| Team development | 11 | 5 | 20 | 0 | Wait |
| Project review | 12 | 20 | 7 | 0 | Delegate |

**AI advice**

*High: 94/100, 4 of 5 preferred*

1. Client disagreement: **Own**. The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead’s analytical familiarity supports but does not replace personal engagement.
2. Project handover: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
3. New client opportunity: **Hold**. A firm start date risks disrupting two existing deadlines; the team’s optimistic scheduling view is not sufficient confirmation of capacity.
4. Team development: **Wait**. The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel.
5. Project review: **Delegate**. The lead running both projects can trial the change on them while the manager is away. This preserves learning without committing the organization to a permanent process change.

*Moderate: 74/100, 3 of 5 preferred*

1. Client disagreement: **Own**. The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead’s analytical familiarity supports but does not replace personal engagement.
2. Project handover: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
3. New client opportunity: **Hold**. A firm start date risks disrupting two existing deadlines; the team’s optimistic scheduling view is not sufficient confirmation of capacity.
4. Team development: **Wait**. The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel.
5. Project review: **Hold**. A further check would reduce the risk of committing too early.

*Low: 48/100, 2 of 5 preferred*

1. Client disagreement: **Own**. The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead’s analytical familiarity supports but does not replace personal engagement.
2. Project handover: **Hold**. A further check would reduce the risk of committing too early.
3. New client opportunity: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
4. Team development: **Wait**. The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel.
5. Project review: **Hold**. A further check would reduce the risk of committing too early.

*Very low: 22/100, 0 of 5 preferred*

1. Client disagreement: **Delegate**. A capable lead can take responsibility while the manager preserves attention for other commitments.
2. Project handover: **Hold**. A further check would reduce the risk of committing too early.
3. New client opportunity: **Own**. The potential consequences justify direct managerial involvement despite competing demands.
4. Team development: **Hold**. A further check would reduce the risk of committing too early.
5. Project review: **Hold**. A further check would reduce the risk of committing too early.
