/**
 * maritimeSafety — safety guards for the Maritime & Global Logistics vertical.
 * Coordination and administrative support only. No customs-clearance, shipment-
 * release, port, carrier, CBP, Coast Guard, or TSA authority is claimed; no
 * guaranteed deadlines; unknown values remain null (never inferred).
 */

export type MaritimeDataStatus =
  | "verified"
  | "submitted"
  | "pending_verification"
  | "incomplete"
  | "archived"
  | "sample";

export interface MaritimeRecordMeta {
  id: string;
  source: string;
  dataStatus: MaritimeDataStatus;
  isSample: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  notes?: string | null;
}

export const MARITIME_BANNED_CLAIMS: readonly string[] = [
  "customs clearance guaranteed",
  "guaranteed customs clearance",
  "guaranteed cargo release",
  "guaranteed shipment release",
  "guaranteed sailing",
  "port approved",
  "port-approved",
  "official port provider",
  "authorized port vendor",
  "secure-side access",
  "terminal access guaranteed",
  "cbp approved",
  "customs approved",
  "coast guard approved",
  "carrier approved",
  "tsa approved",
];

export function containsBannedMaritimeClaim(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return MARITIME_BANNED_CLAIMS.some((c) => t.includes(c));
}

/** A deadline is only ever a requested/operational target — never a guarantee. */
export function describeDeadline(kind: "requested" | "operational" | "third_party"): string {
  switch (kind) {
    case "requested": return "Requested deadline";
    case "operational": return "Operational target";
    case "third_party": return "Third-party dependent";
  }
}

export const MARITIME_SAFETY_NOTICE =
  "The Milano Seal coordinates time-sensitive document execution. Final document acceptance, cargo movement, customs clearance, vessel schedules, port decisions, and government processing remain controlled by the relevant third parties. No customs, port, carrier, CBP, Coast Guard, or TSA authorization is claimed. Not legal or import/export advice.";

/** Unknown/blank stays null — never guess ownership, cargo value, or status. */
export function nullIfBlank<T>(v: T | null | undefined): T | null {
  return v === undefined || v === "" ? null : (v ?? null);
}
