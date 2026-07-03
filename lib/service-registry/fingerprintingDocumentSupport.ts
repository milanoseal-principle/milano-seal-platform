export interface FingerprintingSupportEntry {
  id: string;
  label: string;
  publicSummary: string;
  requiresAgencyInstruction: boolean;
  requiresManualReview: boolean;
}

export const fingerprintingDocumentSupportRegistry: FingerprintingSupportEntry[] = [
  {
    id: "identity-history-routing",
    label: "FBI Identity History Summary Routing",
    publicSummary:
      "Coordination for personal and foreign-use FBI Identity History Summary requests.",
    requiresAgencyInstruction: false,
    requiresManualReview: false,
  },
  {
    id: "employment-licensing-routing",
    label: "Employment / Licensing Fingerprint Routing",
    publicSummary:
      "Routing support for employment and licensing fingerprint submissions with agency instructions.",
    requiresAgencyInstruction: true,
    requiresManualReview: true,
  },
  {
    id: "fingerprint-card-support",
    label: "Fingerprint Card Support",
    publicSummary:
      "Support for hard-card and out-of-state fingerprint card preparation and routing.",
    requiresAgencyInstruction: true,
    requiresManualReview: true,
  },
];

export function getFingerprintingSupport(
  id: string
): FingerprintingSupportEntry | undefined {
  return fingerprintingDocumentSupportRegistry.find((entry) => entry.id === id);
}
