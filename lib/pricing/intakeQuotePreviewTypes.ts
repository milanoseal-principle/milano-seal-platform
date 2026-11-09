/**
 * Browser-safe types for the server-side intake quote preview. This file must
 * stay free of pricing logic and imports: it is the only pricing module the
 * public Smart Intake may import.
 */

/** Exactly what the browser may see. No engine internals. */
export interface IntakeQuotePreview {
  mode: "approved_price" | "quote_after_review";
  summary: string;
  amount?: number;
  lineItems: Array<{ key: string; label: string; amount: number }>;
  paymentGateRequired: true;
  schedulingLockedUntilPayment: true;
}

export const QUOTE_AFTER_REVIEW_PREVIEW: IntakeQuotePreview = {
  mode: "quote_after_review",
  summary: "Your private quote is confirmed after Milano review.",
  lineItems: [],
  paymentGateRequired: true,
  schedulingLockedUntilPayment: true,
};
