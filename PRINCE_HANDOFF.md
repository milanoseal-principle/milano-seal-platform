# The Milano Seal™ — Historical Developer Handoff

**Status:** DEPRECATED / NON-AUTHORITATIVE  
**Do not use this file for production deployment, payment configuration, route setup, or transaction certification.**

This file previously described an older pre-production handoff and is intentionally retained only as a historical pointer.

## Current production authority

Use, in order:

1. Current application code on `main`.
2. `data/matter-state-machine.ts`.
3. `lib/matter/executionTruth.ts`.
4. `lib/wise.ts` and `app/api/webhooks/wise/route.ts`.
5. Current Supabase migrations.
6. `docs/FINAL_PRODUCTION_CERTIFICATION.md`.
7. `DEPLOY_CHECKLIST.md`.
8. Generated `docs/ROUTE_MAP.md`.

## Current payment architecture

The Milano Seal production payment architecture is **Wise Business only**.

Canonical production webhook:

```text
POST https://themilanoseal.com/api/webhooks/wise
```

Wise production verification uses RSA-SHA256 signature verification and canonical Matter reconciliation.

Do not restore any retired payment-provider architecture from historical commits or handoff notes.

## Current deployment architecture

GitHub-hosted Actions are manual-only.

Feature-branch Vercel preview builds are intentionally skipped to control deployment spend.

Production code flow:

```text
branch
→ merge to main
→ Vercel production gate/build
→ live production verification
→ TIFF live acceptance
→ Damiani dry-run
→ Final Truth Review
→ GO / NO-GO
```

A successful build is not transaction certification.
