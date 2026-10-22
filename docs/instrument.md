# Instrument

Generated from `js/cases.js`, `js/key.js` and `js/scoring.js`. Do not edit by hand; run `node make-docs.js`.

Instrument version `survey-2026-10-round3`, cases `d15a62e9`, key `5505a7da`, scoring v2.

## Changes from the manual

The text follows the 8 October 2026 manual, with the pilot feedback of 22 October 2026 applied:

- Every decision states what is to be decided ("To decide:" below each decision).
- Each caselet shows its key numbers as tiles above the opening. They restate the opening; nothing new.
- Launch Morning / Opening readiness: "the advertised class schedule" now reads "the group exercise classes advertised for this afternoon".
- Every AI reason for a non-preferred action is specific to its decision. The manual used four generic sentences there, which gave weak advice away. The actions recommended at each level, and the key, are unchanged.
- The instructions add a who-decides / when grid and an Own-versus-Delegate example. The four actions share one neutral style; no action has a colour.

## Instructions respondents read

For each situation, choose the most appropriate managerial action given the other demands on your time. Your choice concerns who should take responsibility for the decision and whether it can responsibly be made now, not who performs the routine implementation work. If you would make the decision yourself, including a decision to give someone a task or role, choose Own; choose Delegate only if a team member should make the decision instead of you. You may choose the same action more than once.

| Action | Who decides? | When? |
| --- | --- | --- |
| Own | You | Now |
| Delegate | A team member, not you | Now |
| Wait | You | Later. Nothing is missing |
| Hold | No one yet | Once something missing is in place |

Example: a team member asks whether a customer should get a refund. If you decide yes or no, that is Own, even if they then process the refund. If you let them decide, that is Delegate.

| Action | Shown on each option | Definition |
| --- | --- | --- |
| Own | you decide, now | Make the decision yourself now. Others may advise you or carry out what you decide. |
| Delegate | a team member decides, now | Entrust the decision to a capable team member now. They choose the course of action within their authority, without needing your approval. |
| Wait | you decide, later | Keep the decision for yourself and address it later; it is ready to be made. |
| Hold | not yet, something essential is missing | Do not commit until essential information, capability or another prerequisite is available. You may still respond without committing. |

## Practice questions and attention check (Wait versus Hold, not scored)

Both answered as expected counts as passing the attention check; the results view can leave out those who fail.

- **Training programme** (expected: Wait). You need to choose between two training programmes for next quarter. The choice is yours to make, you already have everything you need, and it is not due until the end of the month. To decide: which training programme to choose.
- **Supplier contract** (expected: Hold). A supplier offers a discount if you sign a contract today. Whether its product meets your safety standard will not be known until test results arrive tomorrow. To decide: whether to sign the supplier contract.

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

**12 people** in your consulting team · **3 hours** available today for involvement

You manage a 12-person consulting team handling several client assignments. Your project leads regularly manage client relationships and delivery decisions for their own projects independently, while you remain accountable for major commitments. You have approximately three hours available today for direct involvement in these matters.

1. **Client escalation** (`escalation`). A client has questioned the team's recommendation after receiving conflicting figures from two departments. The project lead developed the recommendation and understands both data sources, but the client relationship has become sensitive following delays in the previous engagement. A response is expected today. *To decide:* the team's response to the client's challenge, due today.
2. **Project expansion** (`expansion`). A long-standing client wants to expand an ongoing engagement into a new business area. The team has delivered similar work before, but the proposed scope involves regulatory requirements that have not yet been reviewed. The client wants a firm commitment on scope and delivery timelines by tomorrow. *To decide:* whether to commit to the expanded scope and timeline by tomorrow.
3. **Revised recommendation** (`recommendation`). A client requests a revised cost recommendation by 1:00 PM. The current project lead has developed the updated numbers, but the recommendation involves changing assumptions that you agreed directly with the client during last year's engagement. The client expects a final recommendation today. *To decide:* the final cost recommendation to send the client today.
4. **Delivery recovery** (`recovery`). A project is behind schedule after the client requested additional analysis. Its project lead proposes borrowing two consultants from another assignment. The second project lead believes the change is manageable but is concerned about upcoming milestones. Both clients expect updates today, and the team needs a decision on the proposed reallocation. *To decide:* whether to move two consultants from the other assignment.
5. **Performance discussion** (`career`). A high-performing project lead has requested a discussion about taking on a larger role. The employee has recently taken on additional responsibilities and expects clarity about future opportunities. You have a view on their readiness, and the next formal role review is scheduled for later this month. *To decide:* how to respond to the project lead's request about a larger role.

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
4. Delivery recovery: **Delegate**. Both project leads know their projects and milestones best. They can agree the reallocation between themselves, which keeps the manager's limited time for client-facing matters today.
5. Performance discussion: **Wait**. The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines.

