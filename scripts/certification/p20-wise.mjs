#!/usr/bin/env -S node --conditions=react-server --import ./scripts/certification/server-condition.mjs --import tsx
import {reconcileLoadedDeal} from '../../lib/wise/reconciliation.ts';
import {randomUUID,webcrypto} from 'node:crypto';
import {certificationRun,isolatedCanonicalDatabase,wiseFixtures} from './shared.mjs';
import {verifyWiseSignature,verifyWiseSignatureWithKey} from '../../lib/wise.ts';
import {evaluateSchedulingGate,evaluateExecutionGate} from '../../lib/scheduling/complimentarySchedulingGate.ts';
const run=certificationRun('P20'),{report,check,assert}=run;let db;
try{
 run.guard();db=await isolatedCanonicalDatabase(run.files);const f=await wiseFixtures(db);
 const blocked=async id=>{const row=f.js(await f.load(id));assert.equal(evaluateSchedulingGate({matter:row}).schedulingEligible,false);assert.equal(evaluateExecutionGate(row).schedulingEligible,false);await assert.rejects(()=>f.schedule(id),/PAYMENT_REQUIRED|verified Wise settlement|INVALID.*TRANSITION/i);assert.equal((await f.load(id)).payment_confirmed,false);};
 const fresh=async()=>{const id=await f.create(),attempt=await f.begin(id);return {id,attempt,resource:randomUUID()};};
 const key=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},false,['sign','verify']);
 const otherKey=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},false,['sign','verify']);
 const raw=JSON.stringify({event:'SIMULATED_WISE_SIGNATURE_FIXTURE',id:randomUUID()}),signature=Buffer.from(await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',key.privateKey,new TextEncoder().encode(raw))).toString('base64');
 report.signature_result={};
 for(const [id,body,sig,pub,expected] of [['valid',raw,signature,key.publicKey,true],['malformed',raw,'!invalid-base64!',key.publicKey,false],['wrong_body',raw+' ',signature,key.publicKey,false],['wrong_key',raw,signature,otherKey.publicKey,false],['missing',raw,null,key.publicKey,false]])await check('SIGNATURE_'+id.toUpperCase(),id+' real RSA verification',async()=>{const actual=await verifyWiseSignatureWithKey(body,sig,pub);assert.equal(actual,expected);report.signature_result[id]=actual;});
 await check('PRODUCTION_TRUST','test key cannot replace the fixed production Wise trust',async()=>assert.equal(await verifyWiseSignature(raw,signature),false));
 const submitted=await fresh();
 await check('CASE_01','submission is processing, never verified/scheduling/execution authority',async()=>{await blocked(submitted.id);assert.equal((await f.load(submitted.id)).payment_settlement_status,'observed_pending');});
 await check('CASE_02','provider processing remains denied',async()=>{await f.observe(submitted.id,submitted.attempt,submitted.resource);await blocked(submitted.id);});
 const partial=await fresh();
 await check('CASE_03','partial payment cannot verify or schedule',async()=>{await db.query('update deals set amount_paid=50 where id=$1',[partial.id]);await blocked(partial.id);});
 await check('CASE_04','underpayment rejected atomically',async()=>{await assert.rejects(()=>f.confirm(submitted.id,submitted.resource,{amount:99}),/amount_mismatch/);await blocked(submitted.id);});
 await check('CASE_05','overpayment requires review, never silently verifies',async()=>{await assert.rejects(()=>f.confirm(submitted.id,submitted.resource,{amount:101}),/amount_mismatch/);await blocked(submitted.id);});
 await check('CASE_06','wrong currency rejected',async()=>{await assert.rejects(()=>f.confirm(submitted.id,submitted.resource,{currency:'EUR'}),/currency_mismatch/);await blocked(submitted.id);});
 await check('CASE_07','wrong Matter reference rejected',async()=>{await assert.rejects(()=>f.confirm(submitted.id,submitted.resource,{reference:'FOREIGN-MATTER'}),/reference_mismatch/);await blocked(submitted.id);});
 await check('CASE_08','wrong provider resource cannot verify',async()=>{await assert.rejects(()=>f.confirm(submitted.id,randomUUID()),/provider.*required|provider.*mismatch|settlement_required/);await blocked(submitted.id);});
 const stale=await fresh();const oldTime=new Date().toISOString(),oldEvent=randomUUID();await f.observe(stale.id,stale.attempt,stale.resource,'IN_PROGRESS',{time:oldTime,event_id:oldEvent});await f.observe(stale.id,stale.attempt,stale.resource,'FAILED');const replacement=await f.begin(stale.id);assert.notEqual(replacement,stale.attempt);
 await check('CASE_09','replacement attempt rejects older evidence',async()=>{const before=await f.ledgerCount(stale.id);await assert.rejects(()=>f.observe(stale.id,stale.attempt,stale.resource),/CURRENT_ATTEMPT/);assert.equal((await f.load(stale.id)).payment_attempt_id,replacement);assert.equal(await f.ledgerCount(stale.id),before);await blocked(stale.id);});
 for(const [id,status] of [['CASE_10','CANCELLED'],['CASE_11','FAILED']])await check(id,status+' attempt cannot verify or schedule',async()=>{const row=await fresh();await f.observe(row.id,row.attempt,row.resource,status);await assert.rejects(()=>f.confirm(row.id,row.resource),/invalidated|settlement_required/);await blocked(row.id);});
 await check('CASE_12','duplicate signed webhook has one canonical settlement effect',async()=>{
  const item=await fresh(),event={matter_id:item.id,attempt_id:item.attempt,resource_id:item.resource,status:'SETTLED',amount:100,currency:'USD',reference:(await f.load(item.id)).wise_reference,time:new Date().toISOString(),event_id:randomUUID()};
  const body=JSON.stringify(event),sig=Buffer.from(await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',key.privateKey,new TextEncoder().encode(body))).toString('base64');
  const deliver=async()=>{assert.equal(await verifyWiseSignatureWithKey(body,sig,key.publicKey),true);const e=JSON.parse(body);await f.observe(e.matter_id,e.attempt_id,e.resource_id,e.status,{amount:e.amount,currency:e.currency,reference:e.reference,time:e.time,event_id:e.event_id,source:'wise-webhook'});await f.confirm(e.matter_id,e.resource_id);};
  await deliver();const count=await f.ledgerCount(item.id),timeline=Number((await db.query('select count(*) n from matter_state_events where matter_id=$1',[item.id])).rows[0].n);await deliver();report.duplicate_effect_count=(await f.ledgerCount(item.id))-count;assert.equal(report.duplicate_effect_count,0);assert.equal(Number((await db.query('select count(*) n from matter_state_events where matter_id=$1',[item.id])).rows[0].n),timeline);assert.equal(Number((await db.query("select count(*) n from matter_evidence_ledger where matter_id=$1 and event_type='WISE_ATTEMPT_SETTLEMENT_CONFIRMED'",[item.id])).rows[0].n),1);
 });
 await check('CASE_13','old webhook replay cannot affect replacement attempt',async()=>{const before=await f.ledgerCount(stale.id);await assert.rejects(()=>f.observe(stale.id,stale.attempt,stale.resource,'IN_PROGRESS',{time:oldTime,event_id:oldEvent}),/CURRENT_ATTEMPT/);assert.equal(await f.ledgerCount(stale.id),before);await blocked(stale.id);});
 const exact=await fresh();
 await check('CASE_14','exact canonical settlement verifies once',async()=>{await f.observe(exact.id,exact.attempt,exact.resource,'SETTLED');await f.confirm(exact.id,exact.resource);const row=await f.load(exact.id);assert.equal(row.payment_confirmed,true);assert.equal(row.payment_status,'paid');assert.equal(row.payment_settlement_status,'cleared');assert.equal(Number(row.amount_paid),100);});
 await check('CASE_15','exact settlement retry is idempotent',async()=>{const count=await f.ledgerCount(exact.id),before=await f.load(exact.id);await f.confirm(exact.id,exact.resource);assert.equal(await f.ledgerCount(exact.id),count);assert.equal((await f.load(exact.id)).payment_confirmed_at.getTime(),before.payment_confirmed_at.getTime());});
 await check('CASE_16','database and TypeScript allow scheduling only after verification',async()=>{const row=f.js(await f.load(exact.id));assert.equal(evaluateSchedulingGate({matter:row}).schedulingEligible,true);assert.equal(evaluateExecutionGate(row).schedulingEligible,true);await f.schedule(exact.id);await f.schedule(exact.id);assert.equal(Number((await db.query("select count(*) n from matter_state_events where matter_id=$1 and new_state='scheduled'",[exact.id])).rows[0].n),1);});
 await check('CASE_17','scheduling cannot manufacture payment truth or accept client flags',async()=>{
  const item=await fresh(),row=f.js(await f.load(item.id));assert.equal(evaluateSchedulingGate({matter:{...row,payment_confirmed:true,payment_status:'paid',amount_paid:100}}).schedulingEligible,false);
  await db.exec(`set request.jwt.claims='${JSON.stringify({sub:f.actor,email:'certification-client@example.invalid',role:'authenticated'})}';set role authenticated;`);
  try{await db.query("update deals set status='scheduled',deal_status='scheduled',payment_confirmed=true,payment_status='paid',payment_settlement_status='cleared',amount_paid=100 where id=$1",[item.id]);}catch(error){assert.match(String(error.message),/permission denied|row-level security|not allowed|PAYMENT|AUTHOR|privilege/i);}finally{await db.exec('reset role');}
  assert.equal((await f.load(item.id)).payment_confirmed,false);assert.equal((await f.load(item.id)).status,'awaiting_payment');await blocked(item.id);
 });
 await check('RECONCILIATION','canonical raw statement matching and database confirmation',async()=>{
  const item=await fresh();let amount=99;
  const admin={rpc:async(name,args)=>{
   assert.ok(['record_wise_attempt_evidence','confirm_wise_payment_for_deal'].includes(name));
   const keys=Object.keys(args);assert.ok(keys.every(k=>/^p_[a-z_]+$/.test(k)));
   try{return {data:(await db.query(`select public.${name}(${keys.map((k,i)=>`${k} => $${i+1}`).join(',')}) result`,Object.values(args))).rows[0].result,error:null};}catch(error){return {data:null,error:{code:error.code,message:error.message}};}
  }};
  const io={admin,getStandardBalance:async()=>({id:'simulation-balance'}),getBalanceStatement:async()=>({transactions:[{type:'CREDIT',date:new Date().toISOString(),amount:{value:amount,currency:'USD'},referenceNumber:item.resource,details:{reference:(await f.load(item.id)).wise_reference}}]})};
  const rejected=await reconcileLoadedDeal(await f.load(item.id),[],io);assert.equal(rejected.settlementConfirmed,false);await blocked(item.id);
  amount=100;const accepted=await reconcileLoadedDeal(await f.load(item.id),[],io);assert.equal(accepted.settlementConfirmed,true);assert.equal((await f.load(item.id)).payment_confirmed,true);
 });
 const final=f.js(await f.load(exact.id));Object.assign(report,{matter_id:exact.id,payment_attempt_id:exact.attempt,expected_amount:100,received_amount:final.amount_paid,expected_currency:'USD',received_currency:final.currency,wise_reference:final.wise_reference,provider_reference:exact.resource,submission_state:'SIMULATED_SUBMISSION_RECORDED',settlement_state:final.payment_settlement_status,payment_verified:final.payment_confirmed,scheduling_authorized:evaluateSchedulingGate({matter:final}).schedulingEligible,execution_authorized:evaluateExecutionGate(final).schedulingEligible});
 for(let n=1;n<=17;n++)assert.ok(report.checks.some(c=>c.id==='CASE_'+String(n).padStart(2,'0')&&c.status==='PASS'));
 report.status='PASS';
}catch(error){report.status='FAIL';if(!report.failures.length)report.failures.push({id:'HARNESS',message:String(error.message).slice(0,240)});process.exitCode=1;console.error('P20 failed: '+report.failures.at(-1).message);}finally{await db?.close();run.save();console.log(`P20 ${report.status}: ${report.checks.filter(c=>c.status==='PASS').length} checks; SIMULATION evidence, live_certification=false.`);}
