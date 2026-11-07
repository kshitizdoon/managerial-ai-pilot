# Instrument

Generated from `js/cases.js`, `js/key.js` and `js/scoring.js`. Do not edit by hand; run `node make-docs.js`.

Instrument version `survey-2026-11-5x4-r50`, cases `5e4897f8`, key `7733efcb`, scoring v3.

## Changes from the manual

The text follows the 8 October 2026 manual, with the pilot feedback of 22 October 2026 applied:

- Every decision states what is to be decided ("To decide:" below each decision).
- Each caselet shows its key numbers as tiles above the opening. They restate the opening; nothing new.
- Launch Morning / Opening readiness: "the advertised class schedule" now reads "the group exercise classes advertised for this afternoon".
- Every AI reason for a non-preferred action is specific to its decision. The manual used four generic sentences there, which gave weak advice away. The key is unchanged.
- The instructions add a who-decides / when grid. The four actions share one neutral style; no action has a colour.
- November 2026: five caselets with four decisions each. Day Before Travel is dropped, with one decision from each other caselet (Monday Project Team / Client escalation, Strong Employee / Employee development, Fest Week / Event staffing, Friday Support Team / Weekend service allocation, Launch Morning / Team responsibilities).
- November 2026: some AI actions were moved so that every caselet scores the same at each advice level (high, moderate, low and very low advice are one, two, three and four decisions away from the preferred action). Moved actions reuse the reason written for that action at another level; Monday Project Team / Revised recommendation at very low has a new reason.
- November 2026: no practice questions and no Own-versus-Delegate example; shorter instructions and welcome text; About you and the prize draw are on the last page; the pilot feedback and last-few-questions blocks are gone.
- November 2026 (`survey-2026-11-5x4-r50`): the four advice levels are replaced by advice that is right or wrong decision by decision, drawn at random for each respondent (half right, half wrong). Each decision has one right advice and one or more wrong ones, taken from the earlier levels. Four decisions had no right advice at any level and now have one: Monday Project Team / Delivery recovery, Strong Employee / Client presentation, Friday Support Team / Client recovery plan, Launch Morning / Customer experience. Decision order inside each caselet is now shuffled. Strong Employee / Financial commitment is reworded in plainer language.

## Instructions respondents read

For each decision, choose who should make it and when. If you would make the decision yourself, even if someone else then carries it out, choose Own. Choose Delegate only if a team member should make the decision instead of you. You may choose the same action more than once.

| Action | Who decides? | When? |
| --- | --- | --- |
| Own | You | Now |
| Delegate | A team member, not you | Now |
| Wait | You | Later. Nothing is missing |
| Hold | No one yet | Once something missing is in place |

| Action | Shown on each option | Definition |
| --- | --- | --- |
| Own | you decide, now | Make the decision yourself now. Others may advise you or carry out what you decide. |
| Delegate | a team member decides, now | Entrust the decision to a capable team member now. They choose the course of action within their authority, without needing your approval. |
| Wait | you decide, later | Keep the decision for yourself and address it later; it is ready to be made. |
| Hold | not yet, something essential is missing | Do not commit until essential information, capability or another prerequisite is available. You may still respond without committing. |

## Order and AI advice assignment

Caselet order is randomised per respondent. Decision order inside a caselet is randomised per respondent. Both orders are stored on every response.