*Moderate: 74/100, 3 of 5 preferred*

1. Client escalation: **Delegate**. Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline.
2. Project expansion: **Wait**. The client wants a commitment by tomorrow, not today. The manager can give the expansion proper attention tomorrow morning, once today's more pressing client matters are dealt with.
3. Revised recommendation: **Own**. The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations.
4. Delivery recovery: **Hold**. The second lead is concerned about upcoming milestones. The effect of losing two consultants on that project should be assessed before anyone commits to the reallocation.
5. Performance discussion: **Wait**. The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines.

*Low: 48/100, 2 of 5 preferred*

1. Client escalation: **Delegate**. Lead has the most direct knowledge of both sources. Personal intervention is credible because the relationship is sensitive, but delegation preserves scarce attention for an earlier client deadline.
2. Project expansion: **Own**. A long-standing client is asking to grow the engagement, and the team has delivered similar work before. A firm commitment from the manager secures the opportunity and reassures the client.
3. Revised recommendation: **Own**. The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations.
4. Delivery recovery: **Hold**. The second lead is concerned about upcoming milestones. The effect of losing two consultants on that project should be assessed before anyone commits to the reallocation.
5. Performance discussion: **Hold**. Readiness should be judged against evidence from the employee's recent additional responsibilities. Gathering that input from others before the conversation would make the discussion fairer.

*Very low: 22/100, 0 of 5 preferred*

1. Client escalation: **Own**. The relationship became sensitive after delays in the previous engagement, and conflicting figures are now in dispute. A personal response from the manager shows the client the concern is taken seriously.
2. Project expansion: **Own**. A long-standing client is asking to grow the engagement, and the team has delivered similar work before. A firm commitment from the manager secures the opportunity and reassures the client.
3. Revised recommendation: **Hold**. The revised numbers change assumptions agreed last year. The updated figures should be independently verified before anything goes to the client, so the recommendation does not need correcting later.
4. Delivery recovery: **Wait**. Both clients expect updates today, but the staffing change itself need not be settled this morning. It can be decided once today's client responses have gone out.
5. Performance discussion: **Hold**. Readiness should be judged against evidence from the employee's recent additional responsibilities. Gathering that input from others before the conversation would make the discussion fairer.

## Strong Employee (case 2)

*9:00 AM, Monday*

**Tomorrow** major client presentation · **8 people** in your analytics team · **3 hours** available today for involvement

You manage an eight-person analytics team preparing a major client presentation for tomorrow. Two senior analysts can independently lead assignments, although you remain accountable for client commitments. You have approximately three hours available today for direct involvement in the matters below.

1. **Client presentation** (`presentation`). A client has questioned a recommendation that could affect its annual operating budget. The senior analyst who developed the analysis believes the recommendation is sound, but the client has challenged the team's commercial assumptions in earlier discussions. The client expects your team's position by 2:00 PM. *To decide:* the team's position on the challenged recommendation, due by 2:00 PM.
2. **Financial commitment** (`funding`). Finance has asked you to approve ₹4 lakh for additional analytical support before today’s vendor deadline. The support could strengthen tomorrow’s client presentation. The team can begin some work using existing data, but completing the proposed analysis depends on client information expected later today. The vendor requires a commitment for the full amount. *To decide:* whether to approve the ₹4 lakh vendor commitment today.
3. **Partner request** (`partner`). A partner has requested an initial assessment of an opportunity with an existing client by tomorrow morning. The opportunity builds on the team's current work but could involve a different commercial model. A senior analyst has worked closely with the client, while you have participated in earlier discussions about the account. *To decide:* the initial assessment of the opportunity, due to the partner tomorrow morning.
4. **Employee development** (`appointment`). A strong-performing analyst has asked to lead a new client workstream beginning next week. The employee has managed internal teams successfully but has limited experience handling difficult client conversations. The workstream is commercially important, and a decision on whether to appoint the analyst as lead is needed today. If appointed, the analyst would manage the workstream’s delivery. *To decide:* whether to appoint the analyst as lead of the new workstream.
5. **Performance review** (`review`). A senior analyst has challenged feedback in their year-end evaluation, arguing that it overlooks their contribution to a difficult project. You have reviewed the evidence and formed an assessment. The analyst has requested a discussion this week, while the formal evaluation meeting is scheduled for Thursday. *To decide:* how to respond to the analyst's challenge to their evaluation.

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

