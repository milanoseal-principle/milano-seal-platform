import { createHash } from "crypto";

export interface CustodyHashInput {
  matter_id: string;
  released_at: string;        // ISO datetime
  document_count: number;
  destination_country: string | null;
  document_type: string | null;
}

export function generateCustodyHash(input: CustodyHashInput): string {
  const payload = [
    input.matter_id,
    input.released_at,
    String(input.document_count),
    input.destination_country ?? "unknown",
    input.document_type ?? "unknown",
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

export function generateVerificationId(matterId: string): string {
  const year = new Date().getFullYear();
  const shortId = matterId.replace(/-/g, "").substring(0, 8).toUpperCase();
  return `MS-${year}-${shortId}`;
}

export function generatePublicSummary(
  documentCount: number,
  destinationCountry: string | null,
  documentType: string | null,
): string {
  const doc = documentType
    ? documentType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Document";
  const dest = destinationCountry
    ? destinationCountry.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;
  const docLabel = documentCount === 1 ? doc : `${documentCount} documents`;
  return dest
    ? `${docLabel} — ${dest} — Coordination and custody release recorded by The Milano Seal™.`
    : `${docLabel} — Coordination and custody release recorded by The Milano Seal™.`;
}
