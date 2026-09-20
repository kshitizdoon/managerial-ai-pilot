# Instrument

Generated from `js/cases.js` and `js/key.js`. Do not edit by hand; run `node make-docs.js`.

## Order in which respondents see things

Case order is randomised per respondent. The six situations are six different organisations with different people, different days and no shared timeline, so no case has to follow another and all 720 case orders can occur.

Card order inside a case is randomised too, except where one card only reads correctly after another. Those pairs are declared in `cases.js` as `after:[...]`, enforced by `order.js`, and checked at load.

| Case | Must precede | Why | Orders still possible |
| --- | --- | --- | --- |
| 1 Launch morning | none | five things on one desk at one time | 120 of 120 |
| 2 Strong employee | none | five things on one desk at one time | 120 of 120 |
| 3 Monday project team | none | five things on one desk at one time | 120 of 120 |
| 4 Friday support team | complaint before warning | The warning card says "that agent" and "the client's account". Both are introduced by the complaint card. | 60 of 120 |
| 5 Fest week | drop before diagnosis | The data card says "the drop", "the rival fest" and "the coordinator's exit". All three are introduced by the registrations card. | 40 of 120 |
|  | drop before coordinator | The coordinator card says "that campus". The campus is introduced by the registrations card. |  |
| 6 Day before travel | none | five things on one desk at one time | 120 of 120 |

The recap before the AI advice, and the board on the final-plan screen, both replay the order that respondent was given. Nothing is reshuffled between screens.

## AI advice: what is shown, and what it is worth

Each respondent sees version A or B, decided by a coin flip at the start and held for all six cases. Every respondent therefore gets three good plans and three weak ones. The version is never shown, and no accuracy figure is ever shown to the respondent.

**Accuracy of an AI plan** is that plan's own score under the researcher key, on the same 0-100 scale as a respondent's plan. It is a property of the advice, not a probability. Use the number itself as AIQuality in the regression rather than a good/weak dummy: the weak plans are not equally weak, and the continuous version makes the interaction interpretable per point of advice quality.

| Case | Version | Arm | Accuracy, split | Accuracy, merged |
| --- | --- | --- | --- | --- |
| 1 Launch morning | A | good | 100.0 | 100.0 |
| 1 Launch morning | B | weak | 43.8 | 67.5 |
| 2 Strong employee | A | weak | 51.3 | 80.0 |
| 2 Strong employee | B | good | 100.0 | 100.0 |
| 3 Monday project team | A | good | 100.0 | 100.0 |
| 3 Monday project team | B | weak | 68.8 | 69.2 |
| 4 Friday support team | A | weak | 42.5 | 59.2 |
| 4 Friday support team | B | good | 100.0 | 100.0 |
| 5 Fest week | A | good | 100.0 | 100.0 |
| 5 Fest week | B | weak | 46.9 | 62.5 |
| 6 Day before travel | A | weak | 46.3 | 68.3 |
| 6 Day before travel | B | good | 100.0 | 100.0 |

## Case 1 — Launch morning

It is 9:30 AM and you are the launch manager for a new consumer product in Bengaluru. The launch starts at 11:00 AM.

| Issue | What the respondent reads |
| --- | --- |
| **Supplier** | Today's shipment will arrive 15% short of the confirmed quantity, and the missing units cannot reach the warehouse before tomorrow. The supplier has to be told what we now expect, and today's dispatch re-planned around the smaller stock. |
| **Key retailer** | A key retailer wants 400 extra units delivered by noon for a promotion running today. The warehouse can release at most 180 before the launch. The revised number has to be agreed with the retailer this morning. |
| **Marketing** | Marketing wants ₹2 lakh added to today's advertising and needs a yes or no. The campaign is already live at the agreed spend, and the booking can be changed or cancelled without penalty until 5:00 PM. |
| **Quality** | Two batches show a mismatch between the warehouse label and the quality record. Whether those units meet specification will not be known until the batch records are pulled. Both batches are on the 11:00 AM dispatch list. |
| **Operations** | The dispatch supervisor wants to skip the final pre-dispatch check to save 40 minutes and has asked for a decision before loading starts. The check is required under the standard dispatch procedure. |

