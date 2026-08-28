// Milano Seal — Access Products (Wise-first, public-safe catalog)
// Pricing here is for paid ACCESS outputs, not the locked execution lanes.

export type AccessLevel =
  | "public"
  | "client_matter"
  | "lawyer_pack"
  | "alliance_member"
  | "va_internal"
  | "operator"
  | "founder";

export interface AccessProduct {
  code: string;
  label: string;
  description: string;
  priceLabel: string;
  priceCents: number | null;
  accessLevel: AccessLevel;
  ctaLabel: string;
  ctaHref: string;
}

export const ACCESS_PRODUCTS: AccessProduct[] = [
  {
    code: "CLIENT_ROUTE_REPORT",
    label: "Cross-Border Execution Intelligence Report",
    description:
      "Optional pre-Matter execution intelligence for clients who need clarity on document route, notarization posture, apostille/authentication path, receiving-authority dependencies, and release steps before opening a full execution Matter.",
    priceLabel: "$149 / Matter",
    priceCents: 14900,
    accessLevel: "client_matter",
    ctaLabel: "Request Route Intelligence",
    ctaHref: "/access?interest=route-report",
  },
  {
    code: "LAWYER_CLIENT_PACK_SINGLE",
    label: "Milano Cross-Border Execution Intelligence Report™",
    description:
      "Attorney-facing Matter intelligence covering route decision, authority matrix, execution requirements, rejection risk, client instructions, notary brief, custody plan, and evidence appendix.",
    priceLabel: "$149 / Matter",
    priceCents: 14900,
    accessLevel: "lawyer_pack",
    ctaLabel: "Request Counsel Report",
    ctaHref: "/lawyer-access#report",
  },
  {
    code: "LAWYER_MONTHLY_ACCESS",
    label: "Milano Counsel Desk™",
    description:
      "Recurring professional access for firms sending international document matters through a controlled U.S. execution workflow.",
    priceLabel: "$299 / month",
    priceCents: 29900,
    accessLevel: "lawyer_pack",
    ctaLabel: "Open Counsel Desk",
    ctaHref: "/lawyer-access#counsel-desk",
  },
  {
    code: "CONTROLLED_MATTER_DEPOSIT",
    label: "International Execution Matter",
    description:
      "The core client transaction. Intake produces a Matter-specific quote; verified payment unlocks scheduling and execution coordination.",
    priceLabel: "Dynamic Matter quote",
    priceCents: null,
    accessLevel: "client_matter",
    ctaLabel: "Begin Secure Intake",
    ctaHref: "/intake",
  },
  {
    code: "CONCIERGE_EXECUTION_REVIEW",
    label: "Private Client & Complex Execution",
    description:
      "High-touch review for urgent, complex, counsel-led, private-client, family-office, or multi-document international matters.",
    priceLabel: "Custom",
    priceCents: null,
    accessLevel: "client_matter",
    ctaLabel: "Request Concierge Review",
    ctaHref: "/access?interest=concierge",
  },
  {
    code: "ALLIANCE_APPLICATION",
    label: "Alliance Notary Network",
    description: "Apply to join the Milano Seal execution network.",
    priceLabel: "Application",
    priceCents: 0,
    accessLevel: "alliance_member",
    ctaLabel: "Apply for Alliance Access",
    ctaHref: "/alliance/apply",
  },
  {
    code: "VA_APPLICATION",
    label: "Operations / VA Network",
    description:
      "Apply to support intake review, upload organization, route preparation, and operator escalation.",
    priceLabel: "Internal",
    priceCents: 0,
    accessLevel: "va_internal",
    ctaLabel: "Apply for Operations Role",
    ctaHref: "/va/apply",
  },
];

export function getAccessProduct(code: string): AccessProduct | undefined {
  return ACCESS_PRODUCTS.find((p) => p.code === code);
}