1. Client presentation: **Delegate**. The senior analyst built the analysis and knows the assumptions in detail. They are best placed to defend the recommendation and can set the team's position before the 2:00 PM deadline.
2. Financial commitment: **Hold**. The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs.
3. Partner request: **Delegate**. This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager’s commercial familiarity.
4. Employee development: **Own**. Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst’s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no.
5. Performance review: **Wait**. The manager has already formed an assessment and a formal discussion is scheduled for Thursday, so a personal discussion can be deferred.

*Moderate: 74/100, 3 of 5 preferred*

1. Client presentation: **Delegate**. The senior analyst built the analysis and knows the assumptions in detail. They are best placed to defend the recommendation and can set the team's position before the 2:00 PM deadline.
2. Financial commitment: **Hold**. The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs.
3. Partner request: **Delegate**. This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager’s commercial familiarity.
4. Employee development: **Own**. Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst’s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no.
5. Performance review: **Hold**. The analyst says the feedback overlooks their part in a difficult project. Input from colleagues on that project should be collected before the feedback is discussed again.

*Low: 48/100, 2 of 5 preferred*

1. Client presentation: **Hold**. The client has challenged the commercial assumptions before. The team's position should not be confirmed until those assumptions have been re-tested against the client's latest objections.
2. Financial commitment: **Own**. The extra analysis could strengthen tomorrow's presentation, and the vendor deadline is today. Approving the full amount now secures the support while the team starts with existing data.
3. Partner request: **Delegate**. This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager’s commercial familiarity.
4. Employee development: **Own**. Appointing the lead for a commercially important client workstream is a client commitment for which the manager remains accountable. The analyst’s limited experience with difficult client conversations is the risk the manager must weigh, whether the answer is yes or no.
5. Performance review: **Hold**. The analyst says the feedback overlooks their part in a difficult project. Input from colleagues on that project should be collected before the feedback is discussed again.

*Very low: 22/100, 0 of 5 preferred*

1. Client presentation: **Wait**. The position is not due until 2:00 PM. The manager can settle it early in the afternoon, after dealing with the vendor deadline and the partner's request.
2. Financial commitment: **Wait**. The client information is expected later today. The manager can return to the approval this evening, once the more urgent presentation matters have been handled.
3. Partner request: **Hold**. The opportunity could involve a different commercial model. The assessment should not go to the partner until the pricing implications of that model have been worked out.
4. Employee development: **Wait**. Tomorrow's client presentation takes priority today. The appointment matters for next week's workstream and can be settled once the presentation is behind the team.
5. Performance review: **Own**. The analyst has challenged the evaluation directly and asked to meet this week. Meeting them personally now keeps the disagreement from growing before Thursday's formal meeting.

## Fest Week (case 5)

*10:00 AM, Monday*

**3 weeks** festival opens · **Next week** registrations close · **3 hours** available today for involvement

You head your institute's festival committee. The festival opens in three weeks, with registrations closing next week. Your committee leads independently manage sponsorships, outreach, operations, and event teams within agreed budgets. You remain accountable for major financial commitments and event safety. You have approximately three hours available today for direct involvement in the following matters.

