import {evaluatePaymentGate} from '@/lib/safety/payment-integrity';
import type {MilanoMatterLike,PaymentType} from '@/src/features/milano/types';
export interface PaymentGateResult {scheduling_unlocked:boolean;release_unlocked:boolean;next_required_payment:PaymentType|null;reason:string;}
/** Legacy operational projections cannot infer settlement from received totals or release flags. */
export function evaluatePaymentGates(matter:MilanoMatterLike):PaymentGateResult {
 if(matter.payment_mismatch_flag||matter.payment_status==='mismatch_review')return {scheduling_unlocked:false,release_unlocked:false,next_required_payment:null,reason:'payment_mismatch_review'};
 const verified=evaluatePaymentGate({id:matter.id??'projection',payment_status:matter.payment_status,payment_confirmed:matter.payment_confirmed,payment_settlement_status:matter.payment_settlement_status,amount_due:matter.amount_due,amount_paid:matter.amount_paid})==='PAYMENT_CONFIRMED';
 const total=Number(matter.final_total),received=Number(matter.amount_received);
 const released=verified&&matter.balance_due!=null&&Number(matter.balance_due)===0&&Number.isFinite(total)&&total>0&&Number.isFinite(received)&&Math.round(received*100)===Math.round(total*100);
 return {scheduling_unlocked:verified,release_unlocked:released,next_required_payment:!verified?(matter.deposit_required?'deposit':'full_payment'):released?null:'final_balance',reason:released?'release_unlocked':verified?'scheduling_unlocked':'verified_wise_settlement_required'};
}
export function assertSchedulingAllowed(matter:MilanoMatterLike):void {if(!evaluatePaymentGates(matter).scheduling_unlocked)throw Error('Scheduling is blocked until verified Wise settlement.');}
export function assertReleaseAllowed(matter:MilanoMatterLike):void {if(!evaluatePaymentGates(matter).release_unlocked)throw Error('Release is blocked until verified final settlement and zero balance.');}
