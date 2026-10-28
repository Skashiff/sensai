# Sensai — AI Career Coach

Sensai helps users build a resume, draft a tailored cover letter, and practice technical interview questions. An industry dashboard provides clearly labelled AI-generated career and salary estimates.

Created by **Ariba Ansari and Kashif Siddique**.

## Features

- Clerk sign-in with resource-level authorization on server actions.
- Resume form and Markdown editing, saved form fields, sanitized previews, and PDF export.
- Cover letters generated from the supplied profile and job description, without instructions to invent achievements.
- Ten-question quizzes scored from a server-stored answer key. Attempts expire after one hour; repeated submissions return the same saved assessment.
- Quiz history, average score, latest score, and explanations after submission.
- Shared industry insight caching and a weekly Inngest refresh.
- A database-backed allowance of 20 AI requests per user per UTC clock hour, shared across app instances. Failed generation attempts also consume an allowance.

## Stack

Next.js 15 App Router, React 19, Tailwind CSS, shadcn/ui, Clerk, PostgreSQL, Prisma 6, Google GenAI SDK, Inngest, and Recharts.

## Local setup

Use Node.js 24 LTS (`.nvmrc`) and a PostgreSQL database. Node 22.12 or newer is supported by the development tooling.

```bash
npm ci
cp .env.example .env.local
```

Fill in the variables below in `.env.local`. The app reads `.env.local`, but Prisma CLI commands read `.env` or exported shell variables. Export `DATABASE_URL` in your shell as well, or put just the database URL in a git-ignored `.env` file.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL; also needed by Prisma migration commands. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public key from your Clerk development application. |
| `CLERK_SECRET_KEY` | Server key from the same Clerk application. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` for the included sign-in page. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` for the included sign-up page. |
| `GEMINI_API_KEY` | Server-side Google Gemini API key. |
| `GEMINI_MODEL` | Supported text model; defaults to `gemini-3.8-flash`. |
| `INNGEST_SIGNING_KEY` | Production request verification for Inngest Cloud. |
| `INNGEST_EVENT_KEY` | Inngest event key, if sending events or connecting to Cloud. |

```bash
npm run db:deploy
npm run dev
```

Open <http://localhost:3000>, sign up, and complete the profile. `npm ci` generates the Prisma client. Install development dependencies before building; the Prisma CLI, tests, and build tools are development dependencies.

For local scheduled-job testing, run the [Inngest Dev Server](https://www.inngest.com/docs/local-development) and connect it to `http://localhost:3000/api/inngest`. Cloud jobs require a registered deployed endpoint and signing key. The weekly schedule is Sunday at 00:00 UTC.

## Checks

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev
```

After applying migrations, `npm run check:services` checks database schema metadata and sends one small synthetic Gemini request. Run it explicitly with the intended environment loaded; it does not read user data or replace signed-in browser tests.

The regression suite covers authorization, first-user redirects, invalid/tampered quiz submissions, server-side scoring, retries, AI response validation, request quotas, failed saves, and resume editing after reload. AI and authentication calls in unit/component tests are mocked; passing tests does not prove real API credentials or deployment configuration work.

To run the PostgreSQL integration tests against a disposable database after applying migrations:

```bash
RUN_DB_TESTS=1 npm test
```

GitHub Actions starts a disposable PostgreSQL service, applies migrations, runs tests and lint, and builds with a placeholder public Clerk key. No live Clerk or Gemini requests are made by that build check.

## Deploying or upgrading an existing installation

1. Configure the environment variables on the hosting platform, using production Clerk keys for the production app.
2. Back up the database, then run `npm run db:deploy` against the target database **before serving the updated application**. Run the migration from an environment with the Prisma CLI installed.
3. Run `npm run build` and deploy the result, or let your host build the branch.
4. Register `/api/inngest` with Inngest Cloud and configure its signing key for scheduled refreshes.
5. Smoke-test sign-up/onboarding, resume save and reload, PDF export, a cover letter, and a complete quiz with the real configured services.

The new migration is additive: it preserves existing users, resumes and assessments, adds nullable structured resume data, stores quiz attempts, and adds hourly AI counters. Existing Markdown-only resumes remain editable in the Markdown tab; their old form fields cannot be reconstructed automatically. Existing assessments remain visible. New quizzes use the secured attempt flow.

On Vercel, `vercel.json` runs migrations before building, so a failed migration prevents the new deployment from becoming ready. The migration uses that deployment's `DATABASE_URL`. Configure a separate Preview database before introducing migrations that could affect a live application's existing schema; a variable shared across Preview and Production points both at the same database.

## Data and content limitations

- Relevant profile details and submitted job/resume text are sent to Google Gemini when AI tools are used. The application stores profile, resume, cover-letter and quiz data in the configured PostgreSQL database; Clerk handles authentication.
- Industry insights are model-generated estimates, not live or independently verified market statistics. Salary examples use annual USD amounts for the US market. Verify relevant local sources before relying on them.
- AI output can be inaccurate. Review all text before using it in an application. The prompts prohibit invented qualifications, employers and achievement metrics.
- PDF export renders the resume to an image-based PDF. It is not an ATS scoring tool and does not guarantee machine-readable text. Keep the Markdown/text version for applications that require selectable text.
- Landing-page examples use sample names and photos, not verified customer testimonials.

## Dependency notes

PostCSS is overridden to the patched 8.5 release used by this project. Prisma's config-only `deepmerge-ts` dependency is overridden to 8.x; Prisma client generation, schema validation, migrations and the application build are checked with that override.

The Inngest 3 SDK still depends on Zod 3, which currently has an upstream high-severity collection-validation advisory. The application uses patched Zod 4 for its own schemas. An incompatible override of the SDK's Zod dependency is intentionally avoided; track the upstream fix and review `npm audit --omit=dev` when upgrading. Keep Inngest signing verification enabled in production and configure request size/rate limits on the hosting platform.

## Screenshots

![image](https://github.com/user-attachments/assets/78adda3c-91c9-4bec-8a4b-a5a1e5ba62b0)
![image](https://github.com/user-attachments/assets/c10b4fd1-d5b8-4c26-b337-fcb5c81109c6)
![image](https://github.com/user-attachments/assets/9a51d182-644a-460f-b17c-21a2af0b1108)
![image](https://github.com/user-attachments/assets/3fea7afc-b946-4a17-92b9-efb35cbc1a9e)
![image](https://github.com/user-attachments/assets/62d959cf-8b51-490f-801a-fc3152443ae9)
![image](https://github.com/user-attachments/assets/0ba20a25-4c1c-4d77-9b4e-c991964abf73)
