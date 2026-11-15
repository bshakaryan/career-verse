# CareerVerse — One workplace. Multiple roles.

A browser workplace simulation for adults exploring a career change. The current free BUG-104 mission follows Customer Support → Developer → QA → Support. The Pro workspace continues with payment investigation, customer recovery and release decisions.

**Live:** https://careerverse-pm-practice.filanteye.chatgpt.site
**Source:** https://github.com/bshakaryan/career-verse
**Pitch:** [English PDF, 10 slides](output/pdf/careerverse-pitch.pdf)

## Current Pro practice

Open Pricing, choose a demo plan and start **Checkout after a timeout**. A failed checkout screen may hide a captured $79 payment or an interrupted $49 request. Inspect the payment record, retry or confirm the order, and enter refunds. The action log computes the resulting charges, refunds, excess payments and unpaid fulfilment exposure.

Choose a timeout recovery policy and test it against normal checkout, interruption before capture and interruption after capture. New fixes invalidate previous test evidence. Submit a structured handoff and release decision to receive an action-based review across recovery (30), investigation (20), regression coverage (25), handoff evidence (15) and release judgment (10).

Blind retries, duplicate charges and premature confirmations remain in the review even after recovery. Retry with a fresh order to compare results, or try the alternate failure. Current actions, report drafts and the last eight completed attempts persist on this browser/origin. All payments, refunds and subscription upgrades are simulated.

### AI report text review

AI is accessible immediately through **AI feedback** in the main navigation or **Try AI feedback** on Explore. The `#ai` screen provides an editable sample report and the corresponding payment evidence, without requiring a completed mission or plan selection. It calls the same real review endpoint only when requested. The sample investigator's recorded actions are clearly labelled; sample drafts and reviews use separate browser storage and do not alter Pro attempts. Revised text marks prior feedback as outdated.

After submitting a case decision, open **AI writing coach**, write or revise the report and click **Analyze my report**. The server replays the attempt and sends the report plus computed evidence to OpenAI Responses with structured output and `store: false`. The review includes strengths, specific issues with verified verbatim quotes, suggested corrections, an example revision and a next step. It cannot change the practice score, payment state or release decision. Revisions and the latest review persist with the attempt; changing the text marks an old review as outdated.

For local development, set `OPENAI_API_KEY` in the ignored `.env.local` file. `OPENAI_REPORT_MODEL` selects the review model (default `gpt-5.4-mini`); `OPENAI_CHAT_MODEL` is the fallback model setting. Restart the local server after changing environment variables. On deployment, configure the same server-side variables in the host's secret settings; `.env.local` is not uploaded to Sites or committed to Git. Do not use `NEXT_PUBLIC_` for the key. The Next.js route and hosted Worker both serve `/api/pro-review`.

The review runs only on explicit request. With no key, a timeout, a refusal, invalid output or provider failure, the report and deterministic result remain usable and the UI reports that AI review did not complete. Limits are six requests per visitor and 120 total per ten minutes **per running isolate**, not a global billing cap or paid-access enforcement. This guest demo is not a tamper-resistant assessment: the server validates and recomputes client action logs, not their historical authenticity. Configure provider spend controls and durable limits before wider paid operation. The configured model must support Responses structured output and medium reasoning effort.

Live validation on 2026-11-15 used the local Next.js endpoint and `gpt-5.4-mini`: with identical actions and structured answers, a correct $79 report received no issues, while contradictory prose received four grounded issues covering the captured amount, invented retries/refund, timeout interpretation and unsafe retry advice. A correct $49 report also received no material issues in the browser, and its review survived reload. Early runs exposed false-positive comments, so the context now includes explicit timeout timing and current-build test results, with medium reasoning and instructions to verify criticisms against the whole report. This is a small smoke test, not a comprehensive quality evaluation; language matching was inconsistent on English input. The public deployment and its secrets are separate and were not updated by this local check.

Implementation: `src/lib/shopflow/pro-case.ts`, `src/components/pro-case-practice.tsx`. Tests cover incorrect and correct outcomes, repaired mistakes, the alternate failure, regression invalidation, handoff evidence and persistence.

## Earlier ShopFlow implementation reference

The sections below describe the earlier Support → QA simulation engine retained in the repository, not the current BUG-104 and Pro screens. The linked PDF pitch is also from that earlier release.

### Shipped scope of the earlier engine

