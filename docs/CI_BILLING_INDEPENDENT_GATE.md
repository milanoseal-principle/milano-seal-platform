# The Milano Seal™ — Billing-Independent Production Gate

GitHub-hosted Actions are a secondary/manual runner only.

Routine deployment does **not** run GitHub Actions.

`vercel.json` intentionally skips non-production builds so feature-branch pushes do not consume normal Vercel preview-build usage.

Production flow:

```text
GitHub feature branch
→ no preview build
→ merge to main
→ one Vercel production build
→ production verification
```

The production build executes:

```text
node scripts/run-vercel-merge-gate.mjs && next build
```

The merge gate blocks the production build on route drift, active payment-documentation drift, Milano Operator Intelligence drift, validator failures, typecheck, lint, tests, production governance, Damiani wiring, TIFF certification contract validation, or Next.js build failure.

The Vercel build gate does not replace live TIFF or Damiani production certification.

Live transaction evidence remains required by `docs/FINAL_PRODUCTION_CERTIFICATION.md`.
