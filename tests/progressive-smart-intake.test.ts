import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SERVICE_ENTRIES,normalizeServiceIntent,serviceIntakeHref} from '@/lib/intake/serviceIntent';
import {getSmartIntakeQuestionPlan} from '@/lib/intake/questionPlan';
import {classifyIntake} from '@/lib/intake/smartClassification';
import {buildIntakeClarifications} from '@/lib/intake/intakeClarifications';
import {commercialHref} from '@/lib/conversion/commercialCta';
import {intakeFormSchema,restoreIntakeDraft} from '@/lib/intake/intakeDraft';
import {buildIntakeAnalyticsPayload} from '@/lib/intake/intakeAnalytics';
const classification=classifyIntake({text:'I have a document and need help.'});
const plan=(intent:unknown,internationalUse?:boolean)=>getSmartIntakeQuestionPlan({intent,internationalUse,classification,questions:buildIntakeClarifications(classification).questions});
for(const entry of SERVICE_ENTRIES)test(`${entry.intent} uses the existing intake with normalized context`,()=>{
 const url=new URL(serviceIntakeHref(entry.intent),'https://synthetic.invalid');assert.equal(url.pathname,'/intake');assert.equal(normalizeServiceIntent(url.searchParams.get('intent')),entry.intent);
});
test('unknown, repeated and hostile query values safely use broad discovery',()=>{
 for(const value of [undefined,null,[],['ron','apostille'],{},'javascript:alert(1)','__proto__','RON<script>'])assert.equal(normalizeServiceIntent(value),'unsure');
 for(const [value,expected] of [['RON','ron'],['notary','domestic_execution'],['international','international_execution'],['professional_counsel','foreign_counsel']])assert.equal(normalizeServiceIntent(value),expected);
});
test('simple RON witness and domestic notary omit international sections and destination blockers',()=>{
 for(const intent of ['ron','witness','domestic_execution']){
  const result=plan(intent);assert.equal(result.domestic,true);for(const key of ['showDestination','showOrigin','showAuthority','showAuthentication','showTranslation','showDelivery'] as const)assert.equal(result[key],false,key);
  assert.deepEqual(result.detailSteps,['signers','contact']);assert.ok(result.questions.every(q=>q.id!=='destination'));
 }
 assert.equal(plan('domestic_execution').showServiceLocation,true);
});
test('international use expands the same plan and preserves signer step position',()=>{
 for(const intent of ['ron','witness','domestic_execution']){const result=plan(intent,true);assert.equal(result.showDestination,true);assert.equal(result.showAuthority,true);assert.deepEqual(result.detailSteps,['signers','use','contact']);}
 for(const intent of ['apostille','authentication','international_execution'])assert.equal(plan(intent).showOrigin,true);
 assert.deepEqual(plan('foreign_counsel').detailSteps,['use','contact']);
 assert.equal(plan('unsure').showDestination,true);
});
test('document evidence indicating foreign use expands a domestic preference',()=>{
 const c=classifyIntake({text:'An affidavit for use in Italy.'});const result=getSmartIntakeQuestionPlan({intent:'ron',description:'An affidavit for use in Italy.',classification:c,questions:buildIntakeClarifications(c).questions});assert.equal(result.international,true);assert.equal(result.showDestination,true);
});
test('visibility has no authority over classification eligibility witness execution tier or money',()=>{
 const before=JSON.stringify(classification);for(const {intent} of SERVICE_ENTRIES){const result=plan(intent);assert.equal(JSON.stringify(classification),before);for(const key of ['execution_method','witness_required','ron_eligible','apostille_eligible','tier','amount_due','schedulingEligible'])assert.equal(key in result,false,key);}
});
test('first-class witness context uses the existing lead and commercial route',()=>{
 for(const action of ['get_pricing','speak'] as const){const url=new URL(commercialHref(action,{serviceIntent:'witness'}),'https://synthetic.invalid');assert.equal(url.searchParams.get('service_intent'),'witness');}
});
test('service selection and current detail survive draft restore independently of stale URL context',()=>{
 const form=intakeFormSchema.parse({description:'Synthetic affidavit',name:'Test Person',email:'person@example.invalid',phone:'',documentType:'Affidavit',documentCount:1,signerCount:1,originState:'',signerLocation:'Florida',destinationCountry:'',executionType:'',mobileAddress:'',notarizationChoice:'',apostilleChoice:'',translationChoice:'',deadline:'',courierRequired:false,timelineChoice:'standard',deliveryChoice:'',serviceIntent:'witness',serviceIntentSource:'intake',detailStep:1,witnessContext:'Document mentions one witness'});
 const raw=JSON.stringify({version:1,context:'bound-context',savedAt:100,step:2,form});const restored=restoreIntakeDraft(raw,'bound-context',101);assert.equal(restored?.form.serviceIntent,'witness');assert.equal(restored?.form.detailStep,1);assert.equal(restored?.form.witnessContext,form.witnessContext);assert.equal(restoreIntakeDraft(raw,'another-matter-context',101),null);
});
test('analytics segments intent without sending signer witness text or documents',()=>{
 const result=buildIntakeAnalyticsPayload('service_intent_selected',{serviceIntent:'witness',witnessContext:'PRIVATE',document:'PRIVATE',price:0});assert.deepEqual(result.metadata,{serviceIntent:'witness'});
});
test('active intake ships no private pricing engine and server persists separate context',()=>{
 const wizard=readFileSync('components/intake/smart-intake-sop-wizard.tsx','utf8');assert.doesNotMatch(wizard,/import[^\n]+pricing\/(milanoPricingTruth|pricingProjections|pricingDoctrine)/);assert.match(wizard,/getSmartIntakeQuestionPlan/);
 const core=readFileSync('app/api/intake/core.ts','utf8');assert.match(core,/customer_service_context: serviceContext/);assert.match(core,/if \(!verifiedOperator\) executionTruth = provisionalExecutionTruth/);assert.match(core,/calculatePrice/);
 const drawer=readFileSync('components/dashboard/MatterDetailDrawer.tsx','utf8');assert.match(drawer,/label="Client request"/);assert.match(drawer,/label="Confirmed execution route"/);
});

