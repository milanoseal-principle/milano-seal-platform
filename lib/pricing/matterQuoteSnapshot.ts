export interface MatterQuoteSnapshot {
  lane: string;
  base_price: number;
  witness_total: number;
  total_price: number;
  original_total: number;
  eligible_subtotal: number;
  non_discountable_total: number;
  final_total: number;
  discount_code: string | null;
  discount_value: number | null;
  discount_amount: number;
  invoice_retainer: number;
  invoice_balance: number;
  amount_due: number;
  amount_paid: number;
  payment_status: "unpaid";
  payment_confirmed: false;
  payment_method: "wise";
}

export function buildMatterQuoteSnapshot(
  input: Omit<
    MatterQuoteSnapshot,
    | "amount_paid"
    | "payment_status"
    | "payment_confirmed"
    | "payment_method"
  >,
): MatterQuoteSnapshot {
  return {
    ...input,
    amount_paid: 0,
    payment_status: "unpaid",
    payment_confirmed: false,
    payment_method: "wise",
  };
}

const MONEY_FIELDS = [
  "base_price",
  "witness_total",
  "total_price",
  "original_total",
  "eligible_subtotal",
  "non_discountable_total",
  "final_total",
  "discount_amount",
  "invoice_retainer",
  "invoice_balance",
  "amount_due",
  "amount_paid",
] as const;
  eligible_subtotal: number;
  non_discountable_total: number;
  original_total: number;
  discount_amount: number;
  final_total: number;
  total_price: number;
  invoice_retainer: number;
  invoice_balance: number;
  amount_due: number;
  currency: "USD";
}

export interface MatterQuoteSnapshotInput {
  lane: string;
  basePrice: number;
  witnessTotal: number;
  eligibleSubtotal: number;
  nonDiscountableTotal: number;
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
  invoiceRetainer: number;
  invoiceBalance: number;
  currency?: "USD";
}

const money = (value: unknown): number =>
  Math.round(Number(value ?? 0) * 100) / 100;

export function buildMatterQuoteSnapshot(
  input: MatterQuoteSnapshotInput,
): MatterQuoteSnapshot {
  const finalTotal = money(input.finalTotal);
  const retainer = money(input.invoiceRetainer);

  return {
    lane: input.lane,
    base_price: money(input.basePrice),
    witness_total: money(input.witnessTotal),
    eligible_subtotal: money(input.eligibleSubtotal),
    non_discountable_total: money(input.nonDiscountableTotal),
    original_total: money(input.originalTotal),
    discount_amount: money(input.discountAmount),
    final_total: finalTotal,
    total_price: finalTotal,
    invoice_retainer: retainer,
    invoice_balance: money(input.invoiceBalance),
    amount_due: retainer,
    currency: input.currency ?? "USD",
  };
}

function sameMoney(actual: unknown, expected: number): boolean {
  const numeric = Number(actual);
  return Number.isFinite(numeric) && Math.abs(numeric - expected) <= 0.009;
}

export function persistedMatterHasQuote(
  matter: Record<string, unknown> | null,
  expected: MatterQuoteSnapshot,
): boolean {
  if (!matter) return false;

  return (
    matter.lane === expected.lane &&
    matter.discount_code === expected.discount_code &&
    (matter.discount_value == null
      ? expected.discount_value == null
      : Number(matter.discount_value) === expected.discount_value) &&
    matter.payment_status === expected.payment_status &&
    matter.payment_confirmed === expected.payment_confirmed &&
    matter.payment_method === expected.payment_method &&
    MONEY_FIELDS.every(
      (field) => Number(matter[field]) === expected[field],
    )
    String(matter.lane ?? "") === expected.lane &&
    sameMoney(matter.base_price, expected.base_price) &&
    sameMoney(matter.witness_total, expected.witness_total) &&
    sameMoney(matter.eligible_subtotal, expected.eligible_subtotal) &&
    sameMoney(matter.non_discountable_total, expected.non_discountable_total) &&
    sameMoney(matter.original_total, expected.original_total) &&
    sameMoney(matter.discount_amount, expected.discount_amount) &&
    sameMoney(matter.final_total, expected.final_total) &&
    sameMoney(matter.total_price, expected.total_price) &&
    sameMoney(matter.invoice_retainer, expected.invoice_retainer) &&
    sameMoney(matter.invoice_balance, expected.invoice_balance) &&
    sameMoney(matter.amount_due, expected.amount_due) &&
    String(matter.currency ?? "").toUpperCase() === expected.currency
  );
}
