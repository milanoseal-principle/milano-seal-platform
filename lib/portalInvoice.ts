import { APOSTILLE_FEES, COMPLEXITY, URGENCY_FEES } from "@/lib/pricing";
import { generateInvoice } from "@/lib/invoice";
import type { AcceptanceRoute } from "@/lib/milano-seal/global-acceptance/global-acceptance-types";
import { projectAuthenticationPricing } from "@/src/features/pricing/globalRoutePricing";

export type ClientInvoiceLineKind =
  | "execution"
  | "apostille"
  | "timeline"
  | "delivery"
  | "notarial"
  | "other";

export interface ClientInvoiceLineItem {
  key: string;
  label: string;
  amount: number;
  kind: ClientInvoiceLineKind;
  discountable: boolean;
}

export interface ClientAuthenticationProjection {
  route: AcceptanceRoute;
  label: string;
  status: "priced" | "pending_authority_confirmation" | "review_required" | "not_required";
  note: string;
}

export interface ClientCourierProjection {
  required: boolean;
  status: string;
  carrier: string | null;
  serviceLevel: string | null;
  providerRate: number | null;
  tierCredit: number;
  clientCharge: number;
  currency: string;
  estimatedDays: number | null;
}

export interface ClientInvoiceSnapshot {
  matterId: string;
  displayId: string;
  currency: string;
  lineItems: ClientInvoiceLineItem[];
  authentication: ClientAuthenticationProjection;
  courier: ClientCourierProjection;
  originalTotal: number;
  eligibleSubtotal: number;
  nonDiscountableTotal: number;
  discountAmount: number;
  discountPercent: number | null;
  finalTotal: number;
  retainer: number;
  balance: number;
  amountDueNow: number;
  paymentConfirmed: boolean;
  paymentStatus: string;
  wiseReference: string;
  wisePaymentUrl: string | null;
  courtesyApplied: boolean;
}

export type PortalInvoiceMatterRow = Record<string, unknown>;

const ACCEPTANCE_ROUTES = new Set<AcceptanceRoute>([
  "hague_apostille",
  "non_hague_consular_legalization",
  "federal_authentication",
  "state_apostille",
  "state_authentication",
  "ron_plus_apostille_review",
  "wet_ink_notary_plus_apostille",
  "certified_translation_review",
  "embassy_review_required",
  "restricted_or_high_risk_review",
  "unsupported_or_refer_out",
  "unknown_needs_review",
]);

