export interface InvoiceLineItem {
  label: string;
  amount: number | "Included";
  internal_only?: boolean;
}

export interface InvoiceResult {
  subtotal: number;
  retainer: number;
  balance: number;
  valid_until: number;
  status: "awaiting_payment";
  payment_options: {
    primary: string;
    available: string[];
    public_note: string;
  };
  line_items: InvoiceLineItem[];
}

export function generateInvoice(
  total: number,
  opts?: { lane?: string; courierSurcharge?: number }
): InvoiceResult {
  const subtotal = total;
  const retainer = Math.round(subtotal * 0.5 * 100) / 100;
  const balance = Math.round((subtotal - retainer) * 100) / 100;

  const laneLabel =
    opts?.lane === "executive" ? "Executive Lane"
    : opts?.lane === "priority" ? "Priority Lane"
    : "Signature Lane";

  const lineItems: InvoiceLineItem[] = [
    { label: `${laneLabel} — Document Execution & Coordination`, amount: total },
    { label: "Courier Custody & International Release", amount: "Included" },
  ];

  if (opts?.courierSurcharge && opts.courierSurcharge > 0) {
    lineItems.push({ label: "Courier Surcharge", amount: opts.courierSurcharge });
  }

  return {
    subtotal,
    retainer,
    balance,
    valid_until: Date.now() + 72 * 60 * 60 * 1000,
    status: "awaiting_payment",
    payment_options: {
      primary: "wise",
      available: ["wise"],
      public_note: "Additional payment methods available upon request.",
    },
    line_items: lineItems,
  };
}
