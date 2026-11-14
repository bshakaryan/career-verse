# CareerVerse — Final Product & MVP Specification

**Project:** CareerVerse  
**Hackathon:** Business Cup 2.0  
**Track:** Skills  
**Market:** United States  
**Target age:** 25–45  
**Business model:** B2C subscription  
**Platform:** Browser-based web application  
**Product status:** Hackathon MVP specification

## 1. Product Vision

**Tagline:** One crisis. Multiple careers. Experience the job before choosing it.

CareerVerse is an interactive, AI-powered virtual workplace that helps adults explore technology careers before committing time and money to retraining.

Users enter a fictional company, experience a realistic workday, interact with simulated workplace tools, and solve one interconnected business incident from multiple professional perspectives.

Unlike a standard career quiz or task catalog, their decisions affect the shared state of the company and the work available to other roles.

**Core innovation: Perspective Shift + Shared Consequences.**

## 2. Core User Problem

American adults aged 25–45 who want to switch into technology careers often lack direct experience of the day-to-day work involved.

They may understand a job title, salary expectations, and required skills without knowing whether they enjoy the actual responsibilities, communication patterns, tools, deadlines, and problem-solving style.

Choosing the wrong learning path can waste months of effort and training expenses.

**Job to be done:** "Before I invest in learning a new career, help me experience what doing the work actually feels like."

## 3. Target Customer

**Primary persona:** A US adult aged 25–40, currently employed in customer service, retail, operations, or administration, considering a move into technology.

They have limited free time, do not want to quit their job prematurely, and are deciding among entry-level technology roles.

**Initial careers:** Customer Support in a technology company and Junior QA Tester.

**Future careers:** Data Analyst, IT Support, Software Developer, Product Operations.

Do not try to simulate all these professions in the MVP.

## 4. MVP Experience

### Fictional company

**ShopFlow Inc.**, a US-based e-commerce software company.

### Main incident

**The Checkout Crisis:** A promotional discount is being calculated incorrectly for certain customer orders. Customers complain about unexpected charges before an upcoming release.

### Core user flow

1. Open public website without registration.
2. Click **Try CareerVerse**.
3. Read a brief explanation of the simulated company and incident.
4. Start as **Customer Support Specialist**.
5. Use the virtual employee workspace to investigate customer complaints.
6. Complete meaningful tasks and make decisions that change incident state.
7. Open **Perspective Shift** and move into the **QA Tester** role.
8. Continue the same incident using information produced by the first role.
9. Reproduce the checkout bug and submit a structured bug report.
10. Receive a comparative report covering performance, decisions, interests, and skill gaps.
11. Receive a personalized next-practice recommendation.
12. View the **Pro subscription** offer and the next practice scenario.
13. Be able to restart the incident and produce a different result.

**Important:** A guest user must complete steps 1–11 without paying or signing up. The subscription offer must not block the main demonstration.

## 5. Virtual Workplace Interface

Build one cohesive workstation layout with navigable applications:

**Email:** Inbox, message reading, and replies. Messages include relevant instructions from the fictional manager and customers.

**Task Manager:** Kanban-style tickets with statuses such as Todo, In Progress, Blocked, and Done. Tasks are linked to incident data.

**Team Chat:** Messages from colleagues and the manager. AI-generated replies are allowed but must respect structured company facts.

**Customer Orders:** A working table of fictional orders, prices, discounts, customer identities, and refund status.

**Checkout Sandbox:** A functional, deliberately buggy checkout calculation that users can test with different cart values and promotion codes.

**Documents:** Company refund policy, escalation policy, discount requirements, and bug-reporting guidelines.

**Workday Timeline:** Time advances after meaningful actions, creating new information and changes in priorities.

The applications must share the same incident state. Do not create six unrelated static pages.

Use original UI styling rather than copying proprietary interface branding or assets.

## 6. Customer Support Simulation

The user receives complaints from customers.

Required actions:

- Read customer messages.
- Inspect relevant orders.
- Compare actual and expected charges.
- Determine the valid refund using stored order and policy data.
- Enter a refund amount.
- Decide whether to escalate the issue.
- Write a customer response.

The system must calculate refund correctness and escalation outcomes with code.

**Possible consequences:**

