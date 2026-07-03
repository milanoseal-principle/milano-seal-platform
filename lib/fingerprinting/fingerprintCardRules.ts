export interface FingerprintCardRule {
  cardType: "hard_card_fd_258" | "fbi_fd_1164" | "out_of_state_card_scan";
  label: string;
  note: string;
}

export const FINGERPRINT_CARD_RULES: FingerprintCardRule[] = [
  {
    cardType: "hard_card_fd_258",
    label: "FD-258 Hard Card",
    note: "Standard hard-card fingerprint capture for mail-in or card-scan submissions.",
  },
  {
    cardType: "fbi_fd_1164",
    label: "FD-1164",
    note: "Applicant fingerprint card for eligible federal submissions.",
  },
  {
    cardType: "out_of_state_card_scan",
    label: "Out-of-State Card Scan",
    note: "Scan and route out-of-state fingerprint cards through eligible channels.",
  },
];

export function getFingerprintCardRule(
  cardType: FingerprintCardRule["cardType"]
): FingerprintCardRule | undefined {
  return FINGERPRINT_CARD_RULES.find((rule) => rule.cardType === cardType);
}