**Your team**

| Person | Title | Remit |
| --- | --- | --- |
| Arjun | Logistics manager | inbound shipments and dispatch scheduling |
| Priya | Key accounts manager | single point of contact for the large retailers |
| Meera | Quality manager | signs off pre-dispatch checks, keeps the batch records |
| Kabir | Marketing manager | runs the launch campaign and its budget |

**AI advisor text**

*Version A — good — accuracy 100.0*

> Answer the dispatch supervisor yourself and keep the required check. Nothing from those two batches should move until the records are pulled. Arjun can re-plan around the short shipment and Priya can settle the revised number with the retailer. The advertising decision costs nothing before 5 PM.

Plan: Own Operations; Delegate Supplier to Arjun; Delegate Key retailer to Priya; Wait Marketing; Hold Quality.
Component scores: own 100, delegate 100, wait 100, hold 100.

*Version B — weak — accuracy 43.8*

> The retailer promotion is running today, so take that conversation yourself and protect the launch. Arjun can handle the short shipment and Kabir can release the extra spend while the campaign is live. The label mismatch can be reconciled after dispatch, once the morning is clear.

Plan: Own Key retailer; Delegate Supplier to Arjun; Delegate Marketing to Kabir; Wait Quality; Hold Operations.
Component scores: own 45, delegate 100, wait 0, hold 30.

**Key**

| Issue | Own | Wait | Hold | Arjun | Priya | Meera | Kabir |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Supplier | 55 | 60 | 20 | 100 | 35 | 45 | 10 |
| Key retailer | 45 | 45 | 30 | 45 | 100 | 10 | 35 |
| Marketing | 20 | 100 | 10 | 15 | 45 | 10 | 100 |
| Quality | 75 | 0 | 100 | 40 | 10 | 100 | 5 |
| Operations | 100 | 15 | 30 | 60 | 15 | 70 | 10 |

## Case 2 — Strong employee

It is 8:50 AM and you manage a 10-person analytics team. A major client presentation is tomorrow.

| Issue | What the respondent reads |
| --- | --- |
| **Client** | Two recent deliverables went out with avoidable errors. The client has asked in writing what went wrong, has copied the partner on the account, and wants a reply before 11:00 AM. |
| **Ananya** | Ananya, one of your strongest performers, has missed two deadlines this month. Sara has asked whether to move part of her work to someone else before tomorrow. Nobody has yet looked at what is on her plate. |
| **Finance** | The project is 6% over budget and finance needs a written explanation by 4:00 PM. If it misses the cut-off, this month's invoice to the client is held back until the next cycle. |
| **Data discrepancy** | One number in tomorrow's presentation does not match the source file. Someone has to work out whether the slide or the source is wrong and correct it before the deck is locked tonight. |
| **Partner request** | A partner has asked for a two-page note on a new market by 5:00 PM today. It feeds a proposal that goes out at the end of next month. |

**Your team**

| Person | Title | Remit |
| --- | --- | --- |
| Riya | Engagement manager | your deputy on client-facing work and client communication |
| Mehul | Senior analyst | builds and checks the numbers behind the deliverables |
| Varun | Project finance analyst | budgets, billing and cost explanations |
| Sara | Team operations lead | staffing, workload allocation and leave |

**AI advisor text**

*Version A — weak — accuracy 51.3*

> Speak to Ananya yourself and take work off her before tomorrow; a strong performer under strain is worth protecting. Riya can reply to the client and Varun can write the budget explanation. The presentation number can be reconciled tomorrow, and the market note needs more input first.

Plan: Own Ananya; Delegate Client to Riya; Delegate Finance to Varun; Wait Data discrepancy; Hold Partner request.
Component scores: own 70, delegate 100, wait 20, hold 15.

*Version B — good — accuracy 100.0*

> Reply to the client yourself; the partner is copied and the errors are yours to explain. Mehul can settle the number before the deck is locked and Varun can write the budget explanation. Decide nothing about Ananya's work until somebody has actually looked at what she is carrying.

