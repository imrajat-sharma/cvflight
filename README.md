# CVFlight

A full-stack resume workspace built with Next.js App Router, TypeScript, React, PostgreSQL, Drizzle ORM, Zod, and Tailwind CSS. Six templates, structured forms, editable LaTeX, reviewable imports, PDF exports, private saved resumes, and version history.

## Quick start

Requirements: Node.js 22+, npm, PostgreSQL 15+. Docker is optional and used **only** for isolated LaTeX compilation.

1. Install dependencies: `npm install` (use `npm ci` for a locked deployment).
2. Copy `.env.example` to `.env` and configure `DATABASE_URL`.
3. Start PostgreSQL. For example: `docker run --name cvflight-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_db -p 5432:5432 -d postgres:16`.
4. Apply the schema: `npx drizzle-kit push`.
5. Start development: `npm run dev`.
6. Open `http://localhost:3000`.

For production: `npx next typegen`, `npm exec tsc -- --noEmit`, `npm run build`, then run the generated application with `npm run start` using your deployment process manager. The platform-managed environment should use its managed build/start command instead.

`GET /api/health` checks the application and database. No AI, Stripe, or Docker credentials are needed for editing, templates, saving, import, JD/ATS tools, or structured PDF downloads.

## What works out of the box

- Personal information, summary, education, experience, projects, skills, certifications, achievements, and custom entries.
- Add, remove, edit, and reorder entries and whole sections; optional sections are omitted when empty.
- Debounced PostgreSQL autosave; clear connection/save state and retry. An unload warning protects pending changes. A browser-local emergency JSON snapshot is stored while saving.
- Multiple browser-private resumes and named versions. Restoring a version first preserves the current state as a backup.
- Six separate template modules: Classic, Minimal, Software Engineer, Executive, Modern, Academic.
- Live HTML document layout, generated editable `.tex`, PDF, `.tex`, and JSON downloads.
- Existing `.tex` upload/paste, brace-aware rule-based parsing, uncertainty flags, editable import review, and separate storage/download of the unchanged original.
- JSON validation and import/export; JSON import saves a pre-import version.
- Dictionary-based JD keyword analysis, detected responsibilities/experience, overlap score, individual accept/reject controls, and safe structured improvements.
- Explicitly heuristic ATS-readiness checks. These are **not** real ATS scores or hiring predictions.
- Five bring-your-own-key AI providers with explicit data-sharing consent and reviewable suggestions.
- Optional Stripe-managed AI subscriptions, signed webhooks, 100 requests per calendar month, server-side entitlements, and billing portal.

## Two distinct PDF paths

### Structured PDF export (always available)

`ResumeData → pdfService → PDF`

Uses pdf-lib and embedded standard fonts. Produces a real, text-based PDF without interpreting or executing LaTeX. Includes automatic pagination and reports the actual page count to the ATS panel. Standard-font export transliterates accents and replaces unsupported glyphs; for non-Latin scripts, use a compatible LaTeX font/template and the isolated compiler. The live HTML layout is an approximation; the generated PDF iframe shows the exported document itself.

### Secure LaTeX compiler (requires Docker configuration)

`ResumeData → latexRenderer → .tex → compileService → isolated Docker container → PDF`

Build the image:

`docker build -t cvflight-latex:local docker/latex`

Set:

- `LATEX_COMPILER_ENABLED=true`
- `LATEX_DOCKER_IMAGE=cvflight-latex:local` (pin to an immutable digest in production)

The web runtime must be able to invoke the configured Docker runtime. **Never run arbitrary LaTeX directly on the host.** The compiler always uses a new container with:

