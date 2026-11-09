# Local validation and isolated preview

This workflow uses the existing production gates and existing Vercel project. GitHub remains private source control. No runner service, paid CI plan, second database model, alternate payment authority or replacement CI status is introduced. Required hosted checks remain required; local PASS never changes a GitHub check to PASS. Vercel/Supabase usage can incur their own costs; this workflow does not purchase GitHub Actions minutes.

## Reproducible local validation

Use a trusted disposable checkout with no `.env`/environment-specific files or production credentials. Install the committed lockfile with `npm ci`. Provision the existing locked Playwright Chromium through `npx playwright install chromium`, or use an already installed compatible Chromium. Node24 is the tested cloud runtime; existing workflows retain their configured Node versions. No dependency/browser installation happens implicitly in the runner.

Commit the proposed changes, then run:

```sh
npm run check:local
```

For this managed environment, the installed system Chromium and writable npm cache are selected without changing assertions:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm_config_cache=/workspace/.npm-cache npm run check:local
```

The runner refuses tracked edits, untracked source and environment files, prevents overlapping runs, refuses active Next build/dev locks, clears only the generated `.next` cache and runs `next typegen`, strips provider credentials from child environments, and never runs deployment commands or writes GitHub check statuses. It calls the existing Vercel merge gate, production build, supplementary PR checks/database suites, G5 regressions, safe source-certification harness, production dependency audit and existing rendered suites sequentially. Typecheck, lint, all unit tests, migration chain/replay/upgrade/restore and validators remain inside the existing merge gate. It stops at the first failure and preserves that failure.

Evidence is stored under `artifacts/local-validation/<UTC-run>-<SHA>/summary.json` with exact full source SHA, tree, lockfile SHA256, Node version, commands, timestamps, log locations and exit codes. Browser screenshots and suite reports retain their existing artifact locations. Both public-rendered targets are explicitly localhost; no production-portal fallback is used. The runner supplies only an inert loopback Supabase URL and dummy public key so the SDK can initialize the unauthenticated sign-in page without a real project. There is no signed-in session or database access; this is not authentication certification. Controlled fixture transport does not prove hosted authentication or database persistence. Local summaries are evidence, not independent hosted CI certification. Archive the run directory and existing browser artifact directories together outside the source repository; inspect logs before sharing. `artifacts/` is ignored because screenshots/authenticated storage state can be sensitive.

A final source-change check invalidates the run if tracked/untracked source or HEAD changes. Do not cherry-pick an old PASS onto new source. Browser launch failure or missing dependencies are failures, not skipped checks. If an interrupted process leaves `artifacts/local-validation/.lock`, confirm no validation/Next process is running before removing that lock and starting a new run.

## Vercel preview independent of GitHub Actions

Use the **existing** linked Vercel project and its Preview environment. An authorized operator with the Vercel CLI can deploy a trusted checkout independently of GitHub Actions:

```sh
vercel deploy --target=preview
```

Do not use `--prod`, prebuilt artifacts that skipped the existing gate, or change `buildCommand`/required checks. The current `vercel.json` runs the merge gate and real build, and intentionally suppresses ordinary Git previews. Preserve that predicate. If an approved Git-triggered preview is chosen instead, its existing `[validate-preview]` opt-in is used only after the isolation checks below. A canceled/ignored build is not a preview deployment. CLI deployment still requires actual provider access and may use Vercel plan resources.

Before deploying, confirm securely in Vercel that Preview variables use an approved **isolated** Supabase project/branch, never the production project or service-role key. Confirm matching auth redirects, private storage, RLS/grants, callback URLs and test-only provider settings. Read hosted migration provenance using `supabase/verification/final_gap_provenance.sql`; apply migrations to the isolated preview only through its approved operator process. Agents and external delivery/execution remain disabled; no real Wise credit, RON, email, courier purchase or customer record is authorized by this local workflow.

After deployment, verify READY, the exact committed SHA, preview-only alias, health and isolated database identity. Use approved synthetic identities and Matter records supplied through secure bindings. Run the existing authenticated observer:

```sh
npm run observe:ai-governance-hosted
```

Required binding names from the existing script are `GOVERNANCE_QA_APPROVED_URL`, `GOVERNANCE_QA_APPROVED_RUN_ID`, `GOVERNANCE_QA_APPROVED_MATTER_ID`, `GOVERNANCE_QA_APPROVED_SHA`, `GOVERNANCE_QA_STORAGE_STATE_PATH`. The read-only schema observer uses `SUPABASE_ACCESS_TOKEN` and `SUPABASE_QA_PROJECT_REF`. Browser storage state stays outside Git. These observers do not themselves constitute the entire hosted P19 E2E; retain the existing certification checklist and exact same-Matter evidence for every required step. Never bypass authentication or ask for credentials/customer documents in chat.

## Current access and release boundary

At implementation, repository privacy was confirmed via GitHub API; main `e9064bb342c123d95fefadabac2ec5b2c5b1e26f` includes merged #452. Its branch was not re-pushed. The selected cloud environment has current/enforced readiness but no secret/runtime/identity bindings and does not permit Vercel or Supabase management hosts. `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SUPABASE_QA_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN` are absent; Vercel CLI is not installed. Therefore authenticated preview is BLOCKED, not simulated or certified. Supply any future access through approved environment settings, including narrowly scoped provider/preview hosts and the approved isolated project; do not put secret values in issues, commits or chat.

GitHub's job-startup billing/spend-limit error remains separate from local application results. Preserve failing remote conclusions and report them as billing-blocked; do not write successful replacement statuses, disable required checks, make the repository public, or repeatedly dispatch hosted jobs. Normal PR pushes still trigger the existing workflows; they may consume included minutes if billing resumes. This workflow does not change Actions budgets or claim no other platform usage cost.

Restore independently verified required hosted CI and complete preview/hosted/live gates before production certification. Founder approval remains mandatory for production deployment, hosted production migrations, agent activation and real provider actions. No merge/deployment/activation is performed by `check:local`.
