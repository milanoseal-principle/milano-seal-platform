// Normalize and classify inbound referral sources. Pure reducers — no network,
// no persistence, no fabricated records.

import type {
  ClientVertical,
  LeadSource,
  ReferralCapture,
} from "./types";

interface RawReferralInput {
  id: string;
  rawSource?: string | null;
  referralCode?: string | null;
  vertical?: ClientVertical;
  capturedAt?: string;
}

const SOURCE_PATTERNS: { source: LeadSource; test: RegExp }[] = [
  { source: "attorney_network", test: /\b(attorney|law|legal|counsel|firm)\b/i },
  { source: "university_partner", test: /\b(univ|college|academic|school|campus)\b/i },
  { source: "healthcare_partner", test: /\b(health|hospital|clinic|medical|nurse|physician)\b/i },
  { source: "immigration_professional", test: /\b(immigration|visa|consulate|migrant)\b/i },
  { source: "airport_emergency", test: /\b(airport|emergency|urgent|travel)\b/i },
  { source: "referral", test: /\b(refer|referral|partner|introduc)\b/i },
  { source: "paid", test: /\b(ads?|adwords|ppc|sponsored|utm_medium=cpc)\b/i },
  { source: "organic_search", test: /\b(google|bing|search|organic)\b/i },
  { source: "direct", test: /\b(direct|typed|bookmark)\b/i },
];

/**
 * Classify a raw referral string into a known LeadSource. Deterministic.
 */
export function classifyReferralSource(raw?: string | null): LeadSource {
  const value = (raw ?? "").trim();
  if (value.length === 0) return "unknown";
  for (const { source, test } of SOURCE_PATTERNS) {
    if (test.test(value)) return source;
  }
  return "unknown";
}

/**
 * Normalize a raw referral input into a structured ReferralCapture.
 */
export function normalizeReferral(input: RawReferralInput): ReferralCapture {
  const normalizedSource = classifyReferralSource(input.rawSource);
  const code = input.referralCode?.trim();
  return {
    id: input.id,
    rawSource: input.rawSource?.trim() || null,
    normalizedSource,
    vertical: input.vertical ?? "general",
    referralCode: code && code.length > 0 ? code.toUpperCase() : null,
    capturedAt: input.capturedAt ?? new Date(0).toISOString(),
  };
}

/**
 * Reduce a list of captures into counts per normalized source. Pure.
 */
export function countBySource(
  captures: ReferralCapture[],
): Record<LeadSource, number> {
  const base: Record<LeadSource, number> = {
    organic_search: 0,
    referral: 0,
    attorney_network: 0,
    university_partner: 0,
    healthcare_partner: 0,
    immigration_professional: 0,
    airport_emergency: 0,
    direct: 0,
    paid: 0,
    unknown: 0,
  };
  return captures.reduce((acc, c) => {
    acc[c.normalizedSource] += 1;
    return acc;
  }, base);
}
