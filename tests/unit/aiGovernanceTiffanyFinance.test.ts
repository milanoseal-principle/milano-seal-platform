import test from 'node:test';import assert from 'node:assert/strict';
import {calculatePrice} from '@/lib/pricing';import {computeDiscountAmount,validateCodeRedeemable,type DiscountCode} from '@/lib/discountCodes';
import {nonDiscountableTotalFromBreakdown,eligibleSubtotalFromTotal,effectiveTotalAfterCourtesy} from '@/lib/pricing/courtesyEligibility';
import {generateInvoice} from '@/lib/invoice';import {evaluateSchedulingGate} from '@/lib/scheduling/complimentarySchedulingGate';
const code=(name:string)=>Object.freeze({id:'isolated-'+name,code:name,discount_type:'percentage',discount_value:50,status:'active',usage_limit:1,usage_count:0,starts_at:null,expires_at:null,applies_to:'eligible_subtotal'} as DiscountCode);
for(const name of ['TIFFTEST50','DAMIANI50'])test(`G5 ${name} synthetic calculation excludes courier and never redeems`,()=>{
 const coupon=code(name),before=JSON.stringify(coupon);const quote=calculatePrice({tier:'priority',shipping:'international',document_count:1,apostille_count:1});
 const passThrough=nonDiscountableTotalFromBreakdown(quote.breakdown);const eligible=eligibleSubtotalFromTotal(quote.total,passThrough);const discount=computeDiscountAmount(coupon,eligible);
 assert.equal(discount,Math.round(eligible*50)/100);const total=effectiveTotalAfterCourtesy(quote.total,discount);assert.equal(total,eligible-discount+passThrough);
 const invoice=generateInvoice(total);assert.equal(Math.round((invoice.retainer+invoice.balance)*100),Math.round(total*100));assert.equal(invoice.status,'awaiting_payment');assert.equal(invoice.payment_options.primary,'wise');assert.equal(JSON.stringify(coupon),before);
 for(const state of [{payment_confirmed:false,payment_status:'unpaid',payment_settlement_status:'pending'},{payment_confirmed:true,payment_status:'paid',payment_settlement_status:'pending'}])assert.equal(evaluateSchedulingGate({matter:{id:'00000000-0000-4000-8000-000000000001',...state,amount_due:invoice.retainer,amount_paid:invoice.retainer}}).schedulingEligible,false);
});
test('G5 forged or exhausted synthetic codes fail eligibility; provider fee aliases do not affect money',()=>{
 assert.equal(validateCodeRedeemable({...code('TIFFTEST50'),status:'inactive'}).ok,false);assert.equal(validateCodeRedeemable({...code('DAMIANI50'),usage_count:1}).ok,false);
 const plain=calculatePrice({tier:'priority'}),injected=calculatePrice({tier:'priority',ron_cost:9999,bluenotary_fee:9999} as never);assert.equal(injected.total,plain.total);
});