1. **Registration strategy** (`registration`). Registrations from a major partner campus are 22% below last year. A rival festival has moved to the same weekend, while the campus coordinator recently stepped down. The outreach team proposes using most of the remaining ₹1.5 lakh publicity budget on a targeted campaign. A decision is needed today to secure the campaign slots. *To decide:* whether to spend most of the remaining ₹1.5 lakh on the targeted campaign.
2. **Sponsor negotiation** (`sponsor`). Your largest sponsor wants to reduce its contribution by 10%, citing weaker expected footfall. The sponsorship lead proposes offering additional branding opportunities instead of accepting the reduction. Some of these opportunities could also interest other sponsors, and the agreement covers next year's festival. The sponsor expects a response today, although final terms can be agreed any time before the festival opens. *To decide:* how to respond to the sponsor's proposed 10% reduction.
3. **Event staffing** (`staffing`). Registrations for one of the festival's largest events have exceeded expectations. Its lead requests additional experienced volunteers, which would reduce support for two smaller events. The volunteer committee has proposed a revised allocation, but the affected event leads disagree about the impact. Staffing plans must be confirmed today. *To decide:* the final volunteer allocation across the three events.
4. **Venue commitment** (`venue`). A new event has attracted strong interest, and a larger off-campus venue is available at a discounted rate until this evening. The venue has hosted similar events, but the expected attendance is considerably higher than at previous institute events. The committee's entry and exit arrangements were designed for smaller venues, and it is unclear whether they would work for the expected crowd. Confirmation requires a non-refundable deposit. *To decide:* whether to pay the non-refundable deposit for the larger venue.
5. **Festival programming** (`programming`). Several alumni have offered to participate in an industry networking session, which could strengthen the festival's professional outreach. You have been developing the programme with the student team, but its proposed format may overlap with an existing event. The schedule will be finalized later this week, while sponsor and registration decisions require attention today. *To decide:* whether and how to include the alumni networking session.

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
2. Sponsor negotiation: **Own**. The largest sponsor's contribution and next year's agreement are both at stake. The head should negotiate the branding offer personally and settle the terms with the sponsor today.
3. Event staffing: **Delegate**. The volunteer committee can reconcile staffing among planned events. It is consequential but within its remit, so the head should avoid taking over the allocation.
4. Venue commitment: **Hold**. A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue.
5. Festival programming: **Wait**. The programme discussion is valuable but can be resolved before the later-week schedule deadline after urgent sponsorship and registration choices.

*Moderate: 74/100, 3 of 5 preferred*

1. Registration strategy: **Own**. The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment.
2. Sponsor negotiation: **Own**. The largest sponsor's contribution and next year's agreement are both at stake. The head should negotiate the branding offer personally and settle the terms with the sponsor today.
3. Event staffing: **Delegate**. The volunteer committee can reconcile staffing among planned events. It is consequential but within its remit, so the head should avoid taking over the allocation.
4. Venue commitment: **Hold**. A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue.
5. Festival programming: **Hold**. The proposed format may overlap with an existing event. The session should not be confirmed until the overlap in audience and timing with that event has been checked.

*Low: 48/100, 2 of 5 preferred*

1. Registration strategy: **Own**. The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment.
2. Sponsor negotiation: **Hold**. The reduction rests on expected footfall, which registrations will show when they close next week, and the terms also cover next year’s festival. Final terms can be agreed before the festival opens, so committing before footfall is known would be premature.
3. Event staffing: **Hold**. The affected event leads disagree about the impact. The revised allocation should not be confirmed until its effect on the two smaller events has been checked with those leads.
4. Venue commitment: **Own**. The discounted rate ends this evening and the new event has attracted strong interest. The head should approve the deposit and secure the larger venue before the offer lapses.
5. Festival programming: **Hold**. The proposed format may overlap with an existing event. The session should not be confirmed until the overlap in audience and timing with that event has been checked.

*Very low: 22/100, 0 of 5 preferred*

1. Registration strategy: **Hold**. The cause of the 22% drop is unclear: the rival festival and the coordinator's exit may both matter. Committing most of the budget should wait until the cause is better understood.
2. Sponsor negotiation: **Delegate**. The sponsorship lead already has a proposal and knows the sponsor. The negotiation sits within their remit and agreed budget, which keeps the head free for other matters.
3. Event staffing: **Hold**. The affected event leads disagree about the impact. The revised allocation should not be confirmed until its effect on the two smaller events has been checked with those leads.
4. Venue commitment: **Own**. The discounted rate ends this evening and the new event has attracted strong interest. The head should approve the deposit and secure the larger venue before the offer lapses.
5. Festival programming: **Delegate**. The student team has been developing the programme and knows the schedule. They can decide how to fit in the alumni session before the schedule is finalised later this week.

## Friday Support Team (case 4)

*6:30 PM, Friday*

**10 people** in your support team · **2 hours** available this evening · **Weekend** reduced staffing

You lead a 10-person customer support team serving several business clients. Your two team leads independently manage client relationships, service delivery, and staffing within agreed commitments. You remain responsible for major contractual decisions. You have approximately two hours available this evening, and the team operates with reduced staffing over the weekend.