- A focused Explore page introduces the complete Support → QA experience with one entry button. Guest entry requires no account or payment; English UI uses React and Headless UI.
- An eight-step guide follows saved progress, opens the next task and explains each form field. Secondary tools and the wider process map are collapsed until needed.
- Connected inbox, order inspection, refund decisions, customer replies, escalation, Kanban, documents and workday timeline.
- Functional checkout with an intentional category-dependent defect; structured, revisable bug reports checked against recorded tests.
- Perspective Shift preserves the incident. Fresh Replay creates a separate run and keeps past attempts.
- Transparent deterministic rubric: correctness 40%, investigation 25%, communication/documentation 20%, prioritization 15%. Self-reported career interest stays separate.
- Saved attempts, form drafts and an exportable work record; previous attempts live in the final reflection. Learn presents a browsable course catalog, connecting Support and QA foundation lessons to knowledge checks, refund practice and the shipping-boundary assignment.
- A role map explains the wider incident lifecycle and distinguishes the two playable roles from work owned by engineering, operations and the incident lead.
- Free/Pro pricing page and a working simulated upgrade. The $29/month price is a hypothesis. Pro demo access unlocks a playable double-refund reconciliation assignment with a lesson, knowledge checks and calculated financial consequences. No payment is taken.

**Earlier engine AI status:** The published demo uses clearly labelled authored chat guidance. Its server-side OpenAI Responses adapter has not been validated live; the Pro report review validation described above applies to a separate endpoint. Acceptance criterion 10 for the earlier engine remains pending.

## Local setup

Node.js 22.13+ and pnpm are required.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:3000. No environment variables or database are required for ShopFlow. Its progress is stored in this browser, on this origin.

To test the exact Worker build used for Sites:

```sh
pnpm build:hosted
pnpm preview:hosted
```

Open http://127.0.0.1:4173. Restart the preview after rebuilding. `pnpm preview:practice` is a compatibility alias that builds and previews the Worker. `build:practice` generates the Vite client only and must be served with the simulation API; it is not a standalone ShopFlow deployment.

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm build:hosted
```

## Architecture

| Module                                 | Responsibility                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/lib/shopflow/data.ts`             | Versioned fictional orders, policies and separate actual/expected arithmetic             |
| `src/lib/shopflow/engine.ts`           | Validated events, state transitions, downstream consequences, rubric and recommendations |
| `src/lib/shopflow/server.ts`           | Shared HTTP handler, replay validation, optional grounded AI, honest fallback            |
| `src/app/api/shopflow/route.ts`        | Next.js API adapter                                                                      |
| `src/lib/shopflow/progress.ts`         | Browser persistence, schema validation and stale-tab write protection                    |
| `src/lib/shopflow/learning.ts`         | Authored lessons, validated learning actions and practice assessments                    |
| `src/components/shopflow-learning.tsx` | Learning Studio, saved checks and revisable assignments                                  |
| `src/lib/shopflow/guide.ts`            | Progress-aware next steps and form guidance                                              |
| `src/components/shopflow.tsx`          | Explore, guided workspace, role flows, reflection and simulated paywall                  |
| `worker/index.ts`                      | Production Worker serving bundled Vite assets and the same `/api/shopflow` handler       |
| `scripts/build-worker.mjs`             | Bundles the Worker and embeds client assets without secrets                              |

The browser holds a guest event log. Every mutation is sent to the server, which validates and replays it, then computes the next state. Submitted scores and browser-calculated totals are never trusted. No database or Supabase is needed for this MVP. Support evidence is frozen at Perspective Shift so later QA reading cannot retroactively increase that score.

The event log is guest-controlled: this is a practice tool, not a tamper-resistant assessment or certification system. Server validation enforces legal transitions, not the authenticity of a person's historical activity. A future authenticated/server-persisted session store is needed for cross-device progress and trusted records.

## Scenario logic

SAVE20 should discount the whole merchandise subtotal by 20% at $50 or more, across all categories. The actual implementation deliberately omits the discount for accessories and mixed carts. Apparel, no-code and below-threshold tests act as controls. Money is calculated in integer cents.

- SF-1042: mixed cart, $100 paid, $80 expected, $20 refund.
- SF-1043: accessories, $60 paid, $48 expected, $12 refund.
- SF-1044: apparel, $60 paid and expected, $0 refund.

Incorrect refunds change excess-refund/still-owed totals. Escalation carries selected order IDs and the user's symptom into QA. Skipping it creates a blocked ticket and adds 15 simulated minutes. Incomplete bug reports request clarification; a verified report marks the handoff ready, never claims the defect was fixed.

The follow-up has a different defect: free shipping should start at $75 inclusive, while actual code uses a strict greater-than check. At $75, actual total is $81.99; nearby values pass. Follow-up work is tracked separately from main-role time. All clock values are simulated, not measured time on task.

Rubric evidence is displayed beside each score. Text checks measure explicit completeness (IDs, exact amounts, minimum content and reproduction steps), not semantic writing quality. The comparison and next step are practice guidance, not a career aptitude diagnosis.

## Optional live AI