Plan: Own Client; Delegate Data discrepancy to Mehul; Delegate Finance to Varun; Wait Partner request; Hold Ananya.
Component scores: own 100, delegate 100, wait 100, hold 100.

**Key**

| Issue | Own | Wait | Hold | Riya | Mehul | Varun | Sara |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Client | 100 | 0 | 30 | 100 | 35 | 40 | 20 |
| Ananya | 70 | 25 | 100 | 55 | 15 | 15 | 100 |
| Finance | 45 | 55 | 20 | 55 | 40 | 100 | 25 |
| Data discrepancy | 75 | 20 | 40 | 50 | 100 | 40 | 15 |
| Partner request | 20 | 100 | 15 | 80 | 60 | 55 | 40 |

## Case 3 — Monday project team

It is 9:00 AM on Monday. You lead a 12-person consulting project team, formed after last year's engagement for this client ended.

| Issue | What the respondent reads |
| --- | --- |
| **Client analysis** | A client wants a revised cost analysis by 1:00 PM today. It has to use the assumptions agreed with the client during last year's engagement, which were never written down. You ran that engagement. |
| **Live dashboard** | A number on a client-facing dashboard looks wrong. Someone has to work out whether the error is in the source data or in the dashboard calculation, and correct it today. |
| **New hires** | Two people join next week. Their joining documents and IT access have to be raised by 6:00 PM today, or their first day moves back by a week. |
| **Team event** | Friday's team event needs an agenda circulated to the team before Thursday. The venue and the speakers are already confirmed and paid for. |
| **Software** | A ₹3 lakh annual software subscription renews in two weeks and finance wants a renew-or-cancel decision from you. How many people still use it is not recorded anywhere; pulling the usage data takes a day. |

**Your team**

| Person | Title | Remit |
| --- | --- | --- |
| Tara | Consultant | joined this client account two weeks ago |
| Imran | Data engineer | owns the team's dashboards and data pipelines |
| Neel | Team administrator | joining formalities, IT access, vendor paperwork |
| Maya | Business analyst | floats across projects, currently between assignments |

**AI advisor text**

*Version A — good — accuracy 100.0*

> Write the client analysis yourself. The assumptions were never written down and nobody now on the team was on last year's engagement, so handing it over cannot meet 1 PM. Imran can trace the dashboard error and Neel can raise the joining paperwork. Give finance no answer on the subscription until the usage data is in.

Plan: Own Client analysis; Delegate Live dashboard to Imran; Delegate New hires to Neel; Wait Team event; Hold Software.
Component scores: own 100, delegate 100, wait 100, hold 100.

*Version B — weak — accuracy 68.8*

> Fix the dashboard yourself first; a wrong number is sitting in front of the client right now. Neel can raise the joining paperwork and Maya can take the renewal decision to finance. The revised analysis should wait until the client confirms the assumptions it has to use.

Plan: Own Live dashboard; Delegate New hires to Neel; Delegate Software to Maya; Wait Team event; Hold Client analysis.
Component scores: own 55, delegate 85, wait 100, hold 35.

**Key**

| Issue | Own | Wait | Hold | Tara | Imran | Neel | Maya |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Client analysis | 100 | 0 | 35 | 45 | 20 | 10 | 30 |
| Live dashboard | 55 | 25 | 30 | 35 | 100 | 10 | 45 |
| New hires | 30 | 45 | 10 | 20 | 15 | 100 | 55 |
| Team event | 10 | 100 | 10 | 55 | 45 | 75 | 100 |
| Software | 45 | 70 | 100 | 40 | 55 | 65 | 70 |

## Case 4 — Friday support team

It is 3:00 PM on Friday and you lead a 20-person customer support team.

Card order constraint: complaint before warning.

| Issue | What the respondent reads |
| --- | --- |
| **Customer complaint** | One of your two largest clients says an agent in Meher's pod was rude on yesterday's call. The call was recorded and nobody has listened to it yet. The client expects a reply from you today. |
| **Formal warning** | Meher has asked you to approve a written warning for that agent today, on the strength of the client's account alone. A written warning stays on the employee's record and cannot be withdrawn. |
| **Overtime** | This month's overtime claims must be submitted by 5:00 PM and three entries do not match the shift records. Missing the cut-off delays payment to those agents by one month. |
| **Client meeting** | A client asks to move Monday's review meeting to Tuesday. Tuesday works for the team, though one project lead cannot attend and would have to send written notes instead. |
| **Shift schedule** | Three shifts next week have been double-booked and the roster has to be corrected before Monday morning. The agents affected have already been told there is a clash. |

