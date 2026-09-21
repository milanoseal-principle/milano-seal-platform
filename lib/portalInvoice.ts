import { APOSTILLE_FEES, COMPLEXITY, SHIPPING_FEES, URGENCY_FEES } from "@/lib/pricing";
import { generateInvoice } from "@/lib/invoice";

export type ClientInvoiceLineKind = "execution" | "apostille" | "timeline" | "delivery" | "notarial" | "other";

export interface ClientInvoiceLineItem {
  key: string;
  label: string;
  amount: number;
  kind: ClientInvoiceLineKind;
  discountable: boolean;
}

export interface ClientInvoiceSnapshot {
  matterId: string;
  displayId: string;
  currency: string;
  matterPricingType: string | null;
  executionMethod: string | null;
  pricingVersion: string | null;
  lineItems: ClientInvoiceLineItem[];
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
  thirdPartyTimingNotice: string;
}

export type PortalInvoiceMatterRow = Record<string, unknown>;

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
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function timelineAmount(row: PortalInvoiceMatterRow, metadata: Record<string, unknown>): number {
  const timeline = String(metadata.timelinePreference ?? row.urgency ?? "standard").toLowerCase();
  if (timeline === "urgent" || timeline === "same_day" || timeline === "rush") return URGENCY_FEES.rush;
  if (timeline === "expedited") return URGENCY_FEES.expedited;
  return 0;
}

function timelineLabel(row: PortalInvoiceMatterRow, metadata: Record<string, unknown>): string {
  const timeline = String(metadata.timelinePreference ?? row.urgency ?? "standard").toLowerCase();
  if (timeline === "urgent" || timeline === "same_day" || timeline === "rush") return "Urgent execution timeline";
  if (timeline === "expedited") return "Expedited execution timeline";
  return "Standard execution timeline";
}

function deliveryLabel(metadata: Record<string, unknown>, amount: number): string {
  const delivery = String(metadata.deliveryMethod ?? "").toLowerCase();
  if (delivery === "international_courier" || amount === SHIPPING_FEES.international) return "International courier & controlled release";
  if (delivery === "domestic_courier" || amount === SHIPPING_FEES.standard_domestic) return "Domestic courier & controlled release";
  return "Courier / dispatch";
}

function push(lines: ClientInvoiceLineItem[], item: ClientInvoiceLineItem) {
  if (item.amount > 0) lines.push({ ...item, amount: n(item.amount) });
}

function canonicalQuoteLines(raw: unknown): ClientInvoiceLineItem[] {
  if (!Array.isArray(raw)) return [];
  const safe: ClientInvoiceLineItem[] = [];
  for (const candidate of raw) {
    if (!candidate || typeof candidate !== "object") continue;
    const item = candidate as Record<string, unknown>;
    const amount = n(item.amount);
    if (amount <= 0) continue;
    const category = String(item.category ?? "other");
    const kind: ClientInvoiceLineKind =
      category === "base" || category === "document" || category === "signer" || category === "witness" || category === "special"
        ? "execution"
        : category === "notary"
          ? "notarial"
          : category === "timing"
            ? "timeline"
            : category === "courier"
              ? "delivery"
              : category === "authority"
                ? "apostille"
                : "other";
    safe.push({
      key: String(item.code ?? `line_${safe.length + 1}`),
      label: String(item.label ?? "Approved Matter service"),
      amount,
      kind,
      discountable: !["courier", "authority"].includes(category),
    });
  }
  return safe;
}

