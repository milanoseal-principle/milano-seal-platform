// Server loader for the unified Matter execution intelligence. Reads only
// canonical records and recomputes every section; nothing is persisted.

import { createAdminClient } from "@/lib/supabase/admin";
import type { QuoteRouteIntelligence } from "@/lib/pricing/destinationDocumentQuoteIntelligence";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { activeMatterExceptions, type CustodyEvidenceRow } from "./authorityPacket";
import { loadLogisticsContext } from "./authorityLogisticsServer";
import { evaluateProcessingAdvisory, type ProcessingObservation } from "./processingAdvisory";
import { documentPreflightPosture, evaluateRonProviderCapability, readRonAuthorityPosture } from "./ronProviderCapabilities";
import { loadMatterRoute } from "./matterRouteServer";
import {
  STATE_AUTHORITY_FIELDS,
  evaluateStateAuthority,
  type StateAuthorityEvaluation,
  type StateAuthorityRecord,
} from "./stateAuthorityProvenance";
import { buildMatterExecutionBrief, composeMatterExecutionIntelligence, type MatterExecutionIntelligence } from "./executionBrain";

const MATTER_FIELDS =
  "id, deal_id, client_name, email, phone, status, deal_status, document_type, destination_country, origin_state, execution_truth, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_observed_amount, payment_observed_currency, payment_observed_reference, currency, wise_reference, amount_due, amount_paid, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue";

export async function loadMatterExecutionIntelligence(
  matterRef: string,
  now: Date = new Date(),
): Promise<{
  intelligence: MatterExecutionIntelligence;
  brief: string;
  route: QuoteRouteIntelligence;
  authority: { record: StateAuthorityRecord; evaluation: StateAuthorityEvaluation } | null;
} | null> {
  const logistics = await loadLogisticsContext(matterRef);
  if (!logistics) return null;
  const supabase = createAdminClient();
  const matterId = logistics.matter.id;

  const [{ data: matter }, { data: files }, { data: sessions }, { data: custody }] = await Promise.all([
    supabase.from("deals").select(MATTER_FIELDS).eq("id", matterId).single(),
    supabase
      .from("files")
      .select("id, name, filename, mime_type, file_type, structural_status, structural_review_reason")
      .eq("deal_id", matterId)
      .eq("is_internal", false),
    supabase
      .from("ron_sessions")
      .select("id, bn_session_id, milano_ron_status, identity_status, kba_status, biometric_status, created_at")
      .eq("matter_id", matterId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("custody_ledger").select("event, created_at").eq("deal_id", matterId),
  ]);
  if (!matter) return null;

  const truth = (matter.execution_truth ?? {}) as Record<string, unknown>;
  const posture = readRonAuthorityPosture(truth);
  const preflight = documentPreflightPosture(files ?? []);
  const route = await loadMatterRoute(supabase, matter, posture.receivingAuthority);

  const notarialAct = typeof truth.notarial_act === "string" && !["review_required", "unknown"].includes(truth.notarial_act) ? truth.notarial_act : null;
  const ronCapability =
    truth.execution_method === "ron"
      ? evaluateRonProviderCapability(
          {
            matterId,
            provider: "bluenotary",
            providerSession: sessions?.[0] ?? null,
            signerLocation: String(truth.signer_location ?? matter.origin_state ?? "").trim() || null,
            documentType: matter.document_type ?? null,
            notarialAct,
            posture,
            documentPreflight: preflight,
            schedulingAuthorized: evaluateSchedulingGate({ matter }).schedulingEligible,
          },
          now,
        )
      : null;

  const packet = logistics.packet;
  let authorityName: string | null = null;
  let authorityEvaluation: StateAuthorityEvaluation | null = null;
  let authorityRecord: StateAuthorityRecord | null = null;
  let advisory = null;
  if (packet?.authorityId) {
    const [{ data: authority }, { data: observations }, { count }] = await Promise.all([
      supabase.from("state_authorities").select(STATE_AUTHORITY_FIELDS).eq("id", packet.authorityId).maybeSingle(),
      supabase
        .from("authority_processing_observations")
        .select("id, authority_id, service_type, source_url, source_title, source_date, observed_processing_date, estimated_days, observation_method, confidence, observed_at, expires_at, operator_override, override_reason, verified_by")
        .eq("authority_id", packet.authorityId)
        .order("observed_at", { ascending: false })
        .limit(50),
      supabase.from("authority_review_required").select("id", { count: "exact", head: true }).eq("authority_id", packet.authorityId).eq("review_status", "PENDING"),
    ]);
    if (authority) {
      const record = authority as unknown as StateAuthorityRecord;
      authorityRecord = record;
      authorityName = record.authority_name;
      authorityEvaluation = evaluateStateAuthority(record, now);
    }
    advisory = evaluateProcessingAdvisory((observations ?? []) as ProcessingObservation[], {
      serviceType: packet.routeType === "florida_dos_notarial_certificate" ? "notarial_certificate" : "apostille",
      pendingSourceReviews: count ?? 0,
      now,
    });
  }

  const intelligence = composeMatterExecutionIntelligence({
    matterId,
    documentType: matter.document_type ?? null,
    destinationCountry: matter.destination_country ?? null,
    originState: matter.origin_state ?? null,
    executionTruth: truth,
    documentPreflight: preflight,
    ronCapability,
    ronPosture: posture,
    route,
    authorityName,
    authorityEvaluation,
    packet,
    advisory,
    legs: logistics.legs,
    activeExceptions: activeMatterExceptions(matter.status ?? matter.deal_status ?? null, (custody ?? []) as CustodyEvidenceRow[]),
    now,
  });
  const brief = buildMatterExecutionBrief(intelligence, {
    documentType: matter.document_type ?? null,
    originState: matter.origin_state ?? null,
    destinationCountry: matter.destination_country ?? null,
    documentOrigin: route.documentCategorySource === "operator" ? route.documentCategory : null,
  });
  return {
    intelligence,
    brief,
    route,
    authority: authorityRecord && authorityEvaluation ? { record: authorityRecord, evaluation: authorityEvaluation } : null,
  };
}