**Your team**

| Person | Title | Remit |
| --- | --- | --- |
| Meher | Team leader | runs one of the four support pods |
| Ashok | Workforce planner | owns the rostering system and shift allocation |
| Zoya | Payroll coordinator | processes overtime claims and monthly payroll |
| Karan | Account manager | handles the relationship with the two largest clients |

**AI advisor text**

*Version A — weak — accuracy 42.5*

> Approve the warning today. Acting in the same week shows the client that standards are enforced, and Meher is closest to what happened. Zoya can clear the overtime claims before 5 PM. The roster clash can be picked up on Monday, and the meeting move needs the project lead's view first.

Plan: Own Formal warning; Delegate Customer complaint to Meher; Delegate Overtime to Zoya; Wait Shift schedule; Hold Client meeting.
Component scores: own 55, delegate 60, wait 45, hold 10.

*Version B — good — accuracy 100.0*

> Take the complaint yourself and listen to the recording before anything else happens; the person who raised it also runs the agent's pod. Approve no warning until you have heard the call, because it cannot be withdrawn. Zoya can clear the claims and Ashok can fix the roster.

Plan: Own Customer complaint; Delegate Overtime to Zoya; Delegate Shift schedule to Ashok; Wait Client meeting; Hold Formal warning.
Component scores: own 100, delegate 100, wait 100, hold 100.

**Key**

| Issue | Own | Wait | Hold | Meher | Ashok | Zoya | Karan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Customer complaint | 100 | 15 | 80 | 20 | 35 | 10 | 55 |
| Formal warning | 55 | 10 | 100 | 10 | 20 | 10 | 20 |
| Overtime | 45 | 60 | 20 | 35 | 60 | 100 | 10 |
| Client meeting | 20 | 100 | 10 | 45 | 25 | 10 | 100 |
| Shift schedule | 50 | 45 | 25 | 60 | 100 | 30 | 10 |

## Case 5 — Fest week

It is 10:00 AM on Monday. You head the student organising committee for your institute's annual fest, which opens in three weeks.

Card order constraint: drop before diagnosis; drop before coordinator.

| Issue | What the respondent reads |
| --- | --- |
| **Registrations** | Registrations from one large partner campus are 22% below last year. A rival fest moved to the same weekend, and your coordinator on that campus quit in the same week. ₹1.5 lakh of publicity budget is unspent and the committee wants your decision on where it goes. |
| **Sponsor fee** | Your largest sponsor asks for a 10% cut in their fee and wants an answer this week. The fee is tied to expected footfall, and registrations do not close for another week. Whatever rate you agree holds for the next two fests. |
| **Registration data** | A campus-by-campus pull of two years of registration history would show whether the drop tracks the rival fest's dates or the coordinator's exit. It takes two days of work and nobody has started it. |
| **New coordinator** | A replacement coordinator for that campus starts in two weeks and her induction plan needs sign-off before she begins. The plan itself has already been drafted. |
| **Travel money** | A volunteer team asks for ₹30,000 to visit two partner campuses next week. The amount sits inside a budget line that is already approved for campus outreach. |

**Your team**

| Person | Title | Remit |
| --- | --- | --- |
| Prakash | Registrations and analytics | keeps the registration data |
| Sonia | Volunteer coordinator | recruits and schedules the volunteer teams |
| Imtiaz | Sponsorship lead | negotiates and signs the sponsor agreements |
| Kavita | Finance and logistics | budget, vendor payments, venue bookings |

**AI advisor text**

*Version A — good — accuracy 100.0*

> Decide the publicity spend yourself; two causes are tangled together and the money is committed once. Prakash can pull the registration history and Kavita can release the travel money from the approved line. Agree no sponsor rate this week, because it locks the next two fests to a footfall nobody has estimated.