- Correct escalation creates a QA ticket with supporting information.
- Missing escalation delays the QA investigation.
- Incorrect refund affects the simulated company balance.
- Missing order details make downstream investigation more difficult.

Every meaningful action must be recorded.

## 7. QA Tester Simulation

The user enters the QA workstation for the same incident.

Required actions:

- Read the relevant issue or discover that information is missing.
- Inspect product requirements.
- Open a functional checkout sandbox.
- Try different cart and promotion combinations.
- Identify the specific failure condition.
- Submit a bug report containing:
  - Title
  - Preconditions
  - Steps to reproduce
  - Expected result
  - Actual result
  - Severity
- Review the system's assessment.

The checkout bug must be reproducible through actual application logic.

**Possible consequences:**

- A complete report increases team readiness for the planned fix.
- An incomplete report triggers requests for clarification.
- Missing reproduction steps delay simulated resolution.
- Correct identification of the defect unlocks a successful incident handoff.

## 8. Perspective Shift — Primary Differentiator

The user must be able to change professional perspective within the same incident.

Preserve:

- Incident severity and status
- Customer complaints
- Refund decisions
- Escalation status
- QA ticket contents
- Team messages
- Time elapsed
- Decision history
- Simulated business impact

**Connected Run:** The second role inherits consequences of the first role.

**Fresh Replay:** The user starts the same incident again from clean initial conditions to compare alternative decisions.

These must be distinct modes. Restarting must not silently modify the original run.

## 9. Decision and Consequence Engine

Create a structured server-side state machine.

Suggested entities:

- Session
- UserAction
- Incident
- CustomerOrder
- Refund
- Ticket
- Message
- TimelineEvent
- RoleAttempt
- Assessment
- LearningPlan

Suggested event types:

- `ORDER_INSPECTED`
- `REFUND_SUBMITTED`
- `CUSTOMER_REPLIED`
- `INCIDENT_ESCALATED`
- `ROLE_SWITCHED`
- `CHECKOUT_TESTED`
- `BUG_REPORT_SUBMITTED`
- `SCENARIO_COMPLETED`

A state transition must be determined by the action and current state, not by a prewritten final score.

For the discount bug, create a deterministic function such as:

`calculate_actual_total(cart, promo_code)`

and a separate specification function:

`calculate_expected_total(cart, promo_code)`

Choose a consistent failure condition, such as a promotion being incorrectly excluded when a cart contains a particular item category. Test cases that do and do not trigger the bug must produce different results.

**Never use a language model as the source of truth for the arithmetic, ticket state, completion criteria, or business consequences.**

## 10. AI Features

### AI Coworker

An AI colleague or manager responds to free-text user questions using a fixed company knowledge base and live incident state.

The AI may explain available tools or respond naturally to a professional message.

It must not invent orders, change the incident arbitrarily, or automatically complete tasks on behalf of the user.

### AI Career Reflection

After the session, AI explains:

- Actions completed correctly
- Specific errors and their consequences
- Differences between Customer Support and QA work
- Observed transferable skills
- Areas for further practice
- A suggested next training step

**Assessment rules:**

Objective correctness is evaluated by application code. The LLM generates explanations grounded in the resulting assessment.

Career interest is collected from user feedback rather than inferred solely from task scores.

Do not issue fabricated claims like "You are 97% suited to QA." One short simulation is not a validated career aptitude test.

### AI failure fallback

If an AI service fails, the deterministic simulation must remain usable. Show a basic rule-based explanation or a clearly labelled unavailable state rather than pretending that live AI succeeded.

## 11. Assessment and Career Comparison

Use a transparent rubric, with each criterion scored from 0 to 100:

- Task correctness: 40%
- Investigation quality: 25%
- Communication/documentation: 20%
- Prioritization: 15%

Implement role-specific subcriteria while retaining comparable top-level dimensions.

Keep user-reported interest separate from performance.

The report should include:

- Customer Support score and evidence
- QA score and evidence
- Specific decisions and consequences
- Time spent and hints used
- User's preferred work style
- Personalized next practice recommendation

Avoid a single opaque "career fit percentage."

## 12. Retention Mechanic

After the first completed incident, display **My Career Path**.

Save:

- Completed roles
- Attempt history
- Identified weak skills
- User preferences
- Next recommended challenge
- Completion status of each challenge

