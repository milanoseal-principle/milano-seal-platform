// Legacy Client Courtesy Credit
// First Client Legacy Courtesy Credit — 50% off next eligible Milano Seal service fee.
// Third-party / platform / courier / state / government / filing fees excluded.
// Requires founder approval. Portal shows client-safe copy only.

export type LegacyClientCredit = {
  clientEmail: string;
  clientName?: string;
  creditName: string;
  discountPercent: number;
  appliesTo: "service_fee_only";
  status: "active" | "used" | "expired" | "cancelled";
  clientSafeNote: string;
  internalReason: string;  // dashboard-only — never rendered publicly
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  usedAt?: Date;
  matterIdUsed?: string;
};

export const LEGACY_CLIENT_CREDIT_DEFAULTS = {
  creditName: "First Client Legacy Courtesy Credit",
  discountPercent: 50,
  appliesTo: "service_fee_only" as const,
  clientSafeNote:
    "You have a 50% courtesy credit available toward your next eligible Milano Seal service fee as one of our first legacy clients.",
  internalReason:
    "Legacy Client Courtesy Credit created due to first-client relationship and early workflow maturity issue. Applies to next eligible Milano Seal service fee only. Third-party, platform, courier, state, government, and filing fees excluded.",
};

// Builds a new legacy credit record ready for DB insert.
export function buildLegacyClientCredit(params: {
  clientEmail: string;
  clientName?: string;
  createdBy: string;
  expiresAt?: Date;
}): LegacyClientCredit {
  return {
    ...LEGACY_CLIENT_CREDIT_DEFAULTS,
    clientEmail: params.clientEmail,
    clientName: params.clientName,
    status: "active",
    createdBy: params.createdBy,
    createdAt: new Date(),
    expiresAt: params.expiresAt,
  };
}

// Returns the client-portal-safe credit summary.
// Never expose internalReason, discountReason, or workflow notes.
export function getClientSafeCreditDisplay(credit: Pick<LegacyClientCredit, "creditName" | "clientSafeNote" | "status">): {
  visible: boolean;
  title: string;
  body: string;
} {
  if (credit.status !== "active") {
    return { visible: false, title: "", body: "" };
  }
  return {
    visible: true,
    title: credit.creditName,
    body: credit.clientSafeNote,
  };
}

// Intake href for legacy client — prefills destination and flags credit context.
export const LEGACY_CLIENT_INTAKE_HREF = "/intake?legacy_client=true&destination=italy";

// Portal banner CTA
export const LEGACY_CLIENT_PORTAL_CTA = "Start Next Matter";
