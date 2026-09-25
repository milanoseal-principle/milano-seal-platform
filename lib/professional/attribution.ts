// Professional channel attribution derived from canonical Matter truth.
//
// This module never creates financial truth. Matter value and discount are
// read from the canonical Matter record; verified revenue is read only from the
// canonical `verified_revenue` field that governed Wise reconciliation writes.
// Quotes, invoices and analytics events are never counted as revenue.

import { COUNTRY_EXECUTION_INTELLIGENCE } from "@/data/country-execution-intelligence";
import { canonicalDestinationSlug } from "@/lib/alliance/professionalToolbelt";

export interface AttributionMatterRow {
  id: string;
  professional_profile_id?: string | null;
  referral_source_type?: string | null;
  destination_country?: string | null;
  document_type?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  final_total?: number | string | null;
  discount_amount?: number | string | null;
  verified_revenue?: number | string | null;
  quote_review_required?: boolean | null;
  deal_status?: string | null;
}

export interface ProfessionalAttributionSummary {
  professionalProfileId: string;
  mattersReferred: number;
  mattersCompleted: number;
  matterValue: number;
  discountTotal: number;
  verifiedRevenue: number;
  reviewRequiredCount: number;
  repeatReferral: boolean;
  firstMatterAt: string | null;
  lastMatterAt: string | null;
  lastCompletedAt: string | null;
  topDestinations: Array<{ destination: string; count: number }>;
  topDocumentTypes: Array<{ documentType: string; count: number }>;
  routeTypes: Record<string, number>;
  submissionModes: Record<string, number>;
}

const money = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

const top = (counts: Map<string, number>, limit = 5) =>
  [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);

function routeTypeFor(destination: string | null | undefined): string {
  const name = String(destination ?? "").trim();
  if (!name) return "unresolved";
  return COUNTRY_EXECUTION_INTELLIGENCE[canonicalDestinationSlug(name)]?.routeType ?? "unresolved";
}

export function summarizeProfessionalAttribution(
  rows: AttributionMatterRow[],
): ProfessionalAttributionSummary[] {
  const byProfile = new Map<string, AttributionMatterRow[]>();
  const seen = new Set<string>();
  for (const row of rows) {
    const profileId = row.professional_profile_id;
    if (!profileId || seen.has(row.id)) continue;
    seen.add(row.id);
    byProfile.set(profileId, [...(byProfile.get(profileId) ?? []), row]);
  }

  return [...byProfile.entries()].map(([professionalProfileId, matters]) => {
    const destinations = new Map<string, number>();
    const documents = new Map<string, number>();
    const routeTypes: Record<string, number> = {};
    const submissionModes: Record<string, number> = {};
    for (const matter of matters) {
      const destination = String(matter.destination_country ?? "").trim() || "Unresolved";
      const documentType = String(matter.document_type ?? "").trim() || "Unresolved";
      destinations.set(destination, (destinations.get(destination) ?? 0) + 1);
      documents.set(documentType, (documents.get(documentType) ?? 0) + 1);
      const route = routeTypeFor(matter.destination_country);
      routeTypes[route] = (routeTypes[route] ?? 0) + 1;
      const mode = matter.referral_source_type ?? "unknown";
      submissionModes[mode] = (submissionModes[mode] ?? 0) + 1;
    }
    const created = matters.map((m) => m.created_at).filter(Boolean).sort() as string[];
    const completed = matters.filter((m) => m.completed_at || m.deal_status === "completed");
    const completedAt = completed.map((m) => m.completed_at).filter(Boolean).sort() as string[];

    return {
      professionalProfileId,
      mattersReferred: matters.length,
      mattersCompleted: completed.length,
      matterValue: money(matters.reduce((sum, m) => sum + money(m.final_total), 0)),
      discountTotal: money(matters.reduce((sum, m) => sum + money(m.discount_amount), 0)),
      verifiedRevenue: money(matters.reduce((sum, m) => sum + money(m.verified_revenue), 0)),
      reviewRequiredCount: matters.filter((m) => m.quote_review_required === true).length,
      repeatReferral: matters.length > 1,
      firstMatterAt: created[0] ?? null,
      lastMatterAt: created[created.length - 1] ?? null,
      lastCompletedAt: completedAt[completedAt.length - 1] ?? null,
      topDestinations: top(destinations).map(([destination, count]) => ({ destination, count })),
      topDocumentTypes: top(documents).map(([documentType, count]) => ({ documentType, count })),
      routeTypes,
      submissionModes,
    };
  });
}