Implement at least one actual follow-up practice exercise.

Example: After an incomplete QA bug report, offer a second, shorter defect-reporting task with a different test case. The user should be able to complete it and see whether the relevant skill improved.

A visible "Continue your practice" section must remain available after refreshing or reopening the application.

Guest persistence via localStorage is acceptable for the MVP. For reliable deployments and multi-device access, persistent sessions should eventually be stored server-side.

## 13. Subscription and Paywall

**Free — Career Explorer**

- Main multi-role incident
- Customer Support and QA experience
- Baseline assessment
- Initial career comparison
- One follow-up practice exercise

**CareerVerse Pro — $29/month (pricing hypothesis)**

- New workplace incidents
- Advanced simulations for selected careers
- Personalized skill practice
- Historical progress comparisons
- AI coaching based on prior work
- Job-description-aligned practice
- Interview preparation using the user's previous decisions

MVP requirements:

- Functional pricing page
- Clear difference between Free and Pro
- Working paywall on a Pro-only scenario
- A clear simulated upgrade state or Stripe test-mode checkout
- Guest access to the full core demo

Do not claim real payments are processed if they are not.

## 14. Suggested Architecture

Recommended stack for fast delivery:

- Next.js + TypeScript
- Tailwind CSS
- React state management
- Server-side API routes
- SQLite or another lightweight persistent database
- Optional LLM API on the server
- Vercel, Railway, or Render hosting

Suggested modules:

- `scenario-data` — fictional company, orders, policies, incident
- `simulation-engine` — event handling, state transitions, rules
- `workspace-ui` — employee applications
- `role-flows` — customer support and QA experiences
- `assessment-engine` — deterministic evaluation
- `ai-service` — colleague conversation and reflective feedback
- `progress-service` — saved progress and next challenge
- `billing-demo` — paywall and optional test checkout

The main principle is to **build the simulation engine first**, then connect interfaces and AI.

Do not introduce a multi-agent architecture unless basic gameplay and deployment already work.

## 15. Acceptance Tests

The product is ready for judging only if:

1. A new visitor can start without an account.
2. All essential controls in the main flow work.
3. Entering different refund amounts produces different results.
4. Escalating or not escalating changes QA's later work.
5. The QA checkout bug can be reproduced through real input.
6. A correct and incorrect bug report receive different assessments.
7. Switching roles retains the current incident state.
8. Restarting creates a clean, independent run.
9. The final report is generated from recorded actions.
10. The user can submit their own text to a live AI feature.
11. Progress remains visible after completing the experience.
12. The next practice exercise actually works.
13. Pro-only content presents a real paywall.
14. The complete guest experience works on the deployed public URL.
15. The public GitHub repository matches the deployed version.

## 16. Scope Control

**Must ship:**

- Two distinct working roles
- Shared incident and consequence engine
- Functional workspace applications necessary for those roles
- Connected role switch
- Deterministic performance assessment
- Live AI feedback or coworker interaction
- Career comparison
- Persistent progress
- One repeatable follow-up task
- Functional paywall
- Public deployment

**Do not build before the core flow works:**

- Full-featured clones of Slack, Jira, Outlook, or Trello
- More than two professions
- Voice or video meetings
- Unlimited AI-generated scenarios
- Real employer integrations
- Real payments
- Marketplace, social network, or recruiter dashboard
- B2B accounts
- Advanced animation or elaborate 3D environments

## 17. Hackathon Deliverables

- Production URL accessible without login
- Public GitHub repository containing all deployed source code
- README with local setup, architecture, scenario logic, AI dependencies, and demo steps
- English PDF pitch deck with a maximum of 10 slides
- No exposed API keys
- English-language product UI
- Working end-to-end demonstration

**Definition of success:** A guest can experience two connected professional perspectives, make decisions that change the shared incident, and receive an evidence-based comparison plus a next step — without the team explaining which buttons to press.

## 18. Product North Star

**Primary user outcome:** The user gains a more informed understanding of the daily work involved in two potential careers.

**Primary product metric:** Percentage of users who complete both roles and their comparative report.

**Secondary metrics:** Second-session rate, practice completion, paywall view-to-upgrade rate, paid retention, and cost per completed simulation.

The product must never promise guaranteed employment, objectively verified career fit, or salary improvement.
