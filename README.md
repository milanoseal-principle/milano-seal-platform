# milano-seal-platform       

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

---

## THE MILANO SEAL™ LAUNCH LOCK

The production codebase has completed P0 hardening in-repo.

The platform is **not** considered live-cleared until remote infrastructure confirms:

| Item | Required |
|---|---|
| Migration `009_notifications_table.sql` applied | YES |
| Migration `010_operator_file_isolation.sql` applied | YES |
| Migration `011_alliance_tracking_schema.sql` applied | **NO — P1 gated** |
| Migration `012_country_registry.sql` applied | **NO — P1 gated** |
| `documents` Supabase storage bucket set to Private | YES |
| `PORTAL_SESSION_SECRET` seeded in Vercel | YES |
| Vercel production build passed | YES |
| `scripts/smoke-test.sh` passed | YES |
| Manual intake test passed | YES |
| Portal OTP + HMAC session test passed | YES |

No P1 or P2 system may be activated until this checklist is clean.

**Launch runbook:** `docs/REMOTE_P0_CLEARANCE.md`  
**Go-live checklist:** `docs/go-live-checklist.md`  
**Final launch report:** `docs/final-launch-report-template.md`  
**Vercel env reference:** `docs/vercel-env-production.md`  
**Supabase clearance steps:** `docs/supabase-remote-clearance.md`

---

## Architecture References

### Ultra CTO Handoff Reference

The Ultra CTO Handoff System Spec is retained as a future architecture validation layer covering API schemas, relational schema planning, field mapping, state machine rules, event engine behavior, failure escalation, command center wiring, backend architecture, and alliance system planning.

This reference is documentation-only. It does not override the Master Reconciliation Matrix, the P0 launch lock, remote P0 clearance requirements, or active repository reality.

**Location:** `docs/architecture/ULTRA_CTO_HANDOFF_REFERENCE.md`

### P1/P2 Architecture Notes

Acquisition entry flow, smart intake parser, portal terminal UX, health latency targets, logger security rules, and shipping 501 guard specifications.

**Location:** `docs/p1-p2-architecture-notes.md`

---

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_5unbojWp9IqEETScJrzTH5h6KxkH)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/milanoseal-principle/milano-seal-platform" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
