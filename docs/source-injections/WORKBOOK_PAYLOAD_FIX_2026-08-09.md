# Workbook payload production fix — 2026-08-09

Root cause confirmed on `main` after PR #178:

- `generatedWorkbookSource.ts` concatenated `chunk2a` + `chunk2b`
- and then concatenated the old full `chunk2` again
- the resulting gzip stream contained duplicate payload bytes
- Next.js failed during page-data collection for `/dashboard/workbook/[sheet]` with `Z_DATA_ERROR` / `invalid block type`

Corrective action:

- remove the stale `chunk2` import from the runtime loader
- remove `chunk2` from `WORKBOOK_SOURCE_GZIP_BASE64`
- preserve `chunk2a` + `chunk2b` as the exact replacement shard pair
- no workbook rows, formulas, module routes, payment logic, auth logic, or client account logic changed

Required gate before merge:

- typecheck
- lint
- tests
- production build
- all release validators
- all Vercel checks green
