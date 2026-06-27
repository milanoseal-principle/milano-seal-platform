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
  priceLabel: string; // display only
  priceCents: number | null; // null = dynamic/custom/free
  accessLevel: AccessLevel;
  ctaLabel: string;
  ctaHref: string;
}

export const ACCESS_PRODUCTS: AccessProduct[] = [
  {
    code: "CLIENT_ROUTE_REPORT",
    label: "Client Route Report",
    description:
      "A controlled route report for your country, document type, notarization path, apostille/authentication route, and release steps.",
    priceLabel: "$149",
    priceCents: 14900,
    accessLevel: "client_matter",
    ctaLabel: "Unlock Route Report",
    ctaHref: "/access?interest=route-report",
  },
  {
    code: "LAWYER_CLIENT_PACK_SINGLE",
    label: "Lawyer Client Pack",
    description:
      "Attorney-facing client explanation and readiness pack for international document execution.",
    priceLabel: "$149",
    priceCents: 14900,
    accessLevel: "lawyer_pack",
    ctaLabel: "Request Lawyer Client Pack",
    ctaHref: "/lawyer-access",
  },
  {
    code: "LAWYER_MONTHLY_ACCESS",
    label: "Lawyer Monthly Access",
    description: "Recurring access for firms sending international document matters.",
    priceLabel: "$299/month",
    priceCents: 29900,
    accessLevel: "lawyer_pack",
    ctaLabel: "Request Monthly Lawyer Access",
    ctaHref: "/lawyer-access?plan=monthly",
  },
  {
    code: "CONTROLLED_MATTER_DEPOSIT",
    label: "Controlled Matter Deposit",
    description:
      "Deposit unlocks scheduling and execution coordination for an active matter.",
    priceLabel: "Dynamic",
    priceCents: null,
    accessLevel: "client_matter",
    ctaLabel: "Make Deposit / Unlock Scheduling",
    ctaHref: "/portal/invoice",
  },
  {
    code: "CONCIERGE_EXECUTION_REVIEW",
    label: "Concierge Execution Review",
    description:
      "For urgent, complex, attorney-led, private-client, or multi-document international matters.",
    priceLabel: "Custom",
    priceCents: null,
    accessLevel: "client_matter",
    ctaLabel: "Request Concierge Review",
    ctaHref: "/access?interest=concierge",
  },
  {
    code: "ALLIANCE_APPLICATION",
    label: "Alliance Notary Application",
    description: "Apply to join the Milano Seal execution network.",
    priceLabel: "Free / Approved",
    priceCents: 0,
    accessLevel: "alliance_member",
    ctaLabel: "Apply for Alliance Access",
    ctaHref: "/alliance/apply",
  },
  {
    code: "VA_APPLICATION",
    label: "VA Support Application",
    description:
      "Apply to support intake review, upload organization, route preparation, and operator escalation.",
    priceLabel: "Internal",
    priceCents: 0,
    accessLevel: "va_internal",
    ctaLabel: "Apply for VA Support Role",
    ctaHref: "/va/apply",
  },
];

export function getAccessProduct(code: string): AccessProduct | undefined {
  return ACCESS_PRODUCTS.find((p) => p.code === code);
}