For each respondent the AI advice is right (the key's preferred action) on 50% of all decisions, chosen at random, and wrong on the rest. Wrong advice picks one of the decision's wrong options at random. Whether advice is right is never shown to respondents. The draw is stored with every response.

## Scoring

Every decision scores all four actions from 0 to 20; each decision has exactly one 20, its preferred action. A caselet score is the sum of its 4 decision scores, rescaled to 0 to 100 (sum × 100 / 80), for the first answers, the final answers and the AI advice alike.

## Monday Project Team (case 3)

*9:00 AM, Monday*

**12 people** in your consulting team · **3 hours** available today for involvement

You manage a 12-person consulting team handling several client assignments. Your project leads regularly manage client relationships and delivery decisions for their own projects independently, while you remain accountable for major commitments. You have approximately three hours available today for direct involvement in these matters.

1. **Project expansion** (`expansion`). A long-standing client wants to expand an ongoing engagement into a new business area. The team has delivered similar work before, but the proposed scope involves regulatory requirements that have not yet been reviewed. The client wants a firm commitment on scope and delivery timelines by tomorrow. *To decide:* whether to commit to the expanded scope and timeline by tomorrow.
2. **Revised recommendation** (`recommendation`). A client requests a revised cost recommendation by 1:00 PM. The current project lead has developed the updated numbers, but the recommendation involves changing assumptions that you agreed directly with the client during last year's engagement. The client expects a final recommendation today. *To decide:* the final cost recommendation to send the client today.
3. **Delivery recovery** (`recovery`). A project is behind schedule after the client requested additional analysis. Its project lead proposes borrowing two consultants from another assignment. The second project lead believes the change is manageable but is concerned about upcoming milestones. Both clients expect updates today, and the team needs a decision on the proposed reallocation. *To decide:* whether to move two consultants from the other assignment.
4. **Performance discussion** (`career`). A high-performing project lead has requested a discussion about taking on a larger role. The employee has recently taken on additional responsibilities and expects clarity about future opportunities. You have a view on their readiness, and the next formal role review is scheduled for later this month. *To decide:* how to respond to the project lead's request about a larger role.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Project expansion | 4 | 5 | 10 | 20 | Hold |
| Revised recommendation | 20 | 14 | 0 | 3 | Own |
| Delivery recovery | 20 | 14 | 0 | 4 | Own |
| Performance discussion | 11 | 5 | 20 | 0 | Wait |

**AI advice**

1. **Project expansion**
   - Right: **Hold**. A binding scope and timeline promise depends on regulatory implications that have not been assessed. Deferring merely for convenience does not address that prerequisite.
   - Wrong: **Wait** (scores 10). The client wants a commitment by tomorrow, not today. The manager can give the expansion proper attention tomorrow morning, once today's more pressing client matters are dealt with.
   - Wrong: **Own** (scores 4). A long-standing client is asking to grow the engagement, and the team has delivered similar work before. A firm commitment from the manager secures the opportunity and reassures the client.
2. **Revised recommendation**
   - Right: **Own**. The manager personally agreed the assumptions now being revised, making ownership of the final recommendation more valuable than merely checking the calculations.
   - Wrong: **Delegate** (scores 14). The project lead built the updated numbers and knows the revised assumptions in detail. The lead can finalise the recommendation and send it by 1:00 PM.
   - Wrong: **Hold** (scores 3). The revised numbers change assumptions agreed last year. The updated figures should be independently verified before anything goes to the client, so the recommendation does not need correcting later.
3. **Delivery recovery**
   - Right: **Own**. Moving two consultants affects two projects and two clients, and the second lead has concerns about milestones. The manager should decide the reallocation today so both clients get updates.
   - Wrong: **Delegate** (scores 14). Both project leads know their projects and milestones best. They can agree the reallocation between themselves, which keeps the manager's limited time for client-facing matters today.
   - Wrong: **Hold** (scores 4). The second lead is concerned about upcoming milestones. The effect of losing two consultants on that project should be assessed before anyone commits to the reallocation.
   - Wrong: **Wait** (scores 0). Both clients expect updates today, but the staffing change itself need not be settled this morning. It can be decided once today's client responses have gone out.
4. **Performance discussion**
   - Right: **Wait**. The career discussion matters, but the next review is later this month and immediate client demands have earlier deadlines.
   - Wrong: **Hold** (scores 0). Readiness should be judged against evidence from the employee's recent additional responsibilities. Gathering that input from others before the conversation would make the discussion fairer.

## Strong Employee (case 2)

*9:00 AM, Monday*

**Tomorrow** major client presentation · **8 people** in your analytics team · **3 hours** available today for involvement

You manage an eight-person analytics team preparing a major client presentation for tomorrow. Two senior analysts can independently lead assignments, although you remain accountable for client commitments. You have approximately three hours available today for direct involvement in the matters below.

1. **Client presentation** (`presentation`). A client has questioned a recommendation that could affect its annual operating budget. The senior analyst who developed the analysis believes the recommendation is sound, but the client has challenged the team's commercial assumptions in earlier discussions. The client expects your team's position by 2:00 PM. *To decide:* the team's position on the challenged recommendation, due by 2:00 PM.
2. **Financial commitment** (`funding`). Finance needs your approval today to pay a vendor ₹4 lakh for extra analysis for tomorrow’s client presentation. The vendor wants a commitment for the full amount before its deadline today. Your team can start part of the work with data it already has. The rest needs information from the client, expected later today. *To decide:* whether to approve the ₹4 lakh vendor commitment today.
3. **Partner request** (`partner`). A partner has requested an initial assessment of an opportunity with an existing client by tomorrow morning. The opportunity builds on the team's current work but could involve a different commercial model. A senior analyst has worked closely with the client, while you have participated in earlier discussions about the account. *To decide:* the initial assessment of the opportunity, due to the partner tomorrow morning.
4. **Performance review** (`review`). A senior analyst has challenged feedback in their year-end evaluation, arguing that it overlooks their contribution to a difficult project. You have reviewed the evidence and formed an assessment. The analyst has requested a discussion this week, while the formal evaluation meeting is scheduled for Thursday. *To decide:* how to respond to the analyst's challenge to their evaluation.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Client presentation | 20 | 14 | 0 | 4 | Own |
| Financial commitment | 4 | 4 | 11 | 20 | Hold |
| Partner request | 14 | 20 | 5 | 0 | Delegate |
| Performance review | 11 | 5 | 20 | 0 | Wait |

**AI advice**

1. **Client presentation**
   - Right: **Own**. The client has challenged the team’s commercial assumptions on a recommendation that affects its annual budget. The manager should set the team’s position before 2:00 PM, using the analyst’s work.
   - Wrong: **Delegate** (scores 14). The senior analyst built the analysis and knows the assumptions in detail. They are best placed to defend the recommendation and can set the team's position before the 2:00 PM deadline.
   - Wrong: **Hold** (scores 4). The client has challenged the commercial assumptions before. The team's position should not be confirmed until those assumptions have been re-tested against the client's latest objections.
   - Wrong: **Wait** (scores 0). The position is not due until 2:00 PM. The manager can settle it early in the afternoon, after dealing with the vendor deadline and the partner's request.
2. **Financial commitment**
   - Right: **Hold**. The vendor requires full expenditure although the information needed to complete the work may not arrive. Commitment should depend on confirming usable inputs.
   - Wrong: **Own** (scores 4). The extra analysis could strengthen tomorrow's presentation, and the vendor deadline is today. Approving the full amount now secures the support while the team starts with existing data.
   - Wrong: **Wait** (scores 11). The client information is expected later today. The manager can return to the approval this evening, once the more urgent presentation matters have been handled.
3. **Partner request**
   - Right: **Delegate**. This is an initial assessment rather than a binding offer. A senior analyst with client experience can own it, despite the manager’s commercial familiarity.
   - Wrong: **Hold** (scores 0). The opportunity could involve a different commercial model. The assessment should not go to the partner until the pricing implications of that model have been worked out.
4. **Performance review**
   - Right: **Wait**. The manager has already formed an assessment and a formal discussion is scheduled for Thursday, so a personal discussion can be deferred.
   - Wrong: **Hold** (scores 0). The analyst says the feedback overlooks their part in a difficult project. Input from colleagues on that project should be collected before the feedback is discussed again.
   - Wrong: **Own** (scores 11). The analyst has challenged the evaluation directly and asked to meet this week. Meeting them personally now keeps the disagreement from growing before Thursday's formal meeting.

## Fest Week (case 5)

*10:00 AM, Monday*

**3 weeks** festival opens · **Next week** registrations close · **3 hours** available today for involvement

You head your institute's festival committee. The festival opens in three weeks, with registrations closing next week. Your committee leads independently manage sponsorships, outreach, operations, and event teams within agreed budgets. You remain accountable for major financial commitments and event safety. You have approximately three hours available today for direct involvement in the following matters.

1. **Registration strategy** (`registration`). Registrations from a major partner campus are 22% below last year. A rival festival has moved to the same weekend, while the campus coordinator recently stepped down. The outreach team proposes using most of the remaining ₹1.5 lakh publicity budget on a targeted campaign. A decision is needed today to secure the campaign slots. *To decide:* whether to spend most of the remaining ₹1.5 lakh on the targeted campaign.
2. **Sponsor negotiation** (`sponsor`). Your largest sponsor wants to reduce its contribution by 10%, citing weaker expected footfall. The sponsorship lead proposes offering additional branding opportunities instead of accepting the reduction. Some of these opportunities could also interest other sponsors, and the agreement covers next year's festival. The sponsor expects a response today, although final terms can be agreed any time before the festival opens. *To decide:* how to respond to the sponsor's proposed 10% reduction.
3. **Venue commitment** (`venue`). A new event has attracted strong interest, and a larger off-campus venue is available at a discounted rate until this evening. The venue has hosted similar events, but the expected attendance is considerably higher than at previous institute events. The committee's entry and exit arrangements were designed for smaller venues, and it is unclear whether they would work for the expected crowd. Confirmation requires a non-refundable deposit. *To decide:* whether to pay the non-refundable deposit for the larger venue.
4. **Festival programming** (`programming`). Several alumni have offered to participate in an industry networking session, which could strengthen the festival's professional outreach. You have been developing the programme with the student team, but its proposed format may overlap with an existing event. The schedule will be finalized later this week, while sponsor and registration decisions require attention today. *To decide:* whether and how to include the alumni networking session.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Registration strategy | 20 | 14 | 0 | 4 | Own |
| Sponsor negotiation | 14 | 5 | 11 | 20 | Hold |
| Venue commitment | 4 | 4 | 10 | 20 | Hold |
| Festival programming | 11 | 5 | 20 | 0 | Wait |

**AI advice**

1. **Registration strategy**
   - Right: **Own**. The decision uses most remaining publicity funds under uncertain causes of low registrations, requiring a committee-wide resource judgment.
   - Wrong: **Hold** (scores 4). The cause of the 22% drop is unclear: the rival festival and the coordinator's exit may both matter. Committing most of the budget should wait until the cause is better understood.
2. **Sponsor negotiation**
   - Right: **Hold**. The reduction rests on expected footfall, which registrations will show when they close next week, and the terms also cover next year’s festival. Final terms can be agreed before the festival opens, so committing before footfall is known would be premature.
   - Wrong: **Own** (scores 14). The largest sponsor's contribution and next year's agreement are both at stake. The head should negotiate the branding offer personally and settle the terms with the sponsor today.
   - Wrong: **Delegate** (scores 5). The sponsorship lead already has a proposal and knows the sponsor. The negotiation sits within their remit and agreed budget, which keeps the head free for other matters.
3. **Venue commitment**
   - Right: **Hold**. A non-refundable commitment to a substantially larger event should await confirmation that the proposed crowd arrangements fit that venue.
   - Wrong: **Own** (scores 4). The discounted rate ends this evening and the new event has attracted strong interest. The head should approve the deposit and secure the larger venue before the offer lapses.
4. **Festival programming**
   - Right: **Wait**. The programme discussion is valuable but can be resolved before the later-week schedule deadline after urgent sponsorship and registration choices.
   - Wrong: **Hold** (scores 0). The proposed format may overlap with an existing event. The session should not be confirmed until the overlap in audience and timing with that event has been checked.
   - Wrong: **Delegate** (scores 5). The student team has been developing the programme and knows the schedule. They can decide how to fit in the alumni session before the schedule is finalised later this week.

## Friday Support Team (case 4)

*6:30 PM, Friday*

**10 people** in your support team · **2 hours** available this evening · **Weekend** reduced staffing

You lead a 10-person customer support team serving several business clients. Your two team leads independently manage client relationships, service delivery, and staffing within agreed commitments. You remain responsible for major contractual decisions. You have approximately two hours available this evening, and the team operates with reduced staffing over the weekend.

1. **Customer escalation** (`escalation`). A major client has complained about repeated delays in resolving support requests. The account represents a significant share of your team's revenue, and the client has questioned whether agreed service standards are being maintained. The account lead attributes the delays to unusually high demand, while the client believes the team has repeatedly missed its commitments. A response is expected before the weekend. *To decide:* the response to the major client's complaint about delays.
2. **Service commitment** (`guarantee`). A client experiencing recurring system failures wants guaranteed resolution by Monday morning. Similar failures have previously been resolved within a day, but the current incident has persisted despite the team's initial intervention. The client is considering renewing a substantial support contract and wants a firm commitment tonight. *To decide:* whether to guarantee the client resolution by Monday morning.
3. **Process improvement** (`process`). A team lead has proposed changing the escalation process after several customers complained about being transferred between agents. The proposal would give senior agents greater discretion to resolve complaints but could increase handling time for complex cases. The change is planned for next month's operating cycle, and the lead wants your decision before finalizing the implementation plan. *To decide:* whether to approve the proposed change to the escalation process.
4. **Client recovery plan** (`recovery`). A client whose service ratings have declined wants a recovery plan before the weekend. The account lead proposes closer monitoring and changes to how complaints are escalated. The plan would use the account’s existing staff and stay within agreed service levels, though responses to new requests may be slower. The client expects a credible response tonight. *To decide:* the recovery plan to give the client tonight.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Customer escalation | 20 | 14 | 0 | 4 | Own |
| Service commitment | 4 | 4 | 11 | 20 | Hold |
| Process improvement | 11 | 5 | 20 | 0 | Wait |
| Client recovery plan | 14 | 20 | 0 | 5 | Delegate |

**AI advice**

1. **Customer escalation**
   - Right: **Own**. Repeated alleged failures for a major account raise service accountability and commercial relationship concerns beyond an ordinary ticket response.
   - Wrong: **Hold** (scores 4). The account lead blames unusual demand, while the client says commitments were missed. The ticket data should be reviewed to establish which account is right before the team responds.
   - Wrong: **Wait** (scores 0). The client wants a response before the weekend, and there are still some hours left. It can be written after the weekend coverage is settled, when the evening is quieter.
2. **Service commitment**
   - Right: **Hold**. A firm guarantee is not supported when the present incident has persisted despite intervention, even if previous incidents resolved quickly.
   - Wrong: **Own** (scores 4). A substantial contract renewal depends on this answer, and similar failures were fixed within a day before. The manager should give the client a firm commitment tonight.
3. **Process improvement**
   - Right: **Wait**. The process policy is important but implementation is next month. Immediate weekend decisions take priority.
   - Wrong: **Hold** (scores 0). The change could increase handling time for complex cases. Its effect on those cases should be measured before deciding whether senior agents get more discretion.
   - Wrong: **Delegate** (scores 5). The team lead designed the proposal and will carry it out next month. They are best placed to settle the details of the escalation process within the team's commitments.
4. **Client recovery plan**
   - Right: **Delegate**. The plan uses the account’s existing staff and stays within agreed service levels. The account lead knows the client and has a proposal ready, so the lead can finalise it tonight.
   - Wrong: **Own** (scores 14). The client's ratings have declined and a credible response is expected tonight. The manager should own the recovery plan to show the client senior attention.
   - Wrong: **Wait** (scores 0). The plan uses existing staff and stays within agreed service levels, so nothing has to change before Monday. The manager can review it properly after the weekend.

## Launch Morning (case 1)

*9:00 AM, Tuesday*

**Noon** new branch opens · **12 people** handling the opening · **2 hours** available this morning

You manage a chain of fitness centres and are opening a new branch at noon today. A 12-person team is handling the opening, with experienced leads who independently manage customers, operations, and marketing within the approved opening plan. You remain accountable for pricing and customer safety. You have around two hours available this morning for direct involvement in the following matters.

1. **Corporate membership** (`corporate`). A nearby company wants discounted memberships for 40 employees before the branch opens. The offer could bring regular business, but the proposed price is lower than what early members have already paid. The company wants confirmation before noon. *To decide:* whether to accept the company's discounted price for 40 memberships.
2. **Opening announcement** (`announcement`). A competing fitness centre has announced a similar membership offer nearby. Your marketing lead proposes changing today's opening promotion to emphasize personal training rather than discounted memberships. The revised message would stay within the approved marketing budget, and the announcement is due this morning. *To decide:* whether to change today's opening promotion.
3. **Opening readiness** (`readiness`). The branch opens at noon, with customers booked for the afternoon. During yesterday’s trial, the exercise area became crowded when several groups used it together. Staff have rearranged the equipment and expect fewer customers at first, but the revised layout has not been tested with a full group. Confirming the opening would also confirm the group exercise classes advertised for this afternoon. *To decide:* whether to confirm the noon opening and this afternoon's classes as planned.
4. **Customer experience** (`trainers`). Two groups have requested dedicated trainers during opening week. One includes long-standing members transferring from another branch; the other could bring substantial new business. The team can fully support only one without reducing regular services, but the other can be fully supported from the following week. The customer experience lead knows both groups and has proposed an arrangement, and both groups expect confirmation today. *To decide:* which group gets dedicated trainers during opening week.

**Key**

| Decision | Own | Delegate | Wait | Hold | Preferred |
| --- | --- | --- | --- | --- | --- |
| Corporate membership | 20 | 14 | 0 | 4 | Own |
| Opening announcement | 14 | 20 | 0 | 4 | Delegate |
| Opening readiness | 4 | 4 | 10 | 20 | Hold |
| Customer experience | 14 | 20 | 0 | 4 | Delegate |

**AI advice**

1. **Corporate membership**
   - Right: **Own**. A price exception for 40 memberships could establish inconsistent treatment of early customers and needs manager-level commercial judgment.
   - Wrong: **Delegate** (scores 14). The customer lead handles memberships and knows what early members paid. They can agree terms with the company within the opening plan while the manager prepares the launch.
2. **Opening announcement**
   - Right: **Delegate**. The communications lead can adapt an accurate announcement within approved marketing limits while the manager addresses higher-stakes decisions.
   - Wrong: **Hold** (scores 4). A competitor has just announced a similar offer. The revised message should not go out until its likely effect on early membership sales has been checked.
3. **Opening readiness**
   - Right: **Hold**. The revised exercise-area arrangement has not been tested under relevant crowd conditions. A firm opening commitment should await a sufficient readiness check.
   - Wrong: **Own** (scores 4). Staff have rearranged the equipment and expect fewer customers at first. The manager should confirm the noon opening so booked customers and classes go ahead as planned.
4. **Customer experience**
   - Right: **Delegate**. The customer experience lead knows both groups and has already proposed an arrangement. The second group can be supported from the following week, so the lead can confirm the plan today.
   - Wrong: **Own** (scores 14). Both groups matter: one brings loyal members, the other substantial new business. Choosing which group gets dedicated trainers is a judgement the manager should make personally today.
   - Wrong: **Wait** (scores 0). The second group can be fully supported from the following week. The allocation can be confirmed after the opening, once the manager has seen how busy the first days are.
