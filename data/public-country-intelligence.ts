// Milano Seal — PUBLIC Country Intelligence (client-safe teaser layer)
//
// Public surfaces may use destination presentation data (name, flag, demand,
// common matter types), but compliance/routing posture must come from the
// canonical country compliance registry. Missing or verification-required
// profiles fail closed to receiving-authority review.

import { DESTINATIONS, type Destination } from "@/data/destinations";
import { getCountryBySlug } from "@/lib/compliance/countries";

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
  verificationRequired: boolean;
  sourceStatus: "CANONICAL" | "REVIEW_REQUIRED" | "UNAVAILABLE";
}

const EYEBROW = "EXECUTION INTELLIGENCE";
const PRIMARY_CTA = "Start Controlled Intake";
const SECONDARY_CTA = "Open Global Atlas";

const ROUTE_LABELS: Record<PublicRouteType, string> = {
  hague_apostille: "HAGUE APOSTILLE REVIEW ROUTE",
  consular_legalization: "AUTHENTICATION / CONSULAR REVIEW ROUTE",
  authority_review: "RECEIVING-AUTHORITY REVIEW REQUIRED",
  hybrid_review: "HYBRID AUTHENTICATION REVIEW ROUTE",
};

const STATUS_PILLS: Record<PublicRouteType, string> = {
  hague_apostille: "APOSTILLE REVIEW",
  consular_legalization: "AUTHENTICATION REVIEW",
  authority_review: "REVIEW REQUIRED",
  hybrid_review: "HYBRID REVIEW",
};

const PUBLIC_PATHS: Record<PublicRouteType, string[]> = {
  hague_apostille: [
    "01 Document-origin and receiving-authority review",
    "02 Notarial / certified-copy readiness review",
    "03 Competent-authority apostille coordination",
    "04 Custody-controlled international release",
  ],
  consular_legalization: [
    "01 Document-origin and receiving-authority review",
    "02 Authentication pathway confirmation",
    "03 Consular / embassy step review where applicable",
    "04 Custody-controlled international release",
  ],
  authority_review: [
    "01 Document-origin and receiving-authority review",
    "02 Current authority pathway verification",
    "03 Execution requirements confirmed before action",
    "04 Custody-controlled international release",
  ],
  hybrid_review: [
    "01 Document-origin and receiving-authority review",
    "02 Apostille / authentication pathway verification",
    "03 Additional authority step review where applicable",
    "04 Custody-controlled international release",
  ],
};