Use secure OpenAI key setup, then configure `OPENAI_API_KEY` as a server secret and `OPENAI_CHAT_MODEL` as an available model in your project. `.env.example` describes local variables; `.env.local` is ignored. Production Sites secrets are separate from local files and require a deployment to apply. Never put a key in client code or a `NEXT_PUBLIC_` variable.

Only explicit chat/reflection requests call the model. The request contains the fictional company facts, recorded decisions and computed evidence; `store: false` is set. No LLM controls money, task state, grades or completion. Failure, timeout and request-limit responses retain the deterministic flow and show an authored-guide notice.

The current guard permits 12 AI requests per IP per 10 minutes **per running isolate**. It is not a global durable spend cap; local Next.js requests share a fallback bucket. Before enabling a widely promoted public AI deployment, use provider project limits and durable infrastructure rate limiting. Live API/model availability and factual output must be verified separately.

## Demo walkthrough

1. On Explore, click **Try the full experience**, read the incident brief and start Support.
2. In Inbox, read the manager message and each complaint. Read promotion/refund policies in Documents.
3. Inspect all three orders. Record refunds of $20, $12 and $0. Reply with the order ID, amount to two decimals, explanation and next step.
4. In Customer orders, click Create ticket beside SF-1042. The form opens under that row with SF-1042 preselected; link SF-1043, describe the symptom and choose High priority. After creation, QA-201 links in the table open the saved ticket in Tickets. Each highlighted order ID opens its customer message in Inbox.
5. Follow **Continue as QA**. Inspect and acknowledge the inherited QA ticket, then read the bug-report standard.
6. Continue the investigation into Checkout sandbox. QA-201 stays visible above the test fields with its symptom, priority and linked orders. Test $100 mixed + SAVE20 (charged $100), then $100 apparel + SAVE20 (charged $80).
7. Submit a report with a specific title, preconditions, three explicit steps mentioning SAVE20 and accessories/mixed carts, expected $80, actual $100, High severity, accessories condition and the failing test.
8. Enter separate interest ratings and choose **Finish my workday** to view the career comparison.
9. Choose **Learn and practice your next skill**. Complete both checks in QA foundations, then test the shipping boundary at $75 and a nearby passing control. Finish the assignment and return to Learning Studio.
10. Open Support foundations. Pass the two checks, then resolve SF-1071: $72 paid − $60 expected − $5 already refunded = $7 additional refund. Include SF-1071 and $7.00 in a clear reply and choose to confirm the payment status. Try an incorrect amount first to compare revisions.
11. Open the Pro course, enable the clearly simulated upgrade and pass its checks. Cancel pending RF-902, retry the failed $15 refund for SF-2082 and leave SF-2083 unchanged. The successful batch has $0 excess and $0 remaining debt.
12. Reload Learning Studio to verify saved lessons and attempts. Export the work record, then create a Fresh Replay to start independently.

To demonstrate meaningful failure, refund $100 on SF-1042, skip escalation, or submit a vague QA report. The engine yields different financial consequences, QA delay and rubric results.

## Verification and limitations

Automated tests cover the complete guide sequence, report revisions and guidance persistence, lesson prerequisites, wrong-to-correct practice revisions, ledger reconciliation, learning persistence and isolation, promotion boundaries/controls, correct versus incorrect decisions, illegal transitions, inherited evidence, frozen Support scores, report validation, independent replay, follow-up arithmetic, persistence conflicts and API fallback. Browser QA covered the complete Support → QA → comparison → follow-up flow, reload recovery, simulated upgrade and separate replay.

Guest storage is per browser and origin, limited to 12 runs, 200 events per run and 100 chat messages per run. Clearing site data loses progress. Export a work record before clearing. There are no real refunds, real customers, payments, employment guarantees or validated career-fit predictions. Additional course modules beyond the three shipped lessons are planned. Pro access is a browser-local demo gate, not a production billing entitlement; the learning API does not claim to enforce a paid subscription.

The earlier Project Management prototype remains in the repository; Explore no longer links to it. Its optional Supabase/server configuration and older tests are preserved, but it is not the ShopFlow core demo. Legacy scripts such as `scripts/smoke-test.py` exercise the older PM API only.

## Hackathon thesis

Target: employed US adults aged 25–45 exploring a move into technology. Problem and willingness to pay are hypotheses to validate in user interviews. The differentiator is **Perspective Shift + Shared Consequences**, not the number of job titles in a catalog.

North-star metric: percentage completing both roles and their comparison. Next measures: lesson-to-assignment completion, second-session rate and upgrade intent. Planned subscription economics require validated retention, acquisition cost and AI cost; this repository does not claim measured traction or market size.

See [approved specification](docs/product-spec.md). The pitch deck labels unvalidated pricing and market assumptions explicitly.
