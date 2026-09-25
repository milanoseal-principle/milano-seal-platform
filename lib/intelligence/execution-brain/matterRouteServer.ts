// Route intelligence for a Matter, recomputed from canonical facts plus the
// operator-confirmed route facts recorded with the latest governed quote.
// Shared by the authority packet and the unified execution intelligence.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  projectQuoteRouteIntelligence,
  type QuoteRouteIntelligence,
} from "@/lib/pricing/destinationDocumentQuoteIntelligence";

export async function loadMatterRoute(
  db: SupabaseClient,
  matter: {
    id: string;
    destination_country?: string | null;
    origin_state?: string | null;
    document_type?: string | null;
  },
  receivingAuthority: string | null,
): Promise<QuoteRouteIntelligence> {
  const { data } = await db
    .from("matter_evidence_ledger")
    .select("new_value, occurred_at")
    .eq("matter_id", matter.id)
    .eq("domain", "pricing")
    .order("occurred_at", { ascending: false })
    .limit(1);
  const prior = ((data?.[0]?.new_value ?? {}) as Record<string, unknown>).route_intelligence as Record<string, unknown> | undefined;
  return projectQuoteRouteIntelligence({
    destination_country: matter.destination_country,
    origin_state: matter.origin_state,
    document_type: matter.document_type,
    document_category: prior?.document_category_source === "operator" ? prior.document_category : undefined,
    issuing_authority: prior?.issuing_authority,
    issuing_agency: prior?.federal_agency,
    receiving_authority: receivingAuthority ?? prior?.receiving_authority,
  });
}