import {captureCustomerServiceContext} from '@/lib/intake/operatorHandoff';
test('private handoff retains all customer statements and discards injected authority',()=>{
 const context=captureCustomerServiceContext({service_intent:'witness',witness_context:'The document mentions one witness.',document_description:'Review my affidavit.',deadline_date:'Friday at noon ET',requested_service_location:'Tampa',receiving_authority:'Recipient office',execution_method:'ron',tier:'executive',payment_confirmed:true,amount_due:1},'2026-11-09T00:00:00Z');
 assert.equal(context.service_intent,'witness');assert.equal(context.international_use,null);assert.equal(captureCustomerServiceContext({international_use:false}).international_use,false);assert.equal(context.witness_context,'The document mentions one witness.');assert.equal(context.document_description,'Review my affidavit.');assert.equal(context.deadline,'Friday at noon ET');assert.equal(context.requested_service_location,'Tampa');for(const key of ['execution_method','tier','payment_confirmed','amount_due'])assert.equal(key in context,false);
});

test('already-issued apostille review does not force a signer section',()=>{assert.deepEqual(plan('apostille').detailSteps,['use','contact']);assert.deepEqual(plan('authentication').detailSteps,['use','contact']);});

import {hasCurrentWiseSubmissionSnapshot} from '@/lib/wise/attemptEvidence';
import {evaluateSchedulingGate} from '@/lib/scheduling/complimentarySchedulingGate';
test('pending submission stays current for idempotency while scheduling remains locked',()=>{
 const matter={id:'synthetic',deal_id:'MS-SYNTHETIC',payment_attempt_id:'current',payment_attempt_started_at:'2026-11-09T00:00:00Z',payment_observed_at:'2026-11-09T00:00:01Z',payment_status:'unpaid',payment_confirmed:false,payment_settlement_status:'observed_pending',amount_due:100,amount_paid:0,currency:'USD',payment_observed_amount:100,payment_observed_currency:'USD',payment_observed_reference:'MS-SYNTHETIC'};
 assert.equal(hasCurrentWiseSubmissionSnapshot(matter),true);assert.equal(evaluateSchedulingGate({matter}).schedulingEligible,false);
 for(const change of [{amount_due:101},{currency:'EUR'},{payment_attempt_id:null},{payment_observed_at:'2026-11-08T00:00:00Z'},{payment_observed_reference:'FOREIGN'},{amount_paid:1},{payment_settlement_status:'failed'}])assert.equal(hasCurrentWiseSubmissionSnapshot({...matter,...change}),false);
});