Plan: Own Registrations; Delegate Registration data to Prakash; Delegate Travel money to Kavita; Wait New coordinator; Hold Sponsor fee.
Component scores: own 100, delegate 100, wait 100, hold 100.

*Version B — weak — accuracy 46.9*

> Close the sponsor yourself this week. Registrations are down, so a committed sponsor is worth more than the 10%, and the relationship carries into the next two fests. Imtiaz can work the weak campus and Kavita can clear the travel. The history pull and the induction plan can both come later.

Plan: Own Sponsor fee; Delegate Registrations to Imtiaz; Delegate Travel money to Kavita; Wait Registration data; Hold New coordinator.
Component scores: own 55, delegate 72.5, wait 45, hold 15.

**Key**

| Issue | Own | Wait | Hold | Prakash | Sonia | Imtiaz | Kavita |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Registrations | 100 | 0 | 70 | 45 | 35 | 45 | 25 |
| Sponsor fee | 55 | 25 | 100 | 25 | 20 | 100 | 60 |
| Registration data | 65 | 45 | 20 | 100 | 30 | 25 | 40 |
| New coordinator | 20 | 100 | 15 | 40 | 100 | 35 | 30 |
| Travel money | 10 | 75 | 10 | 25 | 65 | 30 | 100 |

## Case 6 — Day before travel

It is 9:00 AM on Thursday. You lead a 15-person operations team and you leave tomorrow morning for a three-day site visit.

| Issue | What the respondent reads |
| --- | --- |
| **Compliance form** | A compliance form is due on Friday and the authority to sign it sits with the unit head personally, which is you. A late filing is reported to the regulator and carries a penalty. |
| **Customer escalation** | A mid-size B2B customer has escalated twice this month about response times and wants a call back today. Their contract comes up for renewal next quarter. |
| **Interview panel** | Tomorrow's interview panel is one member short and HR needs a name before the end of today. The candidates have already been told the panel's timing. |
| **Supplier offer** | A supplier offers 5% off list price for a two-year commitment and the offer stays open for a month. Next year's volumes are fixed in the annual plan the board approves at the end of this month. |
| **Monthly report** | The monthly operations report is due in ten days. Every number it needs is already in the reporting pack and nothing else depends on it. |

**Your team**

| Person | Title | Remit |
| --- | --- | --- |
| Harish | Service lead | owns escalations from mid-size accounts |
| Naina | Recruitment manager | runs the hiring process and sits on interview panels |
| Bhavna | Finance analyst | cost analyses and the monthly reporting pack |
| Omar | Operations manager at your level | covers for you when you travel |

**AI advisor text**

*Version A — weak — accuracy 46.3*

> Call the customer yourself; a second escalation before a renewal needs to come from the manager. Bhavna can file the compliance form and Naina can complete the panel. The supplier offer is open for a month, and the report can sit until the month-end numbers are locked.

Plan: Own Customer escalation; Delegate Compliance form to Bhavna; Delegate Interview panel to Naina; Wait Supplier offer; Hold Monthly report.
Component scores: own 55, delegate 50, wait 70, hold 10.

*Version B — good — accuracy 100.0*

> Sign the form today. Nobody else holds that authority and you are away when it falls due. Harish can call the customer back and Naina can complete the panel before HR closes the list. Commit to nothing on the supplier offer until the board fixes next year's volumes.

Plan: Own Compliance form; Delegate Customer escalation to Harish; Delegate Interview panel to Naina; Wait Monthly report; Hold Supplier offer.
Component scores: own 100, delegate 100, wait 100, hold 100.

**Key**

| Issue | Own | Wait | Hold | Harish | Naina | Bhavna | Omar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Compliance form | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| Customer escalation | 55 | 25 | 30 | 100 | 20 | 20 | 55 |
| Interview panel | 25 | 40 | 15 | 35 | 100 | 30 | 70 |
| Supplier offer | 45 | 70 | 100 | 35 | 20 | 85 | 60 |
| Monthly report | 10 | 100 | 10 | 40 | 40 | 100 | 50 |