- No network (`--network=none`).
- Read-only root filesystem; no host bind mounts.
- Numeric unprivileged user, all Linux capabilities dropped, no privilege escalation.
- Fixed executable and fixed argument list; source passed over stdin, never interpolated into a command.
- `-no-shell-escape`, restrictive TeX file policies, no external assets or uploaded paths.
- 256 MB RAM, 1 CPU, 48-process limit, file-size limit.
- Ephemeral no-exec tmpfs work and temporary directories.
- 20-second deadline, bounded input/output, two concurrent jobs per process.
- Forced container cleanup after completion, errors, or timeouts.

The server fails closed if Docker is absent or disabled. It never silently passes hand-edited `.tex` to the structured renderer. The UI explains the distinction and offers a clearly labeled form-based export instead. The `.tex` download is always available.

For hostile multi-tenant production workloads, run the compiler on a dedicated, rootless Docker worker host with patched kernel/runtime, default seccomp or stronger policy, upstream distributed quotas and queueing, and container lifecycle monitoring. Do not mount an unrestricted rootful Docker socket into a publicly exposed application container. Use a dedicated restricted runtime account; access to a Docker daemon is a privileged operational boundary. The included container execution path cannot be integration-tested in environments without Docker.

## Workspace identity and privacy

This implementation uses a high-entropy, HttpOnly, SameSite=Strict private workspace cookie—not an email/password account. All database lookups and mutations are scoped to that identity. New browsers receive independent workspaces. Clearing the cookie loses access; export JSON for portability. Data is not shared through public URLs.

Set `COOKIE_SECURE=true` and `APP_ORIGIN=https://your-domain.example` on HTTPS deployments. Use trusted reverse-proxy configuration, HTTPS, database TLS where appropriate, encrypted backups, and standard infrastructure access control. POST endpoints validate origin and input size. No API keys or provider response bodies are logged. APIs bound errors and rate-limit requests in-process; deploy a distributed limiter/WAF for multi-instance or internet-scale usage.

Paid access is also tied to the browser workspace. The checkout screen explicitly requires acknowledgement of this constraint. Before offering broad commercial service, integrate durable authenticated accounts/recovery, a privacy policy, subscription terms, email support, deletion/retention policy, and account-to-workspace migration. Stripe receipts and customer portal remain the billing system of record.

## Existing-LaTeX import

`latexParser` recognizes common section aliases, standard commands, nested brace groups, `resumeSubheading`, `resumeProjectHeading`, `cventry`, `cvevent`, `entry`, and related formats. It extracts names, contacts, URLs, text, dates, role/education/project entries, and bullet groups. Unknown section names become custom sections. Parser confidence is deliberately conservative.

The importer **does not execute or expand arbitrary TeX macros**. TeX is programmable, so lossless semantic inference for every custom macro is impossible without user review. Unfamiliar structures are highlighted, all extracted plain text is visible, and the complete original is preserved unchanged. Check names, section boundaries, dates, skills, and technologies before confirming. Local parsing does not send source files to any third party.

## AI providers

Supported: Mistral, ChatGPT (OpenAI), Gemini, Claude, and Grok. Defaults are in `src/lib/services/aiService.ts`; the UI allows a model override because account access and model availability change.

BYOK keys live only in React memory, are passed to the server for a single proxied request, and are never saved to PostgreSQL/localStorage. They are lost when the AI panel unmounts. Only fixed provider endpoints are allowed; users cannot supply arbitrary proxy URLs. Upstream requests have deadlines, bounded inputs, no tool execution, and error messages that do not echo secrets.

Users explicitly consent before their resume/JD is sent to a provider. Provider account pricing, data retention, and model access apply. AI advice must be reviewed: it never silently rewrites resume facts. Local JD suggestions that merely surface existing skills can be accepted and applied deterministically. AI recommendations are accepted for manual editing to avoid injecting hallucinated facts.

## Managed AI and Stripe