import {evaluatePaymentIntegrity,getClientPaymentStatusLabel} from '@/lib/safety/payment-integrity';
import {evaluatePaymentGates} from '@/src/features/payments/paymentGateService';
import {evaluateComplimentarySchedulingRequirement} from '@/lib/payments/complimentary-safety';
import {createComplimentaryAuthorization} from '@/lib/payments/complimentary-authorization';
test('legacy integrity panel never grants scheduling from a confirmed flag or platform-fee flag alone',()=>{
 for(const is_platform_fee_only of [false,true]){const row={id:'synthetic',payment_confirmed:true,is_platform_fee_only,payment_status:'paid'};assert.equal(evaluatePaymentIntegrity(row).schedulingAllowed,false);assert.equal(evaluatePaymentIntegrity(row).executionAllowed,false);assert.notEqual(getClientPaymentStatusLabel(row),'Scheduling Unlocked');}
 const row={payment_confirmed:true,is_platform_fee_only:false,payment_status:'paid',payment_settlement_status:'cleared',amount_due:100,amount_paid:100};assert.equal(evaluatePaymentIntegrity(row).schedulingAllowed,true);
 for(const change of [{amount_paid:99},{amount_paid:101},{amount_paid:NaN},{payment_settlement_status:'observed_pending'}])assert.equal(evaluatePaymentIntegrity({...row,...change}).schedulingAllowed,false);
});
test('legacy domain totals and release labels cannot unlock scheduling or release',()=>{
 const row={id:'synthetic',final_total:200,deposit_required:true,deposit_amount:100,deposit_paid_amount:100,amount_received:200,balance_due:0,payment_status:'paid',release_status:'released'};assert.equal(evaluatePaymentGates(row).scheduling_unlocked,false);assert.equal(evaluatePaymentGates(row).release_unlocked,false);
 const verified={...row,payment_confirmed:true,payment_settlement_status:'cleared',amount_due:100,amount_paid:100};assert.equal(evaluatePaymentGates(verified).scheduling_unlocked,true);assert.equal(evaluatePaymentGates(verified).release_unlocked,true);assert.equal(evaluatePaymentGates({...verified,balance_due:100}).release_unlocked,false);
});
test('courtesy scheduling helper rejects a verified boolean without the canonical payment record',()=>{
 const params={quote:{quoteId:null,matterId:'synthetic',subtotal:100,addOns:0,total:100,currency:'USD',quoteVersion:'v1'},authorization:null,verifiedPaymentConfirmed:true,allOperationalRequirementsPassed:true};assert.equal(evaluateComplimentarySchedulingRequirement(params).paymentRequirementSatisfied,false);
 const authorization=createComplimentaryAuthorization({quote:params.quote,reasonCode:'founder_authorized',reasonDetail:'Synthetic authorized courtesy for regression only',authorizedByUserId:'synthetic-founder',authorizedByRole:'founder_admin'});assert.equal(evaluateComplimentarySchedulingRequirement({...params,authorization}).paymentRequirementSatisfied,false);
 assert.equal(evaluateComplimentarySchedulingRequirement({...params,verifiedPayment:{id:'synthetic',payment_confirmed:true,payment_status:'paid',payment_settlement_status:'cleared',amount_due:100,amount_paid:100}}).paymentRequirementSatisfied,true);
});