1. **Customer escalation** (`escalation`). A major client has complained about repeated delays in resolving support requests. The account represents a significant share of your team's revenue, and the client has questioned whether agreed service standards are being maintained. The account lead attributes the delays to unusually high demand, while the client believes the team has repeatedly missed its commitments. A response is expected before the weekend. *To decide:* the response to the major client's complaint about delays.
2. **Weekend service allocation** (`weekend`). A major client expects additional weekend support following recent complaints. The account lead proposes temporarily moving an experienced agent from another account, where service has been stable but an important client review is due next week. Both accounts would remain within existing service commitments, and the weekend arrangement must be confirmed tonight. *To decide:* whether to move the experienced agent to the other account for the weekend.
3. **Service commitment** (`guarantee`). A client experiencing recurring system failures wants guaranteed resolution by Monday morning. Similar failures have previously been resolved within a day, but the current incident has persisted despite the team's initial intervention. The client is considering renewing a substantial support contract and wants a firm commitment tonight. *To decide:* whether to guarantee the client resolution by Monday morning.
4. **Process improvement** (`process`). A team lead has proposed changing the escalation process after several customers complained about being transferred between agents. The proposal would give senior agents greater discretion to resolve complaints but could increase handling time for complex cases. The change is planned for next month's operating cycle, and the lead wants your decision before finalizing the implementation plan. *To decide:* whether to approve the proposed change to the escalation process.
5. **Client recovery plan** (`recovery`). A client whose service ratings have declined wants a recovery plan before the weekend. The account lead proposes closer monitoring and changes to how complaints are escalated. The plan would use the account’s existing staff and stay within agreed service levels, though responses to new requests may be slower. The client expects a credible response tonight. *To decide:* the recovery plan to give the client tonight.

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
5. Client recovery plan: **Own**. The client's ratings have declined and a credible response is expected tonight. The manager should own the recovery plan to show the client senior attention.

*Moderate: 74/100, 3 of 5 preferred*

1. Customer escalation: **Own**. Repeated alleged failures for a major account raise service accountability and commercial relationship concerns beyond an ordinary ticket response.
2. Weekend service allocation: **Delegate**. The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time.
3. Service commitment: **Hold**. A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly.
4. Process improvement: **Hold**. The change could increase handling time for complex cases. Its effect on those cases should be measured before deciding whether senior agents get more discretion.
5. Client recovery plan: **Own**. The client's ratings have declined and a credible response is expected tonight. The manager should own the recovery plan to show the client senior attention.

*Low: 48/100, 2 of 5 preferred*

1. Customer escalation: **Hold**. The account lead blames unusual demand, while the client says commitments were missed. The ticket data should be reviewed to establish which account is right before the team responds.
2. Weekend service allocation: **Delegate**. The lead can decide the temporary arrangement within existing service commitments; personally reallocating one agent would use limited managerial time.
3. Service commitment: **Own**. A substantial contract renewal depends on this answer, and similar failures were fixed within a day before. The manager should give the client a firm commitment tonight.
4. Process improvement: **Wait**. The process policy is important but implementation is next month. Immediate weekend decisions take priority.
5. Client recovery plan: **Wait**. The plan uses existing staff and stays within agreed service levels, so nothing has to change before Monday. The manager can review it properly after the weekend.

*Very low: 22/100, 0 of 5 preferred*

1. Customer escalation: **Wait**. The client wants a response before the weekend, and there are still some hours left. It can be written after the weekend coverage is settled, when the evening is quieter.
2. Weekend service allocation: **Own**. Moving an experienced agent affects two accounts, one with an important client review next week. The manager should make this staffing call personally to balance both clients.
3. Service commitment: **Own**. A substantial contract renewal depends on this answer, and similar failures were fixed within a day before. The manager should give the client a firm commitment tonight.
4. Process improvement: **Delegate**. The team lead designed the proposal and will carry it out next month. They are best placed to settle the details of the escalation process within the team's commitments.
5. Client recovery plan: **Wait**. The plan uses existing staff and stays within agreed service levels, so nothing has to change before Monday. The manager can review it properly after the weekend.

## Launch Morning (case 1)

*9:00 AM, Tuesday*

**Noon** new branch opens · **12 people** handling the opening · **2 hours** available this morning

You manage a chain of fitness centres and are opening a new branch at noon today. A 12-person team is handling the opening, with experienced leads who independently manage customers, operations, and marketing within the approved opening plan. You remain accountable for pricing and customer safety. You have around two hours available this morning for direct involvement in the following matters.

