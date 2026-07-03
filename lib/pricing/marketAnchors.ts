// Internal market anchors for operator quoting. INTERNAL ONLY — never rendered
// on public pages. Ranges reflect Milano Seal pricing doctrine, not a public menu.

export interface MarketAnchor {
  min: number;
  max: number | null; // null = open-ended ("+")
  note?: string;
}

export const MARKET_ANCHORS: Record<string, MarketAnchor> = {
  route_review_only: { min: 95, max: 175 },
  apostille_first_document: { min: 275, max: 495 },
  apostille_additional_document: { min: 125, max: 225 },
  fbi_apostille_result_ready: { min: 295, max: 495 },
  fbi_apostille_fingerprint_route: { min: 495, max: 750 },
  fbi_apostille_immigration_bundle: { min: 750, max: null, note: "bundled with immigration/citizenship" },
  education_credential_apostille: { min: 395, max: 750 },
  civil_records_bundle: { min: 495, max: null, note: "1250+ for large bundles" },
  regulated_professional_packet: { min: 495, max: null, note: "1500+ for complex packets" },
  loan_signing_standard: { min: 175, max: 350 },
  loan_signing_complex: { min: 350, max: 650, note: "rush / scan-back / multi-signer" },
  loan_signing_international: { min: 750, max: null, note: "international POA / apostille / courier" },
};

export function getMarketAnchor(key: string): MarketAnchor | null {
  return MARKET_ANCHORS[key] ?? null;
}

export function formatAnchorInternal(anchor: MarketAnchor): string {
  return anchor.max === null ? `${anchor.min}+` : `${anchor.min}–${anchor.max}`;
}
