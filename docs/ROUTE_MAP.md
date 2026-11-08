# The Milano Seal™ — Generated Canonical Route Map

> **AUTO-GENERATED — DO NOT HAND EDIT**
>
> Generate: `node scripts/generate-route-map.mjs`  
> Validate: `node scripts/generate-route-map.mjs --check`

## Purpose

This registry is generated from current `app/**/page.*` and `app/**/route.*` source files.
It protects the production-critical Milano Seal client, operator, payment, intake, Matter Truth, reconciliation, release and Wise surfaces from documentation drift.

The complete application route tree remains the source of truth for every non-critical route.
This document does not replace role authorization, the canonical Matter state machine, execution truth, Wise reconciliation, RLS, or live transaction certification.

## Production-Critical Routes

| Route | Kind | Source File |
|---|---|---|
| `/` | PAGE | `app/page.tsx` |
| `/intake` | PAGE | `app/intake/page.tsx` |
| `/professional/damiani` | PAGE | `app/professional/damiani/page.tsx` |
| `/today` | PAGE | `app/today/page.tsx` |
| `/dashboard` | PAGE | `app/dashboard/page.tsx` |
| `/dashboard/control-plane` | PAGE | `app/dashboard/control-plane/page.tsx` |
| `/dashboard/control-plane/board-room` | PAGE | `app/dashboard/control-plane/board-room/page.tsx` |
| `/api/dashboard/control-plane/governance` | API | `app/api/dashboard/control-plane/governance/route.ts` |
| `/api/dashboard/control-plane/governance/run` | API | `app/api/dashboard/control-plane/governance/run/route.ts` |
| `/api/dashboard/control-plane/governance/metrics` | API | `app/api/dashboard/control-plane/governance/metrics/route.ts` |
| `/api/cron/governance` | API | `app/api/cron/governance/route.ts` |
| `/dashboard/reconciliation` | PAGE | `app/dashboard/reconciliation/page.tsx` |
| `/dashboard/matters/[matterId]/truth` | PAGE | `app/dashboard/matters/[matterId]/truth/page.tsx` |
| `/dashboard/pipeline` | PAGE | `app/dashboard/pipeline/page.tsx` |
| `/dashboard/needs-review` | PAGE | `app/dashboard/needs-review/page.tsx` |
| `/dashboard/follow-ups` | PAGE | `app/dashboard/follow-ups/page.tsx` |
| `/dashboard/apostille` | PAGE | `app/dashboard/apostille/page.tsx` |
| `/dashboard/courier` | PAGE | `app/dashboard/courier/page.tsx` |
| `/dashboard/ledger` | PAGE | `app/dashboard/ledger/page.tsx` |
| `/dashboard/authorities/verify` | PAGE | `app/dashboard/authorities/verify/page.tsx` |
| `/workspace/release` | PAGE | `app/workspace/release/page.tsx` |
| `/portal` | PAGE | `app/portal/page.tsx` |
| `/portal/payment` | PAGE | `app/portal/payment/page.tsx` |
| `/portal/documents` | PAGE | `app/portal/documents/page.tsx` |
| `/portal/invoice` | PAGE | `app/portal/invoice/page.tsx` |
| `/portal/release` | PAGE | `app/portal/release/page.tsx` |
| `/portal/tracking` | PAGE | `app/portal/tracking/page.tsx` |
| `/api/health` | API | `app/api/health/route.ts` |
| `/api/intake` | API | `app/api/intake/route.ts` |
| `/api/webhooks/wise` | API | `app/api/webhooks/wise/route.ts` |
| `/api/dashboard/operator-intelligence` | API | `app/api/dashboard/operator-intelligence/route.ts` |

## Governance

- Never manually label a production-critical route as missing.
- Add/remove the underlying source route, then regenerate this file.
- Vercel production validation fails when this file drifts from source.
- `/today` is a read-only Milano Operator Intelligence surface.
- `/dashboard/control-plane` is the canonical platform meta-governance and system-registry surface.
- `/dashboard/reconciliation` is the canonical read-only cross-domain discrepancy surface.
- `/dashboard/matters/[matterId]/truth` is the operator Matter Truth inspection surface and does not own canonical state.
- `/portal/payment` remains canonical-Matter and Wise-reconciliation driven.
- `/api/webhooks/wise` is the canonical production Wise webhook.
- Live TIFF and Damiani acceptance remain mandatory after code/deployment validation.
