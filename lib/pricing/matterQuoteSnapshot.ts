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
  );
}
