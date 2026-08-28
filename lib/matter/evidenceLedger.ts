import { createAdminClient } from "@/lib/supabase/admin";

export const MATTER_EVIDENCE_DOMAINS = [
  "pricing", "discount", "payment", "execution", "ron", "witness", "translation",
  "authority", "scheduling", "apostille_authentication", "custody", "courier",
  "delivery", "release", "completion", "reconciliation", "operator_override",
] as const;
export type MatterEvidenceDomain = (typeof MATTER_EVIDENCE_DOMAINS)[number];

export interface MatterEvidenceEvent {
  matterId: string;
  eventType: string;
  domain: MatterEvidenceDomain;
  actorType: "system" | "operator" | "provider" | "client" | "alliance" | "va";
  actorId?: string | null;
  occurredAt?: string;
  source: string;
  sourceReference?: string | null;
  evidenceReference?: string | null;
  priorValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  correlationId?: string | null;
  providerEventId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

const SENSITIVE_KEY = /(secret|password|token|authorization|credential|kba_answer|private_key|api_key)/i;

export function sanitizeEvidenceMetadata(metadata: MatterEvidenceEvent["metadata"] = {}) {
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEY.test(key)) continue;
    safe[key] = value;
  }
  return safe;
}

export async function appendMatterEvidence(event: MatterEvidenceEvent) {
  if (!event.matterId) throw new Error("Matter evidence requires matterId.");
  if (!event.eventType.trim()) throw new Error("Matter evidence requires eventType.");
  if (!event.source.trim()) throw new Error("Matter evidence requires source.");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("matter_evidence_ledger")
    .insert({
      matter_id: event.matterId,
      event_type: event.eventType,
      domain: event.domain,
      actor_type: event.actorType,
      actor_id: event.actorId ?? null,
      occurred_at: event.occurredAt ?? new Date().toISOString(),
      source: event.source,
      source_reference: event.sourceReference ?? null,
      evidence_reference: event.evidenceReference ?? null,
      prior_value: event.priorValue ?? null,
      new_value: event.newValue ?? null,
      reason: event.reason ?? null,
      correlation_id: event.correlationId ?? null,
      provider_event_id: event.providerEventId ?? null,
      metadata: sanitizeEvidenceMetadata(event.metadata),
    })
    .select("id,matter_id,event_type,domain,occurred_at,source,source_reference,evidence_reference,reason,correlation_id,provider_event_id,metadata,created_at")
    .single();

  if (error) {
    if (error.code === "23505" && event.providerEventId) {
      return { ok: true as const, duplicate: true as const, id: null };
    }
    throw new Error(`Matter evidence append failed (${error.code ?? "unknown"}).`);
  }
  return { ok: true as const, duplicate: false as const, id: data?.id ?? null };
}

export async function readMatterEvidence(matterId: string, limit = 250) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("matter_evidence_ledger")
    .select("id,matter_id,event_type,domain,actor_type,actor_id,occurred_at,source,source_reference,evidence_reference,prior_value,new_value,reason,correlation_id,provider_event_id,metadata,created_at")
    .eq("matter_id", matterId)
    .order("occurred_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));
  if (error) throw new Error(`Matter evidence read failed (${error.code ?? "unknown"}).`);
  return data ?? [];
}
