// Internal operator flags — never exposed to client UI

export type OperatorFlag =
  | "CORRIDOR_ACTIVE"
  | "CORRIDOR_HOLD"
  | "REQUIRES_MANUAL_REVIEW"
  | "HIGH_VOLUME"
  | "CONSULAR_ONLY"
  | "TRANSLATION_REQUIRED"
  | "FEDERAL_CHAIN_REQUIRED"
  | "PHASE_LOCKED";

export interface OperatorFlagEntry {
  countrySlug: string;
  flags: OperatorFlag[];
  internalNote?: string;
}

// Internal registry — not exported to client-facing components
export const OPERATOR_FLAGS: OperatorFlagEntry[] = [
  { countrySlug: "italy", flags: ["CORRIDOR_ACTIVE", "HIGH_VOLUME"] },
  { countrySlug: "spain", flags: ["CORRIDOR_ACTIVE", "HIGH_VOLUME"] },
  { countrySlug: "portugal", flags: ["CORRIDOR_ACTIVE"] },
  { countrySlug: "brazil", flags: ["CORRIDOR_ACTIVE", "HIGH_VOLUME"] },
  { countrySlug: "uae", flags: ["CORRIDOR_ACTIVE", "REQUIRES_MANUAL_REVIEW"] },
  { countrySlug: "mexico", flags: ["CORRIDOR_ACTIVE"] },
  { countrySlug: "colombia", flags: ["CORRIDOR_ACTIVE"] },
  { countrySlug: "united-kingdom", flags: ["CORRIDOR_ACTIVE"] },
  { countrySlug: "canada", flags: ["CORRIDOR_ACTIVE", "CONSULAR_ONLY", "FEDERAL_CHAIN_REQUIRED"] },
  { countrySlug: "germany", flags: ["CORRIDOR_ACTIVE"] },
  { countrySlug: "france", flags: ["CORRIDOR_ACTIVE"] },
  { countrySlug: "greece", flags: ["CORRIDOR_ACTIVE"] },
  { countrySlug: "netherlands", flags: ["PHASE_LOCKED"] },
  { countrySlug: "switzerland", flags: ["PHASE_LOCKED"] },
  { countrySlug: "china", flags: ["REQUIRES_MANUAL_REVIEW", "PHASE_LOCKED"] },
];

export function getOperatorFlags(countrySlug: string): OperatorFlag[] {
  return OPERATOR_FLAGS.find(e => e.countrySlug === countrySlug)?.flags ?? [];
}
