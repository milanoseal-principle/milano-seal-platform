import { readAllKeyset } from '@/lib/data/keyset';
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";

export const CUSTODY_EVENTS = {
  DOC_CREATED: "DOC_CREATED",
  DOC_RECEIVED: "DOC_RECEIVED",
  DOC_IN_POSSESSION: "DOC_IN_POSSESSION",
  DOC_HANDOFF: "DOC_HANDOFF",
  DOC_NOTARIZED: "DOC_NOTARIZED",
  DOC_APOSTILLE_SUBMITTED: "DOC_APOSTILLE_SUBMITTED",
  DOC_APOSTILLE_RECEIVED: "DOC_APOSTILLE_RECEIVED",
  DOC_LABEL_CREATED: "DOC_LABEL_CREATED",
  DOC_SHIPPED: "DOC_SHIPPED",
  DOC_IN_TRANSIT: "DOC_IN_TRANSIT",
  DOC_OUT_FOR_DELIVERY: "DOC_OUT_FOR_DELIVERY",
  DOC_DELIVERED: "DOC_DELIVERED",
  DOC_SIGNED: "DOC_SIGNED",
  DOC_RELEASE_CONFIRMED: "DOC_RELEASE_CONFIRMED",
  // Courier
  COURIER_EXCEPTION: "COURIER_EXCEPTION",
  COURIER_RETURNED: "COURIER_RETURNED",
  COURIER_UPDATE_RECEIVED: "COURIER_UPDATE_RECEIVED",
  RELEASE_GATE_OVERRIDE: "RELEASE_GATE_OVERRIDE",
  // Protected identifier lock
  PROTECTED_IDENTIFIER_CAPTURED: "PROTECTED_IDENTIFIER_CAPTURED",
  PROTECTED_IDENTIFIER_VERIFIED: "PROTECTED_IDENTIFIER_VERIFIED",
  PROTECTED_IDENTIFIER_LOCKED: "PROTECTED_IDENTIFIER_LOCKED",
  PROTECTED_IDENTIFIER_MISMATCH: "PROTECTED_IDENTIFIER_MISMATCH",
  PROTECTED_IDENTIFIER_RELEASE_HOLD: "PROTECTED_IDENTIFIER_RELEASE_HOLD",
  // QA gates
  ITALY_QA_STARTED: "ITALY_QA_STARTED",
  ITALY_QA_PASSED: "ITALY_QA_PASSED",
  ITALY_QA_FAILED: "ITALY_QA_FAILED",
  RELEASE_QA_STARTED: "RELEASE_QA_STARTED",
  RELEASE_QA_PASSED: "RELEASE_QA_PASSED",
  RELEASE_QA_FAILED: "RELEASE_QA_FAILED",
  // Release authorization
  RELEASE_AUTHORIZATION_STARTED: "RELEASE_AUTHORIZATION_STARTED",
  RELEASE_AUTHORIZATION_PASSED: "RELEASE_AUTHORIZATION_PASSED",
  RELEASE_AUTHORIZATION_FAILED: "RELEASE_AUTHORIZATION_FAILED",
  DOCUMENT_PACKAGE_RELEASED: "DOCUMENT_PACKAGE_RELEASED",
  PAID_AND_RELEASED: "PAID_AND_RELEASED",
  MATTER_CLOSED: "MATTER_CLOSED",
  // Post-release correction
  POST_RELEASE_ERROR_DISCOVERED: "POST_RELEASE_ERROR_DISCOVERED",
  CORRECTION_REVIEW_STARTED: "CORRECTION_REVIEW_STARTED",
  CORRECTION_PACKET_PREPARED: "CORRECTION_PACKET_PREPARED",
  CORRECTION_PACKET_SENT: "CORRECTION_PACKET_SENT",
  CLIENT_CONFIRMED_USABLE: "CLIENT_CONFIRMED_USABLE",
  // Payment rail
  PAYMENT_LINK_SENT: "PAYMENT_LINK_SENT",
  WISE_PAYMENT_RECEIVED: "WISE_PAYMENT_RECEIVED",
  WISE_PAYMENT_CONFIRMED: "WISE_PAYMENT_CONFIRMED",
  PAYMENT_RECONCILED: "PAYMENT_RECONCILED",
  PAYMENT_DETAIL_ERROR_DETECTED: "PAYMENT_DETAIL_ERROR_DETECTED",
  PAYMENT_RETURNED: "PAYMENT_RETURNED",
  PAYMENT_UNMATCHED: "PAYMENT_UNMATCHED",
} as const;

export type CustodyEvent = (typeof CUSTODY_EVENTS)[keyof typeof CUSTODY_EVENTS];

export type ActorType =
  | "system"
  | "operator"
  | "courier"
  | "client"
  | "notary"
  | "state"
  | "recipient";

export interface AppendInput {
  deal_id: string;
  event: CustodyEvent | string;
  actor_type: ActorType;
  actor_id?: string | null;
  location?: string | null;
  method?: string | null;
  status?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  idempotency_key?: string;
}

