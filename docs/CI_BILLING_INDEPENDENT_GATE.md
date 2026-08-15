# The Milano Seal™ — Billing-Independent Merge Gate

GitHub-hosted Actions are a secondary/manual runner only.

The production merge gate is the external Vercel status:

`Vercel – milano-seal-platform`

Vercel executes `node scripts/run-vercel-merge-gate.mjs && next build`.

The runner blocks deployment on validator, typecheck, lint, test, production-governance, Damiani wiring, TIFF certification, or Next.js production build failure.

This does not replace live TIFF or Damiani production certification. Live transaction evidence remains required by `docs/FINAL_PRODUCTION_CERTIFICATION.md`.