function n(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function cents(value: number): number {
  return Math.round(value * 100);
}

function parseInternalNotes(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function timelineAmount(
  row: PortalInvoiceMatterRow,
  metadata: Record<string, unknown>,
): number {
  const timeline = String(
    metadata.timelinePreference ?? row.urgency ?? "standard",
  ).toLowerCase();
  if (timeline === "urgent" || timeline === "same_day" || timeline === "rush") {
    return URGENCY_FEES.rush;
  }
  if (timeline === "expedited") return URGENCY_FEES.expedited;
  return 0;
}

function timelineLabel(
  row: PortalInvoiceMatterRow,
  metadata: Record<string, unknown>,
): string {
  const timeline = String(
    metadata.timelinePreference ?? row.urgency ?? "standard",
  ).toLowerCase();
  if (timeline === "urgent" || timeline === "same_day" || timeline === "rush") {
    return "Urgent execution timeline";
  }
  if (timeline === "expedited") return "Expedited execution timeline";
  return "Standard execution timeline";
}

function push(lines: ClientInvoiceLineItem[], item: ClientInvoiceLineItem) {
  if (item.amount > 0) lines.push({ ...item, amount: n(item.amount) });
}

function normalizeRoute(value: unknown): AcceptanceRoute {
  const route = String(value ?? "unknown_needs_review") as AcceptanceRoute;
  return ACCEPTANCE_ROUTES.has(route) ? route : "unknown_needs_review";
}

function buildAuthenticationProjection(
  row: PortalInvoiceMatterRow,
): ClientAuthenticationProjection {
  const route = normalizeRoute(row.authentication_route);
  const projected = projectAuthenticationPricing({
    route,
    apostilleRequired: Boolean(row.apostille_required ?? row.requires_apostille),
  });
  const persistedStatus = String(row.authentication_route_status ?? "");

  return {
    route,
    label: projected.label,
    status:
      persistedStatus === "pending_authority_confirmation"
        ? "pending_authority_confirmation"
        : persistedStatus === "review_required"
          ? "review_required"
          : projected.status,
    note: projected.clientNote,
  };
}

function buildCourierProjection(row: PortalInvoiceMatterRow): ClientCourierProjection {
  const required = Boolean(row.courier_required) || n(row.courier_provider_rate) > 0;
  const providerRateRaw = row.courier_provider_rate;
  const providerRate =
    providerRateRaw == null || providerRateRaw === "" ? null : n(providerRateRaw);
  return {
    required,
    status: String(row.courier_pricing_status ?? (required ? "rate_required" : "not_required")),
    carrier: row.courier_carrier ? String(row.courier_carrier) : null,
    serviceLevel: row.courier_service_level
      ? String(row.courier_service_level)
      : null,
    providerRate,
    tierCredit: n(row.courier_tier_credit),
    clientCharge: n(row.courier_client_charge),
    currency: String(row.courier_currency ?? row.currency ?? "USD"),
    estimatedDays:
      row.courier_estimated_days == null
        ? null
        : Math.max(0, Math.floor(Number(row.courier_estimated_days) || 0)),
  };
}

/** Client-safe display projection only. It never computes or authorizes a discount. */
export function buildClientInvoiceLineItems(
  row: PortalInvoiceMatterRow,
): ClientInvoiceLineItem[] {
  const originalTotal = n(row.original_total ?? row.total_price ?? row.final_total);
  const metadata = parseInternalNotes(row.internal_notes);
  const lines: ClientInvoiceLineItem[] = [];

  const lane = String(row.lane ?? row.execution_lane ?? "Execution").trim();
  const base = n(row.base_price);
  push(lines, {
    key: "execution_lane",
    label: `${lane || "Execution"} Execution Lane`,
    amount: base,
    kind: "execution",
    discountable: true,
  });

  const docs = Math.max(1, Number(row.docs_count ?? 1) || 1);
  push(lines, {
    key: "additional_documents",
    label: `Additional document handling (${Math.max(0, docs - 1)})`,
    amount: Math.max(0, docs - 1) * COMPLEXITY.additional_document,
    kind: "execution",
    discountable: true,
  });

  const signers = Math.max(1, Number(row.signers ?? 1) || 1);
  push(lines, {
    key: "additional_signers",
    label: `Additional signer coordination (${Math.max(0, signers - 1)})`,
    amount: Math.max(0, signers - 1) * COMPLEXITY.additional_signer,
    kind: "execution",
    discountable: true,
  });

  push(lines, {
    key: "witnesses",
    label: "Witness coordination",
    amount: n(row.witness_total),
    kind: "execution",
    discountable: true,
  });

  const timeline = timelineAmount(row, metadata);
  push(lines, {
    key: "timeline",
    label: timelineLabel(row, metadata),
    amount: timeline,
    kind: "timeline",
    discountable: true,
  });

  const courier = buildCourierProjection(row);
  if (courier.clientCharge > 0) {
    push(lines, {
      key: "delivery",
      label: courier.serviceLevel
        ? `International courier · ${courier.serviceLevel}`
        : "International courier",
      amount: courier.clientCharge,
      kind: "delivery",
      discountable: false,
    });
  }

  const nonDiscountable = n(row.non_discountable_total);
  const otherPassThrough = Math.max(0, n(nonDiscountable - courier.clientCharge));
  push(lines, {
    key: "other_pass_through",
    label: "Other approved pass-through cost",
    amount: otherPassThrough,
    kind: "other",
    discountable: false,
  });

  let accounted = lines.reduce((sum, item) => sum + item.amount, 0);
  let remaining = Math.max(0, n(originalTotal - accounted));

  if (
    Boolean(row.apostille_required ?? row.requires_apostille) &&
    remaining >= APOSTILLE_FEES.first
  ) {
    const additionalCount = Math.max(
      0,
      Math.floor((remaining - APOSTILLE_FEES.first) / APOSTILLE_FEES.additional),
    );
    const apostilleAmount =
      APOSTILLE_FEES.first + additionalCount * APOSTILLE_FEES.additional;
    push(lines, {
      key: "apostille",
      label: `Apostille coordination${additionalCount > 0 ? ` (${additionalCount + 1})` : ""}`,
      amount: apostilleAmount,
      kind: "apostille",
      discountable: true,
    });
    accounted += apostilleAmount;
    remaining = Math.max(0, n(originalTotal - accounted));
  }

  if (
    remaining > 0 &&
    cents(remaining) % cents(COMPLEXITY.notarized_signature) === 0
  ) {
    push(lines, {
      key: "notarial_tracking",
      label: "Notarial execution tracking",
      amount: remaining,
      kind: "notarial",
      discountable: true,
    });
    remaining = 0;
  }

  if (remaining > 0) {
    push(lines, {
      key: "other_approved_service",
      label: "Additional approved execution service",
      amount: remaining,
      kind: "other",
      discountable: true,
    });
  }

  return lines;
}

export function buildClientInvoiceSnapshot(
  row: PortalInvoiceMatterRow,
): ClientInvoiceSnapshot {
  const originalTotal = n(row.original_total ?? row.total_price ?? row.final_total);
  const nonDiscountableTotal = n(row.non_discountable_total);
  const eligibleSubtotal = n(
    row.eligible_subtotal ?? Math.max(0, originalTotal - nonDiscountableTotal),
  );
  const discountAmount = n(row.discount_amount);
  const finalTotal = n(
    row.final_total ?? row.total_price ?? Math.max(0, originalTotal - discountAmount),
  );
  const invoice = generateInvoice(finalTotal);
  const storedRetainer = n(row.invoice_retainer);
  const storedBalance = n(row.invoice_balance);
  const amountDue = n(row.amount_due);
  const paymentConfirmed =
    Boolean(row.payment_confirmed) ||
    ["paid", "confirmed", "payment_confirmed"].includes(
      String(row.payment_status ?? "").toLowerCase(),
    );

  return {
    matterId: String(row.id ?? ""),
    displayId: String(row.deal_id ?? row.display_id ?? row.id ?? ""),
    currency: String(row.currency ?? "USD"),
    lineItems: buildClientInvoiceLineItems(row),
    authentication: buildAuthenticationProjection(row),
    courier: buildCourierProjection(row),
    originalTotal,
    eligibleSubtotal,
    nonDiscountableTotal,
    discountAmount,
    discountPercent: row.discount_value == null ? null : n(row.discount_value),
    finalTotal,
    retainer: storedRetainer > 0 ? storedRetainer : invoice.retainer,
    balance:
      storedBalance > 0 || finalTotal === 0 ? storedBalance : invoice.balance,
    amountDueNow: paymentConfirmed
      ? 0
      : amountDue > 0
        ? amountDue
        : invoice.retainer,
    paymentConfirmed,
    paymentStatus: String(row.payment_status ?? "unpaid"),
    wiseReference: String(
      row.wise_reference ?? row.payment_reference ?? row.deal_id ?? "",
    ),
    wisePaymentUrl:
      typeof row.payment_link === "string" && row.payment_link
        ? row.payment_link
        : null,
    courtesyApplied: Boolean(row.discount_code) && discountAmount > 0,
  };
}
