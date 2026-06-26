<p align="center">
  <img src="public/milano-seal-gold-transparent-512.png" alt="The Milano Seal™" width="120">
</p>

<h1 align="center">The Milano Seal™</h1>

<p align="center">
  U.S. Document Execution for International Use — Remote Online Notarization,
  Apostille Coordination, and structured international document routing.
</p>

---

## Platform Summary

The Milano Seal™ is a U.S.-based document execution and international logistics platform operating at the intersection of high-trust legal logistics and professional relationship management.

**Engine A — Premium International:** Apostille coordination, embassy/consular legalization, courier release, multi-country document strategy. Tiered pricing: Signature, Priority, Executive lanes.

**Engine B — Domestic Relationship:** Remote Online Notarization (RON), identity verification, professional relationship support. Entry-level standardized pricing.

## Stack

- Next.js App Router · React · TypeScript · Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)
- Vercel deployment
- Geist · Inter · Playfair Display fonts

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
WISE_API_TOKEN
WISE_PROFILE_ID
NEXT_PUBLIC_SITE_URL=https://themilanoseal.com
NEXT_PUBLIC_GBP_REVIEW_URL=https://g.page/r/YOUR_REAL_GBP_LINK/review
```

## Deployment gate

Do not declare production-ready until:

1. Vercel build green
2. `GET /api/admin/db-health` → `deals_write.ok = true`
3. `founder_admin` role verified on auth user
4. Migration `027_founder_discount_override.sql` applied in Supabase
5. Portal internal-data scan passes
6. First real matter processed intake → completion

## Production module index

| Module | Status | Doc |
|---|---|---|
| Intake + DB write | Gate check required | `docs/runbooks/FIRST_REAL_MATTER_RUNBOOK.md` |
| Founder Discount Override | Built | `/dashboard/founder-pricing` |
| Payment / Invoice Safety | Wired | Portal invoice page |
| Audit Ledger | Spec ready | `docs/system/AUDIT_LEDGER.md` |
| Security & RLS | Enforced | `docs/security/RLS_HARDENING.md` |
| Execution Pipeline | Spec ready | `docs/ops/EXECUTION_PIPELINE.md` |
| Progress Passport | Spec ready | `docs/ops/PROGRESS_PASSPORT.md` |

## Architecture references

- `docs/system/FINAL_PRODUCTION_MODULES.md` — module index
- `docs/REMOTE_P0_CLEARANCE.md` — launch runbook
- `docs/go-live-checklist.md` — go-live checklist
- `docs/architecture/` — Layer 1.7 expansion, destination intelligence, CTO handoff, sovereign backlog

All architecture documents are documentation-only and do not override the P0 launch lock or active repository reality.
