# CareerVerse

Practice your first week as a Project Manager. A fictional Northstar launch gives you a brief, a task board, two colleagues, a changing constraint, and a structured work submission.

## Current status

The homepage is a profession catalog with search by role or skill, field and availability filters, alphabetical sorting, and grid/list views. Headless UI provides the listboxes, switch and role details dialog. Project Management is available; the other five professions are marked as coming soon. Pagination appears automatically when the filtered catalog exceeds six roles.

Opening a role starts or resumes the same practice at `#practice`. The home link and **All careers** return to `#careers` without resetting the session or draft. Catalog filters remain selected during these transitions. Browser Back/Forward also switches between the two views.

The complete **practice mode** works without an API key or account. Colleague responses are explicitly labelled prepared scenario notes. Results are guided self-assessment, not AI-generated ratings. Users can revise, compare submitted text with the previous attempt, and export their work as JSON.

The Next.js server also includes an OpenAI Responses API adapter and Supabase persistence. Those integrations are implemented but have **not been verified against live services**. No API key was provided or used. Do not present this release as validated AI feedback.

## Run locally

Requires Node.js 22.13+ and pnpm. Install dependencies with `pnpm install`.

- `pnpm dev`: full Next.js application at http://127.0.0.1:3000. In development, progress is stored in ignored `.local-data/` files. No environment variables required for practice mode.
- `pnpm preview:practice`: independent browser practice at http://127.0.0.1:4173. Progress lives in browser localStorage.
- `pnpm build`: production Next.js build.
- `pnpm build:practice`: produces `dist/`, a standalone static deployment of the same React UI. This build contains no server API or AI secrets.
- `pnpm typecheck` and `pnpm test`: type and unit checks.
- With the no-key Next.js server running: `python3 scripts/smoke-test.py` exercises the actual API and removes its own test session.

## Optional AI and database setup

Copy `.env.example` to `.env.local`. Keep it untracked. Never paste keys into the frontend or prefix them with `NEXT_PUBLIC_`.

For server AI, set `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, and `OPENAI_EVALUATION_MODEL`. The starting model candidate is `gpt-5.4-mini`; check availability in your API project. Restart the server. The UI only offers live chat and AI assessment when the server key exists; a valid key/model and credits are still required. Test factual consistency and review quality before demonstrating AI.

For production server persistence:

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the deployment environment.
3. Deploy the Next.js app to Vercel using `pnpm build` and the Next.js preset.
4. Leave `ALLOW_LOCAL_STORAGE` unset on production. Filesystem storage is explicitly refused on Vercel.
5. Set a conservative `AI_DAILY_REQUEST_LIMIT` and verify the deployment with a new guest session.

The timeboxed implementation uses an opaque, random, HttpOnly guest cookie rather than Supabase Anonymous Auth. Only the SHA-256 digest is used as the server record ID. Database tables reject anon/authenticated access; the server checks cookie ownership before service-role access. Sessions have optimistic revisions to reject stale writes. No account registration is required; clearing cookies loses access to a server session. Static practice storage is independently scoped to the current browser and origin.

## Architecture

- `src/lib/scenario.ts`: versioned facts, task board, colleague notes, event and learning rubric.
- `src/lib/engine.ts`: stage transitions, required fields and immutable initial plan.
- `src/lib/transport.ts`: shared UI transport; server API in Next.js, browser storage in static practice.
- `src/lib/store.ts`: Supabase or explicitly local persistence, optimistic writes and daily AI budget.
- `src/lib/ai.ts`: role-restricted context, separate assessment instructions, structured output validation and exact-quote checks.
- `src/app/api/session/route.ts`: guest ownership, transitions, submissions, retry and request leasing.
- `src/components/careerverse.tsx`: responsive interface, local draft recovery, review and export.
- `src/components/career-catalog.tsx` and `src/app/catalog.css`: profession catalog and Headless UI controls.

Progress: explore → initial plan → new QA constraint → final submission → reflection → revision. A guest can submit up to five attempts. AI mode permits at most 40 reserved AI requests per session and uses a shared daily request budget. A timeout/error preserves submitted work; a retry reuses the saved attempt. AI request budgeting counts reservations, including failed calls, to bound spend.

## Limitations and next checks

- Public practice is deliberately authored material plus self-review. AI and Supabase require live integration validation.
- No payments, accounts, cross-device recovery, career suitability predictions or certification.
- Daily AI request count is a cost control, not complete abuse protection. Before broad promotion of an AI-enabled deployment, add infrastructure-level rate limiting for session creation and per-IP traffic.
- Concurrent API mutations use compare-and-swap revisions. AI execution uses a finite lease; a crash can require waiting for it to expire before retry.
- Browser storage is not a backup. Users can export their work, and reset deletes only this product's current session.
- Scenario content and prompt versions must be retained for in-progress sessions when introducing another version.

## Demo flow (3 minutes)

Explore careers → Project Manager → Start practicing → read the brief → open Alex's integration note → enter the four plan sections → continue → respond to the reduced QA allocation → write the client update → submit → use the four self-review criteria → improve the plan → export the work.

Describe the current build honestly: “This is our working practice flow. Prepared colleague notes and self-review are enabled; the server-side AI adapter is ready for integration testing.”

## Product hypothesis

US working adults aged 25–45 preparing for a first PM role. One free simulation, followed by a potential $19–29 paid practice sprint. Pricing, willingness to pay, acquisition costs and retention are hypotheses, not validated results. Interview users and measure completion and second-attempt behaviour before claiming demand.
