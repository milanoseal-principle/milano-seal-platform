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
}

export function generateInvoice(total: number): InvoiceResult {
  const subtotal = total;
  const retainer = Math.round(subtotal * 0.5 * 100) / 100;
  const balance = Math.round((subtotal - retainer) * 100) / 100;
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
  };
}
