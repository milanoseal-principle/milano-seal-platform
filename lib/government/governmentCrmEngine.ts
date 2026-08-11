import type { GovernmentCrmRecord, GovernmentPipelineStage } from "./types";

// Pure reducers over GovernmentCrmRecord[]. All divide-by-zero guarded.

export function countByStage(
  records: GovernmentCrmRecord[],
): Record<GovernmentPipelineStage, number> {
  const base: Record<GovernmentPipelineStage, number> = {
    prospect: 0,
    vendor_registered: 0,
    capability_statement_sent: 0,
    meeting_requested: 0,
    opportunity_identified: 0,
    bid_submitted: 0,
    shortlisted: 0,
    awarded: 0,
    renewal: 0,
    lost: 0,
  };
  for (const r of records) {
    base[r.status] = (base[r.status] ?? 0) + 1;
  }
  return base;
}

export function pipelineValue(records: GovernmentCrmRecord[]): number {
  return records
    .filter((r) => r.status !== "lost" && r.status !== "awarded")
    .reduce((sum, r) => sum + (Number.isFinite(r.opportunity_value) ? r.opportunity_value : 0), 0);
}

export function awardRate(records: GovernmentCrmRecord[]): number {
  const decided = records.filter(
    (r) => r.status === "awarded" || r.status === "lost",
  ).length;
  if (decided === 0) return 0;
  const awarded = records.filter((r) => r.status === "awarded").length;
  return awarded / decided;
}

export function renewalValue(records: GovernmentCrmRecord[]): number {
  return records
    .filter((r) => r.status === "renewal")
    .reduce((sum, r) => sum + (Number.isFinite(r.opportunity_value) ? r.opportunity_value : 0), 0);
}

export function contractValue(records: GovernmentCrmRecord[]): number {
  return records
    .filter((r) => r.status === "awarded")
    .reduce((sum, r) => sum + (Number.isFinite(r.opportunity_value) ? r.opportunity_value : 0), 0);
}

function daysBetween(a: string, b: string): number | null {
  const start = Date.parse(a);
  const end = Date.parse(b);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

// Average days from next_follow_up baseline... but the meaningful cycle is
// from first contact to award. We approximate using award_date vs next_follow_up
// where both are present. Guarded against divide-by-zero and bad dates.
export function averageProcurementCycleDays(
  records: GovernmentCrmRecord[],
): number {
  const spans: number[] = [];
  for (const r of records) {
    if (r.award_date && r.next_follow_up) {
      const d = daysBetween(r.next_follow_up, r.award_date);
      if (d !== null && d >= 0) spans.push(d);
    }
  }
  if (spans.length === 0) return 0;
  return spans.reduce((s, d) => s + d, 0) / spans.length;
}
