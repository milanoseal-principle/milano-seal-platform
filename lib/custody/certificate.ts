// Certificate of Digital Custody — data model only.
// PDF rendering is done client-side via CertificatePDF component.
// This file handles data assembly only — no PDF library dependency here.

export interface CertificateData {
  verification_id: string;
  custody_hash: string;
  document_count: number;
  destination_country: string | null;
  document_type: string | null;
  released_at: string;
  coordinator: string;
  verification_url: string;
  generated_at: string;
  disclaimer: string;
}

export function assembleCertificateData(
  verificationRecord: {
    verification_id: string;
    custody_ledger_hash: string;
    document_count: number;
    destination_country: string | null;
    document_type: string | null;
    released_at: string | null;
    generated_by: string | null;
  },
  baseUrl: string,
): CertificateData {
  return {
    verification_id: verificationRecord.verification_id,
    custody_hash: verificationRecord.custody_ledger_hash,
    document_count: verificationRecord.document_count,
    destination_country: verificationRecord.destination_country,
    document_type: verificationRecord.document_type,
    released_at: verificationRecord.released_at ?? new Date().toISOString(),
    coordinator: "The Milano Seal™",
    verification_url: `${baseUrl}/verify/${verificationRecord.verification_id}`,
    generated_at: new Date().toISOString(),
    disclaimer:
      "This certificate confirms that The Milano Seal recorded a custody and release event for this matter. International use remains subject to destination and receiving-authority requirements. This certificate does not constitute legal advice or guarantee acceptance by any receiving authority.",
  };
}

export function formatReleaseDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    });
  } catch {
    return isoDate;
  }
}