Set all of:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID` (a recurring price)
- `APP_ORIGIN` (canonical return origin)
- `MANAGED_AI_API_KEY`
- Optional `MANAGED_AI_PROVIDER` and `MANAGED_AI_MODEL`

Create a recurring product/price in Stripe. The plans UI fetches the actual configured price, rather than displaying an invented amount. Configure Stripe Customer Portal to allow payment-method updates and cancellation.

Configure signed webhooks at `/api/billing/webhook` for:

- `checkout.session.completed`
- `customer.subscription.created`, `.updated`, `.deleted`
- `invoice.paid`, `invoice.payment_failed`

The handler verifies the signature on the raw request and retrieves current subscription state, making repeated or out-of-order deliveries converge on the current state. Stripe receives a one-way hash of the workspace identity, not the cookie token. Pro access requires active/trialing status. Usage increments atomically in PostgreSQL and resets by UTC calendar month. Provider attempts count toward usage even if the upstream request fails. Use test mode and Stripe test cards first; verify activation, renewal, cancellation, failed payments, portal access, and entitlement denial before live billing. Live provider calls and payment settlement cannot be tested without deployment credentials.

If these secrets are absent, checkout is disabled with an explicit explanation; the app does not claim a purchase was made. BYOK and core resume features remain usable.

## ATS and JD methodology

The ATS panel checks standard section presence, contact format, structured text volume, entry consistency, URL syntax, empty entries, estimated or actual page count, optional keyword overlap, and explicit LaTeX compile status. It does **not** crawl URLs, test third-party ATS software, infer employability, or claim true ATS ranking. URL checks are syntactic; one-page estimates are replaced by actual page counts after structured export.

JD analysis uses a local vocabulary, detects responsibility sentences and experience-year phrases, compares only against supplied resume content, and labels absent skills as gaps—not suggestions to fabricate experience. There are no hidden keywords, white text, zero-size text, off-page content, or ATS-manipulation features.

## Architecture

- `src/lib/resume.ts`: common `ResumeData`, entry schema, defaults, and section labels.
- `src/db/schema.ts`: Drizzle tables for resumes, versions, and subscriptions.
- `src/lib/templates/*.ts`: separate template configurations.
- `src/lib/services/resumeService.ts`: scoped persistence and versioning.
- `latexParser.ts`, `latexRenderer.ts`, `compileService.ts`, `pdfService.ts`: import/export engine.
- `jdAnalyzer.ts`, `optimizationService.ts`, `atsService.ts`: truthful local analysis.
- `aiService.ts`, `billingService.ts`: provider adapters and paid entitlements.
- `src/app/api/*`: validated server-only HTTP boundaries.
- `src/components/*`: responsive workspace, forms, preview, dialogs, and tools.
- `docker/latex/Dockerfile`: offline compiler image.

## Validation

Run from the project root:

- `npx next typegen`
- `npm exec tsc -- --noEmit --pretty false`
- `npm run lint`
- `npx tsx --test tests/services.test.ts`
- `npm run build`

Browser tests require an already running application and database:

- `npx playwright install --with-deps chromium`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test`

Browser coverage includes editing/autosave/reload, template preservation, real PDF downloads, LaTeX import review/persistence, version restore, truthful JD/ATS messaging, fail-closed compilation, cross-workspace isolation, and mobile overflow/navigation.

## Deployment checklist

1. Provision PostgreSQL, configure environment variables, apply Drizzle schema using a trusted release process. Use reviewed migrations instead of schema push for an existing production database.
2. Deploy the Node runtime with persistent external PostgreSQL; never depend on the application filesystem for resume storage.
3. Configure canonical HTTPS origin and secure cookies.
4. Run lint, service tests, TypeScript, production build, browser tests, and `/api/health`.
5. Enable the compiler only with a properly isolated patched Docker worker. Test resource abuse, timeout, and cleanup before public access.
6. Enable Stripe only after test-mode webhook/portal checks, provider keys, durable account recovery, and commercial policies are ready.
7. Add distributed rate limits, observability without resume/key logging, database backups, retention/deletion jobs, and incident monitoring appropriate to your scale.
# cvflight