const SAFE_FLAGS = new Set([
  "Apostille Review",
  "Authentication Review",
  "Authority Review",
  "Translation Review",
  "Courier Release",
  "Corporate",
  "POA",
  "Civil Record",
  "Citizenship",
  "Real Estate",
  "Private Client",
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

function governedRouteType(slug: string): {
  routeType: PublicRouteType;
  verificationRequired: boolean;
  sourceStatus: PublicCountryIntelligence["sourceStatus"];
} {
  const profile = getCountryBySlug(slug);
  if (!profile) {
    return {
      routeType: "authority_review",
      verificationRequired: true,
      sourceStatus: "UNAVAILABLE",
    };
  }

  if (profile.verificationStatus === "VERIFICATION_REQUIRED") {
    return {
      routeType: "authority_review",
      verificationRequired: true,
      sourceStatus: "REVIEW_REQUIRED",
    };
  }

  if (profile.hagueMember === "member") {
    return {
      routeType: "hague_apostille",
      verificationRequired: false,
      sourceStatus: "CANONICAL",
    };
  }

  if (profile.hagueMember === "bilateral") {
    return {
      routeType: "hybrid_review",
      verificationRequired: false,
      sourceStatus: "CANONICAL",
    };
  }

  return {
    routeType: "consular_legalization",
    verificationRequired: false,
    sourceStatus: "CANONICAL",
  };
}

const PUBLIC_PRIORITY_COPY: Record<
  string,
  Partial<Pick<PublicCountryIntelligence, "authoritySummary" | "publicFlags" | "complianceBoundary">>
> = {
  italy: {
    authoritySummary:
      "Italy-bound documents are screened for document origin, execution readiness, authority routing, translation posture, and receiving-authority presentation before release.",
    publicFlags: ["Citizenship", "POA", "Civil Record", "Apostille Review", "Translation Review"],
    complianceBoundary:
      "Routing snapshot only — final acceptance remains subject to the receiving authority in Italy.",
  },
  brazil: {
    authoritySummary:
      "Brazil-bound documents are reviewed for document origin, execution readiness, authority routing, translation posture, and custody-controlled release.",
    publicFlags: ["Corporate", "POA", "Civil Record", "Translation Review", "Courier Release"],
    complianceBoundary:
      "Routing snapshot only — final acceptance remains subject to the receiving authority in Brazil.",
  },
  uae: {
    authoritySummary:
      "UAE-bound documents remain authority-review controlled until the applicable authentication, apostille, consular, translation, and receiving-party requirements are confirmed.",
    publicFlags: ["Corporate", "Authority Review", "Private Client", "Authentication Review", "Courier Release"],
    complianceBoundary:
      "Routing snapshot only — current authority requirements must be confirmed before execution or release.",
  },
};

function buildPublic(dest: Destination): PublicCountryIntelligence {
  const governed = governedRouteType(dest.slug);
  const override = PUBLIC_PRIORITY_COPY[dest.slug] ?? {};

  const derivedFlags = Array.from(
    new Set(
      (dest.commonDocuments ?? [])
        .map(normalizeFlag)
        .filter((flag): flag is string => Boolean(flag))
        .concat(
          governed.routeType === "hague_apostille"
            ? "Apostille Review"
            : governed.routeType === "authority_review"
              ? "Authority Review"
              : "Authentication Review",
          "Custody Release",
        ),
    ),
  ).slice(0, 5);

  const summary =
    override.authoritySummary ??
    (governed.verificationRequired
      ? `Current authority routing for ${dest.name} requires operator review before execution decisions are presented as authoritative.`
      : `${dest.name}-bound documents are screened for document origin, execution readiness, authority routing, receiving-authority posture, and custody-controlled release.`);

  const boundary =
    override.complianceBoundary ??
    `Final acceptance remains subject to the receiving authority in ${dest.name}; Matter-specific review controls execution and release.`;

  return {
    slug: dest.slug,
    displayName: dest.name,
    flag: dest.flag,
    routeType: governed.routeType,
    statusPill: STATUS_PILLS[governed.routeType],
    eyebrow: EYEBROW,
    routeLabel: ROUTE_LABELS[governed.routeType],
    authoritySummary: summary,
    publicFlags: (override.publicFlags ?? derivedFlags).filter(
      (flag) => normalizeFlag(flag) !== null,
    ),
    publicExecutionPath: PUBLIC_PATHS[governed.routeType],
    complianceBoundary: boundary,
    primaryCtaLabel: PRIMARY_CTA,
    secondaryCtaLabel: SECONDARY_CTA,
    verificationRequired: governed.verificationRequired,
    sourceStatus: governed.sourceStatus,
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

  const name =
    fallbackName ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());

  return {
    slug,
    displayName: name,
    routeType: "authority_review",
    statusPill: STATUS_PILLS.authority_review,
    eyebrow: EYEBROW,
    routeLabel: ROUTE_LABELS.authority_review,
    authoritySummary:
      "Current authority routing is not available in the public registry. Operator review is required before execution.",
    publicFlags: ["Authority Review", "Custody Release"],
    publicExecutionPath: PUBLIC_PATHS.authority_review,
    complianceBoundary:
      "No public routing assumption is made without governed authority intelligence.",
    primaryCtaLabel: PRIMARY_CTA,
    secondaryCtaLabel: SECONDARY_CTA,
    verificationRequired: true,
    sourceStatus: "UNAVAILABLE",
  };
}