1. **Corporate membership** (`corporate`). A nearby company wants discounted memberships for 40 employees before the branch opens. The offer could bring regular business, but the proposed price is lower than what early members have already paid. The company wants confirmation before noon. *To decide:* whether to accept the company's discounted price for 40 memberships.
2. **Opening announcement** (`announcement`). A competing fitness centre has announced a similar membership offer nearby. Your marketing lead proposes changing today's opening promotion to emphasize personal training rather than discounted memberships. The revised message would stay within the approved marketing budget, and the announcement is due this morning. *To decide:* whether to change today's opening promotion.
3. **Opening readiness** (`readiness`). The branch opens at noon, with customers booked for the afternoon. During yesterday’s trial, the exercise area became crowded when several groups used it together. Staff have rearranged the equipment and expect fewer customers at first, but the revised layout has not been tested with a full group. Confirming the opening would also confirm the group exercise classes advertised for this afternoon. *To decide:* whether to confirm the noon opening and this afternoon's classes as planned.
4. **Customer experience** (`trainers`). Two groups have requested dedicated trainers during opening week. One includes long-standing members transferring from another branch; the other could bring substantial new business. The team can fully support only one without reducing regular services, but the other can be fully supported from the following week. The customer experience lead knows both groups and has proposed an arrangement, and both groups expect confirmation today. *To decide:* which group gets dedicated trainers during opening week.
5. **Team responsibilities** (`roles`). A senior trainer has suggested changing how staff responsibilities are divided to reduce delays in handling member requests. The proposed changes could improve service but would alter the schedules of employees who have worked together for several months. The new arrangements would begin next month. *To decide:* whether to adopt the new division of staff responsibilities.

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
4. Customer experience: **Own**. Both groups matter: one brings loyal members, the other substantial new business. Choosing which group gets dedicated trainers is a judgement the manager should make personally today.
5. Team responsibilities: **Wait**. Workstream changes begin next month and can receive personal attention after today’s opening.

*Moderate: 74/100, 3 of 5 preferred*

1. Corporate membership: **Own**. A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment.
2. Opening announcement: **Delegate**. The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions.
3. Opening readiness: **Hold**. The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check.
4. Customer experience: **Own**. Both groups matter: one brings loyal members, the other substantial new business. Choosing which group gets dedicated trainers is a judgement the manager should make personally today.
5. Team responsibilities: **Hold**. The change would alter the schedules of a team that has worked together for months. Staff views on the proposal should be gathered before any decision is taken.

*Low: 48/100, 2 of 5 preferred*

1. Corporate membership: **Own**. A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment.
2. Opening announcement: **Hold**. A competitor has just announced a similar offer. The revised message should not go out until its likely effect on early membership sales has been checked.
3. Opening readiness: **Own**. Staff have rearranged the equipment and expect fewer customers at first. The manager should confirm the noon opening so booked customers and classes go ahead as planned.
4. Customer experience: **Delegate**. Allocating dedicated trainers for opening week sits with the customer experience lead, who knows both groups. The other group can be fully supported from the following week and no price or policy exception is involved, so the manager can keep attention for higher-stakes decisions.
5. Team responsibilities: **Hold**. The change would alter the schedules of a team that has worked together for months. Staff views on the proposal should be gathered before any decision is taken.

*Very low: 22/100, 0 of 5 preferred*

1. Corporate membership: **Delegate**. The customer lead handles memberships and knows what early members paid. They can agree terms with the company within the opening plan while the manager prepares the launch.
2. Opening announcement: **Hold**. A competitor has just announced a similar offer. The revised message should not go out until its likely effect on early membership sales has been checked.
3. Opening readiness: **Own**. Staff have rearranged the equipment and expect fewer customers at first. The manager should confirm the noon opening so booked customers and classes go ahead as planned.
4. Customer experience: **Wait**. The second group can be fully supported from the following week. The allocation can be confirmed after the opening, once the manager has seen how busy the first days are.
5. Team responsibilities: **Hold**. The change would alter the schedules of a team that has worked together for months. Staff views on the proposal should be gathered before any decision is taken.

## Day Before Travel (case 6)

*4:00 PM, Wednesday*

**Tomorrow** you travel for three days · **10 people** in your team · **2 hours** available today

