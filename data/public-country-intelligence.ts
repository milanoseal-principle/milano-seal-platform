// Milano Seal — PUBLIC Country Intelligence (client-safe teaser layer)
//
// This is the ONLY country-intelligence module allowed in public/client
// bundles. It exposes WHAT and WHY (authority, route, compliance boundary) and
// never the operating playbook (operator/VA/founder/revenue/ledger/payment-gate
// copy). The full private engine lives in data/country-execution-intelligence.ts
// which is marked `server-only` and must never be imported client-side.

import { DESTINATIONS, type Destination } from "@/data/destinations";

export type PublicRouteType =
  | "hague_apostille"
  | "consular_legalization"
  | "authority_review"
  | "hybrid_review";

export interface PublicCountryIntelligence {
  slug: string;
  displayName: string;
  flag?: string;
  routeType: PublicRouteType;
  statusPill: string;
  eyebrow: string;
  routeLabel: string;
  authoritySummary: string;
  publicFlags: string[];
  publicExecutionPath: string[];
  complianceBoundary: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

const EYEBROW = "EXECUTION INTELLIGENCE";
const PRIMARY_CTA = "Start Controlled Intake";
const SECONDARY_CTA = "Open Global Atlas";

const ROUTE_LABELS: Record<PublicRouteType, string> = {
  hague_apostille: "HAGUE APOSTILLE EXECUTION ROUTE",
  consular_legalization: "CONSULAR LEGALIZATION REVIEW ROUTE",
  authority_review: "RECEIVING-AUTHORITY REVIEW ROUTE",
  hybrid_review: "AUTHENTICATION / CONSULAR REVIEW ROUTE",
};

const STATUS_PILLS: Record<PublicRouteType, string> = {
  hague_apostille: "HAGUE MEMBER",
  consular_legalization: "CONSULAR REVIEW",
  authority_review: "AUTHORITY CHECK",
  hybrid_review: "HYBRID REVIEW",
};

// Public-safe execution path — never the internal workflow sequence.
const PUBLIC_PATH = [
  "01 Pre-flight readiness",
  "02 Authority route check",
  "03 Custody-controlled release",
];

// Only these flag labels may appear publicly.
const SAFE_FLAGS = new Set([
  "Apostille",
  "Authentication",
  "Consular Review",
  "Translation Review",
  "Courier Release",
  "Corporate",
  "POA",
  "Civil Record",
  "Citizenship",
  "Real Estate",
  "Private Client",
  "Authority Review",
  "Custody Release",
]);

function normalizeFlag(raw: string): string | null {
  const v = raw.trim();
  if (SAFE_FLAGS.has(v)) return v;
  if (/power of attorney|poa/i.test(v)) return "POA";
  if (/citizen/i.test(v)) return "Citizenship";
  if (/real estate|property/i.test(v)) return "Real Estate";
  if (/corporate|business/i.test(v)) return "Corporate";
  if (/affidavit|legal|civil/i.test(v)) return "Civil Record";
  if (/medical|academic/i.test(v)) return "Private Client";
  return null;
}

function deriveRouteType(dest: Destination): PublicRouteType {
  if (dest.slug === "uae" || dest.slug === "saudi-arabia" || dest.slug === "qatar") {
    return "consular_legalization";
  }
  if (dest.hague) return "hague_apostille";
  if (dest.slug === "mexico" || dest.slug === "canada") return "authority_review";
  return "consular_legalization";
}

// Public priority copy (teaser subset only — no workflow).
const PUBLIC_PRIORITY: Record<string, Partial<PublicCountryIntelligence>> = {
  italy: {
    displayName: "Italy",
    routeType: "hague_apostille",
    authoritySummary:
      "Italy-bound documents are screened for notarial readiness, apostille routing, citizenship/private-client use, translation risk, and receiving-authority presentation before release.",
    publicFlags: ["Citizenship", "POA", "Civil Record", "Apostille", "Translation Review"],
    complianceBoundary:
      "Routing snapshot only — final acceptance remains subject to Italian receiving-authority review.",
  },
  brazil: {
    displayName: "Brazil",
    routeType: "hague_apostille",
    authoritySummary:
      "Florida-origin documents for Brazil are routed through a controlled Hague apostille pathway with notarial readiness review, destination-use screening, translation/courier risk check, and release packet coordination.",
    publicFlags: ["Corporate", "POA", "Civil Record", "Translation Review", "Courier Release"],
    complianceBoundary:
      "Routing snapshot only — final acceptance remains subject to Brazilian receiving-authority review.",
  },
  uae: {
    displayName: "United Arab Emirates",
    routeType: "consular_legalization",
    authoritySummary:
      "UAE-bound documents require higher-control authentication review, with notarial readiness, state/federal route assessment, consular handling risk, and receiving-party presentation checked before release.",
    publicFlags: ["Corporate", "Consular Review", "Private Client", "Authentication", "Courier Release"],
    complianceBoundary:
      "Routing snapshot only — UAE matters may require authentication and consular review before receiving-party acceptance.",
  },
};

function buildPublic(dest: Destination): PublicCountryIntelligence {
  const routeType = deriveRouteType(dest);
  const isHague = routeType === "hague_apostille";
  const override = PUBLIC_PRIORITY[dest.slug] ?? {};

  const derivedFlags = Array.from(
    new Set(
      (dest.commonDocuments ?? [])
        .map(normalizeFlag)
        .filter((f): f is string => Boolean(f))
        .concat(isHague ? "Apostille" : "Authentication", "Custody Release"),
    ),
  ).slice(0, 5);

  const summary =
    override.authoritySummary ??
    (isHague
      ? `Florida-origin documents for ${dest.name} are screened for notarial readiness, apostille routing, destination-use, translation risk, and receiving-authority presentation before custody-controlled release.`
      : `${dest.name}-bound documents are screened for notarial readiness, authentication route assessment, consular handling risk, and receiving-party presentation before custody-controlled release.`);

  const boundary =
    override.complianceBoundary ??
    `Routing snapshot only — final acceptance remains subject to ${dest.name} receiving-authority review.`;

  const rt = override.routeType ?? routeType;

  return {
    slug: dest.slug,
    displayName: override.displayName ?? dest.name,
    flag: dest.flag,
    routeType: rt,
    statusPill: STATUS_PILLS[rt],
    eyebrow: EYEBROW,
    routeLabel: ROUTE_LABELS[rt],
    authoritySummary: summary,
    publicFlags: (override.publicFlags ?? derivedFlags).filter(
      (f) => normalizeFlag(f) !== null,
    ),
    publicExecutionPath: PUBLIC_PATH,
    complianceBoundary: boundary,
    primaryCtaLabel: PRIMARY_CTA,
    secondaryCtaLabel: SECONDARY_CTA,
  };
}

export const PUBLIC_COUNTRY_INTELLIGENCE: Record<string, PublicCountryIntelligence> =
  DESTINATIONS.reduce<Record<string, PublicCountryIntelligence>>((acc, dest) => {
    acc[dest.slug] = buildPublic(dest);
    return acc;
  }, {});

export function getPublicCountryExecutionIntelligence(
  slug: string,
  fallbackName?: string,
): PublicCountryIntelligence {
  const found = PUBLIC_COUNTRY_INTELLIGENCE[slug];
  if (found) return found;
  const dest = DESTINATIONS.find((d) => d.slug === slug);
  if (dest) return buildPublic(dest);
  const name = fallbackName ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return buildPublic({
    slug,
    name,
    flag: "🌐",
    hague: true,
    hagueStatus: "Hague Convention Member",
    apostilleRequired: true,
    demand: 0,
    note: "",
    executionPath: [],
    commonDocuments: ["Civil Record", "Corporate"],
  } as Destination);
}
