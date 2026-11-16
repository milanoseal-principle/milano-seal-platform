// Server-side loader for Autonomous Matter Resolution. Callers must have already
// authorized access to this Matter (client ownership or operator role). Reads only;
// writes happen in the portal clarification route.

import type { SupabaseClient } from "@supabase/supabase-js";
import { clientExecutionRequestFromNotes } from "@/lib/intake/requestedVsConfirmed";
import { isQuoteMutationLocked } from "@/lib/pricing/quoteMutationLock";
import {
  CLIENT_DECLARATION_SOURCE,
  declarationsFromLedger,
  resolveMatter,
  type ClientDeclarations,
  type MatterResolution,
} from "@/lib/matter/matterResolution";

export const RESOLUTION_MATTER_SELECT =
  "id,origin_state,execution_truth,customer_execution_preference,mobile,notes,quote_approved_at,payment_status,amount_paid,payment_observed_at";

export type ResolutionMatterRow = {
  id: string;
  origin_state?: string | null;
  execution_truth?: Record<string, unknown> | null;
  customer_execution_preference?: string | null;
  mobile?: boolean | null;
  notes?: string | null;
  quote_approved_at?: string | null;
  payment_status?: string | null;
  amount_paid?: number | null;
  payment_observed_at?: string | null;
};

export async function loadMatterResolution(
  db: SupabaseClient,
  matter: ResolutionMatterRow,
): Promise<{ resolution: MatterResolution; declarations: ClientDeclarations }> {
  const [declared, route] = await Promise.all([
    db.from("matter_evidence_ledger").select("occurred_at, new_value")
      .eq("matter_id", matter.id).eq("domain", "execution").eq("source", CLIENT_DECLARATION_SOURCE)
      .order("occurred_at", { ascending: true }).limit(50),
    db.from("matter_evidence_ledger").select("new_value")
      .eq("matter_id", matter.id).eq("domain", "pricing").eq("source", "operator_quote_builder")
      .order("occurred_at", { ascending: false }).limit(1),
  ]);
  if (declared.error || route.error) throw Error("MATTER_RESOLUTION_UNAVAILABLE");
  const declarations = declarationsFromLedger(declared.data);
  const routeFacts = ((route.data?.[0]?.new_value ?? {}) as Record<string, unknown>).route_intelligence as Record<string, unknown> | undefined;
  const issuingAuthority = typeof routeFacts?.issuing_authority === "string" ? routeFacts.issuing_authority : "";
  const intake = clientExecutionRequestFromNotes(matter.notes);
  const resolution = resolveMatter({
    originState: matter.origin_state,
    executionTruth: matter.execution_truth,
    intakeExecutionPreference: intake?.executionPreference ?? matter.customer_execution_preference,
    intakeMobile: matter.mobile,
    issuingAuthorityRecorded: Boolean(issuingAuthority) && issuingAuthority !== "unknown",
    quoteApproved: Boolean(matter.quote_approved_at),
    paymentActivity: isQuoteMutationLocked(matter as Record<string, unknown>),
    declarations,
  });
  return { resolution, declarations };
}