You manage a 10-person team handling several client projects. You are travelling tomorrow morning for a three-day meeting and will have limited availability during the trip. Your team leads can independently manage projects and client discussions within existing commitments. You have approximately two hours available today to address the following matters.

1. **Client disagreement** (`client`). A client has questioned a recommendation made by your team and wants a discussion before you travel. The project lead developed the recommendation and believes it is justified, but the client has raised concerns about its effect on their costs. The client has worked directly with you on earlier projects. *To decide:* how to respond to the client's concerns about the recommendation.
2. **Project handover** (`handover`). A major project reaches an important deadline while you are away. The project lead has proposed a delivery plan that requires adjusting responsibilities across the team. The plan could improve delivery speed but may increase the workload of two experienced employees. The team needs clarity before you leave. *To decide:* whether to adopt the project lead's delivery plan for the deadline.
3. **New client opportunity** (`opportunity`). A potential client has offered a substantial assignment beginning next week. The team has completed similar work, and the project lead believes it can be managed by adjusting current schedules. Two existing projects also have important deadlines next week. The client wants a firm start-date commitment before you travel. *To decide:* whether to commit to a start date for the new assignment.
4. **Team development** (`development`). A high-performing employee has requested a discussion about taking responsibility for a larger project. You have reviewed their recent performance and have a view on their readiness. The project would begin next month, and the employee would like to discuss the opportunity before you travel. *To decide:* how to respond to the employee's request about a larger project.
5. **Project review** (`review`). Two client projects have recently suffered delays because problems were identified too late. The team lead running both projects proposes testing a shorter weekly progress review on them during your three-day absence. The change could identify issues earlier but would take time from employees already working toward deadlines. The team wants direction before you leave. *To decide:* whether to trial the shorter weekly review during your absence.

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
2. Project handover: **Own**. The plan adds to the workload of two experienced employees around an important deadline. The manager should settle the new responsibilities personally before leaving.
3. New client opportunity: **Hold**. A firm start date risks disrupting two existing deadlines; the team’s optimistic scheduling view is not sufficient confirmation of capacity.
4. Team development: **Wait**. The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel.
5. Project review: **Delegate**. The lead running both projects can trial the change on them while the manager is away. This preserves learning without committing the organization to a permanent process change.

*Moderate: 74/100, 3 of 5 preferred*

1. Client disagreement: **Own**. The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead’s analytical familiarity supports but does not replace personal engagement.
2. Project handover: **Own**. The plan adds to the workload of two experienced employees around an important deadline. The manager should settle the new responsibilities personally before leaving.
3. New client opportunity: **Hold**. A firm start date risks disrupting two existing deadlines; the team’s optimistic scheduling view is not sufficient confirmation of capacity.
4. Team development: **Wait**. The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel.
5. Project review: **Hold**. The trial would take time from employees working toward deadlines. Its effect on those deadlines should be estimated before the shorter review is introduced.

*Low: 48/100, 2 of 5 preferred*

1. Client disagreement: **Own**. The client has a direct relationship with the manager and requests discussion before the manager becomes unavailable. The lead’s analytical familiarity supports but does not replace personal engagement.
2. Project handover: **Hold**. The plan may overload two experienced employees. Their capacity during the deadline should be confirmed before the new responsibilities are agreed.
3. New client opportunity: **Own**. The assignment is substantial, the team has done similar work, and the lead believes schedules can adjust. The manager should confirm the start date before the client looks elsewhere.
4. Team development: **Wait**. The development discussion is personally relevant but the project begins next month, so it can be scheduled after travel.
5. Project review: **Hold**. The trial would take time from employees working toward deadlines. Its effect on those deadlines should be estimated before the shorter review is introduced.

*Very low: 22/100, 0 of 5 preferred*

1. Client disagreement: **Delegate**. The project lead developed the recommendation and can explain its effect on the client's costs. Letting the lead hold the discussion keeps the manager's last two hours for the handover.
2. Project handover: **Hold**. The plan may overload two experienced employees. Their capacity during the deadline should be confirmed before the new responsibilities are agreed.
3. New client opportunity: **Own**. The assignment is substantial, the team has done similar work, and the lead believes schedules can adjust. The manager should confirm the start date before the client looks elsewhere.
4. Team development: **Hold**. Readiness for a larger project should be checked against feedback from the leads the employee has worked with. That input would make the discussion better grounded.
5. Project review: **Hold**. The trial would take time from employees working toward deadlines. Its effect on those deadlines should be estimated before the shorter review is introduced.
