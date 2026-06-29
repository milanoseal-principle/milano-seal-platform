const { readFileSync }=await import('fs');
const files=['src/features/payments/paymentGateService.ts','app/api/deals/[id]/payment/manual-confirm/route.ts','app/api/webhooks/wise/route.ts','src/features/release/releaseGateService.ts'];
const all=files.map(f=>readFileSync(f,'utf8')).join('\n');
for (const k of ['Wise','MANUAL_PAYMENT_CONFIRMED','finalPaymentConfirmed','RELEASE_BLOCKED']) if(!all.includes(k)) throw new Error('payment/release missing '+k);
if(/searchParams.*paid|client.*mark.*paid/i.test(all)) throw new Error('paid bypass pattern');
console.log('validate:payment-release-gates passed');
