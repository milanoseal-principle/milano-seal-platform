import type { InvoiceResult } from "@/lib/invoice";
import type { PricingResult } from "@/lib/pricing";

export interface MatterQuoteSnapshot {
  lane: PricingResult["lane"];
  base_price: number;
  witness_total: number;
  total_price: number;
  invoice_retainer: number;
  invoice_balance: number;
}

export function buildMatterQuoteSnapshot(
  pricing: PricingResult,
  invoice: InvoiceResult,
): MatterQuoteSnapshot {
  return {
    lane: pricing.lane,
    base_price: pricing.base,
    witness_total: pricing.witness_total,
    total_price: pricing.total,
    invoice_retainer: invoice.retainer,
    invoice_balance: invoice.balance,
  };
}

export function persistedMatterHasQuote(
  matter: Record<string, unknown> | null,
  expected: MatterQuoteSnapshot,
): boolean {
  if (!matter) return false;

  return (
    matter.lane === expected.lane &&
    Number(matter.base_price) === expected.base_price &&
    Number(matter.witness_total) === expected.witness_total &&
    Number(matter.total_price) === expected.total_price &&
    Number(matter.invoice_retainer) === expected.invoice_retainer &&
    Number(matter.invoice_balance) === expected.invoice_balance
  );
}