export interface LedgerRow {
  id: string;
  deal_id: string;
  event: string;
  actor_type: ActorType;
  actor_id: string | null;
  location: string | null;
  method: string | null;
  status: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  prev_hash: string | null;
  hash: string;
  created_at: string;
  payload_canonical?: string | null;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function canonicalize(payload: Record<string, unknown>): string {
  const sortedKeys = Object.keys(payload).sort();
  const sorted: Record<string, unknown> = {};
  for (const k of sortedKeys) sorted[k] = payload[k];
  return JSON.stringify(sorted);
}

export async function appendLedger(
  input: AppendInput,
): Promise<{ hash: string; prev_hash: string } | null> {
  const supabase = createAdminClient();

  const {data,error}=await supabase.rpc('append_custody_event',{p_input:{deal_id:input.deal_id,event:input.event,actor_type:input.actor_type,actor_id:input.actor_id??null,location:input.location??null,method:input.method??null,status:input.status??null,notes:input.notes??null,metadata:input.metadata??{}},p_idempotency_key:input.idempotency_key??null});
  if(!error&&data?.hash)return {hash:data.hash,prev_hash:data.prev_hash};
  const prev_hash='NOT_COMMITTED',hash='NOT_COMMITTED';
  const lastErrorMessage=error?.message??'APPEND_OUTCOME_UNKNOWN';

  // A custody-ledger write must never fail silently in production. The chain-of-
  // custody record is safety-critical (release gates, payment confirmation, QA).
  // Kept non-throwing so callers/flows are not broken, but the failure is surfaced
  // loudly AND the event is durably captured in activity_logs as a fallback so it
  // is never lost (covers schema drift — migration 040 — and exhausted fork retries).
  console.error(
    `[custody][CRITICAL] ledger write failed for deal=${input.deal_id} event=${input.event} after retries: ${lastErrorMessage}`,
  );
  await logActivity({
    deal_id: input.deal_id,
    actor: input.actor_id ?? "system",
    action: "system",
    detail: `CUSTODY_LEDGER_WRITE_FAILED: ${input.event}`,
    meta: {
      custody_event: input.event,
      actor_type: input.actor_type,
      prev_hash,
      attempted_hash: hash,
      error: lastErrorMessage,
    },
  });
  return null;
}

export async function getLedger(deal_id: string): Promise<LedgerRow[]> {
  const supabase = createAdminClient();
  const rows=await readAllKeyset<LedgerRow>(async cursor=>{
    let query=supabase.from('custody_ledger').select('*').eq('deal_id',deal_id).order('id').limit(250);
    if(cursor)query=query.gt('id',cursor.id);
    const result=await query;if(result.error)throw Error('CUSTODY_READ_UNAVAILABLE');return result.data as LedgerRow[]??[];
  },row=>row.id);
  // Database timestamp ties never define hash-chain order; parent references do.
  const byParent=new Map<string,LedgerRow>();
  for(const row of rows){const parent=row.prev_hash??'GENESIS';if(byParent.has(parent))throw Error('CUSTODY_CHAIN_FORK');byParent.set(parent,row);}
  const ordered:LedgerRow[]=[];let parent='GENESIS';
  while(byParent.has(parent)){const row=byParent.get(parent)!;byParent.delete(parent);ordered.push(row);parent=row.hash;}
  if(byParent.size)throw Error('CUSTODY_CHAIN_DISCONNECTED');return ordered;
}

export interface VerifyResult {
  valid: boolean;
  total: number;
  brokenAt?: number;
  reason?: string;
  assurance?: "CONTENT_AND_LINKS" | "LEGACY_LINKS_ONLY";
}

export function verifyChain(rows: LedgerRow[]): VerifyResult {
  if (rows.length === 0) return { valid: true, total: 0 };
  if (rows[0].prev_hash !== "GENESIS" && rows[0].prev_hash !== null) {
    return {
      valid: false,
      total: rows.length,
      brokenAt: 0,
      reason: "First row prev_hash is not GENESIS",
    };
  }
  for(const [i,row] of rows.entries())if(row.payload_canonical){
    let payload:Record<string,unknown>;try{payload=JSON.parse(row.payload_canonical);}catch{return {valid:false,total:rows.length,brokenAt:i,reason:'Invalid custody payload'};}
    if(sha256(row.payload_canonical)!==row.hash||['deal_id','event','actor_type','actor_id','location','method','status','notes','prev_hash','metadata'].some(k=>canonicalize({value:payload[k]})!==canonicalize({value:(row as unknown as Record<string,unknown>)[k]})))return {valid:false,total:rows.length,brokenAt:i,reason:'Custody content hash mismatch'};
  }
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].prev_hash !== rows[i - 1].hash) {
      return {
        valid: false,
        total: rows.length,
        brokenAt: i,
        reason: `Row ${i} prev_hash does not match previous row's hash`,
      };
    }
  }
  return { valid: true, total: rows.length, assurance:rows.every(row=>Boolean(row.payload_canonical))?"CONTENT_AND_LINKS":"LEGACY_LINKS_ONLY" };
}
