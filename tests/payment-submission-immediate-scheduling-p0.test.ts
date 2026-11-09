import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateSchedulingGate,evaluateExecutionGate} from '@/lib/scheduling/complimentarySchedulingGate';
const submitted={id:'synthetic',payment_status:'unpaid',payment_confirmed:false,payment_settlement_status:'observed_pending',amount_due:100,amount_paid:0,payment_observed_at:'2026-11-09T00:00:00Z',payment_observed_amount:100,payment_observed_currency:'USD',payment_observed_reference:'MS-SYNTHETIC',currency:'USD',wise_reference:'MS-SYNTHETIC'};
test('integrity-matched submission cannot schedule or execute',()=>{
 assert.equal(evaluateSchedulingGate({matter:submitted}).schedulingEligible,false);
 assert.equal(evaluateExecutionGate(submitted).schedulingEligible,false);
});
test('exact verified settlement unlocks both gates while operational blockers still deny scheduling',()=>{
 const paid={...submitted,payment_status:'paid',payment_confirmed:true,payment_settlement_status:'cleared',amount_paid:100};
 assert.equal(evaluateSchedulingGate({matter:paid}).schedulingEligible,true);
 assert.equal(evaluateExecutionGate(paid).schedulingEligible,true);
 assert.equal(evaluateSchedulingGate({matter:paid,allOperationalRequirementsPassed:false}).schedulingEligible,false);
});
test('processing alerts cannot promise pre-settlement scheduling',()=>{
 const alerts=readFileSync('lib/notifications/transactionalEmailAlerts.ts','utf8');
 assert.match(alerts,/Scheduling remains locked until Wise settlement is verified/);
 assert.match(alerts,/Submission does not authorize scheduling/);
 assert.doesNotMatch(alerts,/submission (can|may) authorize scheduling/);
});
test('client copy keeps submitted distinct from verified and scheduling locked',()=>{
 const page=readFileSync('app/portal/payment/page.tsx','utf8');
 assert.match(page,/Scheduling remains locked while settlement is pending/);
 assert.match(page,/It does not confirm payment/);
});