/** Client-safe display projection only. It never computes or authorizes a discount. */
export function buildClientInvoiceLineItems(row: PortalInvoiceMatterRow): ClientInvoiceLineItem[] {
  const canonicalLines = canonicalQuoteLines(row.quote_breakdown);
  if (canonicalLines.length > 0) return canonicalLines;

  const originalTotal = n(row.original_total ?? row.total_price ?? row.final_total);
  const metadata = parseInternalNotes(row.internal_notes);
  const lines: ClientInvoiceLineItem[] = [];

  const lane = String(row.lane ?? row.execution_lane ?? "Execution").trim();
  const base = n(row.base_price);
  push(lines, { key: "execution_lane", label: `${lane || "Execution"} Execution Lane`, amount: base, kind: "execution", discountable: true });

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

  push(lines, { key: "witnesses", label: "Witness coordination", amount: n(row.witness_total), kind: "execution", discountable: true });

  const timeline = timelineAmount(row, metadata);
  push(lines, { key: "timeline", label: timelineLabel(row, metadata), amount: timeline, kind: "timeline", discountable: true });

  const nonDiscountable = n(row.non_discountable_total);
  push(lines, { key: "delivery", label: deliveryLabel(metadata, nonDiscountable), amount: nonDiscountable, kind: "delivery", discountable: false });

  let accounted = lines.reduce((sum, item) => sum + item.amount, 0);
  let remaining = Math.max(0, n(originalTotal - accounted));

  if (Boolean(row.apostille_required ?? row.requires_apostille) && remaining >= APOSTILLE_FEES.first) {
    const additionalCount = Math.max(0, Math.floor((remaining - APOSTILLE_FEES.first) / APOSTILLE_FEES.additional));
    const apostilleAmount = APOSTILLE_FEES.first + additionalCount * APOSTILLE_FEES.additional;
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

  if (remaining > 0 && cents(remaining) % cents(COMPLEXITY.notarized_signature) === 0) {
    push(lines, { key: "notarial_tracking", label: "Notarial execution tracking", amount: remaining, kind: "notarial", discountable: true });
    accounted += remaining;
    remaining = 0;
  }

  if (remaining > 0) {
    push(lines, { key: "other_approved_service", label: "Additional approved execution service", amount: remaining, kind: "other", discountable: true });
  }

  return lines;
}

export function buildClientInvoiceSnapshot(row: PortalInvoiceMatterRow): ClientInvoiceSnapshot {
  const originalTotal = n(row.original_total ?? row.total_price ?? row.final_total);
  const nonDiscountableTotal = n(row.non_discountable_total);
  const eligibleSubtotal = n(row.eligible_subtotal ?? Math.max(0, originalTotal - nonDiscountableTotal));
  const discountAmount = n(row.discount_amount);
  const finalTotal = n(row.final_total ?? row.total_price ?? Math.max(0, originalTotal - discountAmount));
  const invoice = generateInvoice(finalTotal);
  const storedRetainer = n(row.invoice_retainer);
  const storedBalance = n(row.invoice_balance);
  const amountDue = n(row.amount_due);
  const paymentConfirmed = Boolean(row.payment_confirmed) || ["paid", "confirmed", "payment_confirmed"].includes(String(row.payment_status ?? "").toLowerCase());

  return {
    matterId: String(row.id ?? ""),
    displayId: String(row.deal_id ?? row.display_id ?? row.id ?? ""),
    currency: String(row.currency ?? "USD"),
    matterPricingType: row.matter_pricing_type == null ? null : String(row.matter_pricing_type),
    executionMethod: row.quote_execution_method == null ? null : String(row.quote_execution_method),
    pricingVersion: row.pricing_version == null ? null : String(row.pricing_version),
    lineItems: buildClientInvoiceLineItems(row),
    originalTotal,
    eligibleSubtotal,
    nonDiscountableTotal,
    discountAmount,
    discountPercent: row.discount_value == null ? null : n(row.discount_value),
    finalTotal,
    retainer: storedRetainer > 0 ? storedRetainer : invoice.retainer,
    balance: storedBalance > 0 || finalTotal === 0 ? storedBalance : invoice.balance,
    amountDueNow: paymentConfirmed ? 0 : (amountDue > 0 ? amountDue : invoice.retainer),
    paymentConfirmed,
    paymentStatus: String(row.payment_status ?? "unpaid"),
    wiseReference: String(row.wise_reference ?? row.payment_reference ?? row.deal_id ?? ""),
    wisePaymentUrl: typeof row.payment_link === "string" && row.payment_link ? row.payment_link : null,
    courtesyApplied: Boolean(row.discount_code) && discountAmount > 0,
    thirdPartyTimingNotice:
      "Milano Seal coordinates the governed execution route. Government offices, consulates, receiving authorities, carriers, and other third parties control their own processing and acceptance timelines.",
  };
}
