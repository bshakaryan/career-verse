# CareerVerse — One crisis. Two careers.

A browser workplace simulation for adults exploring a career change. Resolve the same fictional ShopFlow checkout incident first as Customer Support, then as a Junior QA Tester. Your second role inherits your first role's decisions.

**Live:** https://careerverse-pm-practice.filanteye.chatgpt.site
**Source:** https://github.com/bshakaryan/career-verse
**Pitch:** [English PDF, 10 slides](output/pdf/careerverse-pitch.pdf)

## Shipped scope

- Guest entry, no account or payment required; English UI built with React and Headless UI.
- Connected inbox, order inspection, refund decisions, customer replies, escalation, Kanban, documents and workday timeline.
- Functional checkout with an intentional category-dependent defect; structured, revisable bug reports checked against recorded tests.
- Perspective Shift preserves the incident. Fresh Replay creates a separate run and keeps past attempts.
- Transparent deterministic rubric: correctness 40%, investigation 25%, communication/documentation 20%, prioritization 15%. Self-reported career interest stays separate.
- Persistent career path, form drafts, exportable work record and a playable free-shipping follow-up exercise.
- Free/Pro pricing page and a working simulated upgrade. The $29/month price is a hypothesis. Pro unlocks a scenario brief, not a playable advanced simulation. No payment is taken.

**AI status:** This release is intentionally published without a live API key, as agreed for the demo. Chat uses clearly labelled authored guidance. The server-side OpenAI Responses adapter is implemented, but live AI has not been validated. Acceptance criterion 10 in the specification remains pending until a key is configured and a real response verified. Do not pitch this release as having demonstrated live AI.

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

| Module | Responsibility |
| --- | --- |
| `src/lib/shopflow/data.ts` | Versioned fictional orders, policies and separate actual/expected arithmetic |
| `src/lib/shopflow/engine.ts` | Validated events, state transitions, downstream consequences, rubric and recommendations |
| `src/lib/shopflow/server.ts` | Shared HTTP handler, replay validation, optional grounded AI, honest fallback |
| `src/app/api/shopflow/route.ts` | Next.js API adapter |
| `src/lib/shopflow/progress.ts` | Browser persistence, schema validation and stale-tab write protection |
| `src/components/shopflow.tsx` | Workspace, role flows, report, career path and simulated paywall |
| `worker/index.ts` | Production Worker serving bundled Vite assets and the same `/api/shopflow` handler |
| `scripts/build-worker.mjs` | Bundles the Worker and embeds client assets without secrets |

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

1. Click **Try CareerVerse**, read the incident brief and start Support.
2. In Inbox, read the manager message and each complaint. Read promotion/refund policies in Documents.
3. Inspect all three orders. Record refunds of $20, $12 and $0. Reply with the order ID, amount to two decimals, explanation and next step.
4. On Task board, escalate SF-1042 and SF-1043 at High priority with the observed symptom.
5. Use **Perspective Shift**. Inspect the inherited QA ticket.
6. Test $100 mixed + SAVE20 (charged $100), then $100 apparel + SAVE20 (charged $80).
7. Submit a report with a specific title, preconditions, three explicit steps mentioning SAVE20 and accessories/mixed carts, expected $80, actual $100, High severity, accessories condition and the failing test.
8. Compare roles, enter separate interest ratings, and build the career comparison.
9. Complete the shipping-boundary exercise using $75 and a nearby passing control. Reload My Career Path to see saved results.
10. Open Pro, enable the clearly simulated upgrade, then create a Fresh Replay and compare its independent history.

To demonstrate meaningful failure, refund $100 on SF-1042, skip escalation, or submit a vague QA report. The engine yields different financial consequences, QA delay and rubric results.

## Verification and limitations

Automated tests cover promotion boundaries/controls, correct versus incorrect decisions, illegal transitions, inherited evidence, frozen Support scores, report validation, independent replay, follow-up arithmetic, persistence conflicts and API fallback. Browser QA covered the complete Support → QA → comparison → follow-up flow, reload recovery, simulated upgrade and separate replay.

Guest storage is per browser and origin, limited to 12 runs, 200 events per run and 100 chat messages per run. Clearing site data loses progress. Export a work record before clearing. There are no real refunds, real customers, payments, employment guarantees or validated career-fit predictions. Pro features beyond the unlocked brief are planned.

The earlier Project Management prototype remains available through the legacy link. Its optional Supabase/server configuration and older tests are preserved, but it is not the ShopFlow core demo. Legacy scripts such as `scripts/smoke-test.py` exercise the older PM API only.

## Hackathon thesis

Target: employed US adults aged 25–45 exploring a move into technology. Problem and willingness to pay are hypotheses to validate in user interviews. The differentiator is **Perspective Shift + Shared Consequences**, not the number of job titles in a catalog.

North-star metric: percentage completing both roles and their comparison. Next measures: follow-up completion, second-session rate and upgrade intent. Planned subscription economics require validated retention, acquisition cost and AI cost; this repository does not claim measured traction or market size.

See [approved specification](docs/product-spec.md). The pitch deck labels unvalidated pricing and market assumptions explicitly.
