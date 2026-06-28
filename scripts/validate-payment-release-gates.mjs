const { readFileSync }=await import('fs');
const files=['src/features/payments/paymentGateService.ts','app/api/deals/[id]/payment/manual-confirm/route.ts','app/api/webhooks/wise/route.ts','src/features/release/releaseGateService.ts'];
const all=files.map(f=>readFileSync(f,'utf8')).join('\n');
for (const k of ['Wise','MANUAL_PAYMENT_CONFIRMED','finalPaymentConfirmed','RELEASE_BLOCKED']) if(!all.includes(k)) throw new Error('payment/release missing '+k);
if(/searchParams.*paid|client.*mark.*paid/i.test(all)) throw new Error('paid bypass pattern');

// Settlement clearance hardening: final release must require cleared funds (not
// merely observed) or a ledgered founder override.
const releaseRoute=readFileSync('app/api/deals/[id]/release/route.ts','utf8');
for (const k of ['payment_settlement_status','fundsCleared','PAYMENT_RELEASE_OVERRIDE_APPROVED','RELEASE_GATE_OVERRIDE']) if(!releaseRoute.includes(k)) throw new Error('release clearance gate missing '+k);
const migration=readFileSync('supabase/migrations/039_payment_settlement_clearance.sql','utf8');
for (const k of ['payment_settlement_status','payment_cleared_at','founder_payment_override_reason']) if(!migration.includes(k)) throw new Error('migration 039 missing '+k);

console.log('validate:payment-release-gates passed');
