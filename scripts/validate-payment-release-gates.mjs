const { readFileSync }=await import('fs');
const files=['src/features/payments/paymentGateService.ts','app/api/deals/[id]/payment/manual-confirm/route.ts','app/api/webhooks/wise/route.ts','src/features/release/releaseGateService.ts'];
const all=files.map(f=>readFileSync(f,'utf8')).join('\n');
for (const k of ['Wise','MANUAL_PAYMENT_CONFIRMED','finalPaymentConfirmed','RELEASE_BLOCKED']) if(!all.includes(k)) throw new Error('payment/release missing '+k);
if(/searchParams.*paid|client.*mark.*paid/i.test(all)) throw new Error('paid bypass pattern');

// Settlement clearance hardening lives in the shared release gate; the route
// must still enforce founder_admin and delegate to it.
const releaseRoute=readFileSync('app/api/deals/[id]/release/route.ts','utf8');
for (const k of ['isFounderAdmin','performFinalRelease']) if(!releaseRoute.includes(k)) throw new Error('release route missing '+k);
const releaseGate=readFileSync('lib/release/performFinalRelease.ts','utf8');
for (const k of ['payment_settlement_status','fundsCleared','PAYMENT_RELEASE_OVERRIDE_APPROVED','RELEASE_GATE_OVERRIDE','payment_confirmed_at','requiresCodiceFiscaleLockForRelease','DOC_RELEASE_CONFIRMED']) if(!releaseGate.includes(k)) throw new Error('release gate missing '+k);
// Confirmation source-of-truth must not be the legacy boolean alone.
if(!/payment_confirmed_at\s*!=\s*null/.test(releaseGate)) throw new Error('release must accept payment_confirmed_at as confirmation');
const migration=readFileSync('supabase/migrations/039_payment_settlement_clearance.sql','utf8');
for (const k of ['payment_settlement_status','payment_cleared_at','founder_payment_override_reason']) if(!migration.includes(k)) throw new Error('migration 039 missing '+k);

// Founder Release Override UI: matter-detail API must expose viewer_role +
// settlement fields; the drawer must gate on founder_admin and post ONLY
// override_reason (no role / payment fields from the client).
const matterDetail=readFileSync('app/api/dashboard/matter-detail/[id]/route.ts','utf8');
for (const k of ['viewer_role','payment_settlement_status','founder_payment_override_at']) if(!matterDetail.includes(k)) throw new Error('matter-detail API missing '+k);
const drawer=readFileSync('components/dashboard/MatterDetailDrawer.tsx','utf8');
for (const k of ['viewer_role','founder_admin','override_reason']) if(!drawer.includes(k)) throw new Error('matter drawer missing '+k);
if(!/JSON\.stringify\(\{\s*override_reason/.test(drawer)) throw new Error('override must post only override_reason');
if(/JSON\.stringify\(\{[^}]*\b(role|payment_status|payment_settlement_status)\b/.test(drawer)) throw new Error('override body must not post role/payment fields');

// Authenticated production matter ledger test: founder-only, test-matter-guarded,
// drives the real release route (block without override, succeed with), verifies
// custody + audit rows, and never touches Wise/Shippo/email/labels.
const e2e=readFileSync('app/api/admin/tests/production-matter-ledger/route.ts','utf8');
for (const k of ['isFounderAdmin','EXECUTE_PRODUCTION_LEDGER_TEST','MS-2026-E2E-','performFinalRelease','override_reason','PAYMENT_RECONCILED','RELEASE_GATE_OVERRIDE','DOC_RELEASE_CONFIRMED','audit_logs','without_override_blocked']) if(!e2e.includes(k)) throw new Error('production ledger test missing '+k);
if(!/status\s*!==\s*402/.test(e2e)) throw new Error('production test must assert release blocked (402) without override');
if(/api\.wise\.com|goshippo|create-label|resend/i.test(e2e)) throw new Error('production test must not call wise/shippo/labels/email');
if(/payment_status:\s*\w+\s*=\s*body|body\.(payment_status|amount_paid|amount_due|role)/.test(e2e)) throw new Error('production test must not accept payment/role fields from body');

// Edge middleware must let the secret-authenticated test runner through (else the
// session gate 401s it before the route runs), and ONLY when the secret matches.
const proxy=readFileSync('proxy.ts','utf8');
for (const k of ['production-matter-ledger','x-test-runner-secret','PRODUCTION_TEST_SECRET']) if(!proxy.includes(k)) throw new Error('proxy test-runner bypass missing '+k);

console.log('validate:payment-release-gates passed');
