import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const { data: last } = await supabase
    .from("custody_ledger")
    .select("hash")
    .eq("deal_id", input.deal_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prev_hash = last?.hash || "GENESIS";

  const ts = new Date().toISOString();
  const payload = canonicalize({
    deal_id: input.deal_id,
    event: input.event,
    actor_type: input.actor_type,
    actor_id: input.actor_id ?? null,
    location: input.location ?? null,
    method: input.method ?? null,
    status: input.status ?? null,
    notes: input.notes ?? null,
    metadata: input.metadata ?? {},
    prev_hash,
    ts,
  });
  const hash = sha256(payload);

  const { error } = await supabase.from("custody_ledger").insert({
    deal_id: input.deal_id,
    event: input.event,
    actor_type: input.actor_type,
    actor_id: input.actor_id ?? null,
    location: input.location ?? null,
    method: input.method ?? null,
    status: input.status ?? null,
    notes: input.notes ?? null,
    metadata: input.metadata ?? {},
    prev_hash,
    hash,
  });

  if (error) {
    console.error("[custody] append failed:", error.message);
    return null;
  }

  return { hash, prev_hash };
}

export async function getLedger(deal_id: string): Promise<LedgerRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("custody_ledger")
    .select("*")
    .eq("deal_id", deal_id)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[custody] read failed:", error.message);
    return [];
  }
  return (data ?? []) as LedgerRow[];
}

export interface VerifyResult {
  valid: boolean;
  total: number;
  brokenAt?: number;
  reason?: string;
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
  return { valid: true, total: rows.length };
}
