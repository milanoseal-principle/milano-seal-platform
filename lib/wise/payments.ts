import { createWisePaymentRequest } from "@/lib/wise";
import { APOSTILLE_FEES, URGENCY_FEES } from "@/lib/pricing";
import {
  generatePaymentDescription,
  generatePaymentReference,
  type PaymentType,
} from "@/lib/wise/reference";

export interface WiseSessionParams {
  matterId: string;
  matterReference: string;
  paymentType: PaymentType;
  amount: number;
  currency?: string;
  payerName?: string | null;
  payerEmail?: string | null;
  founderName?: string;
  redirectUrl?: string | null;
}

export interface WiseSession {
  paymentUrl: string;
  reference: string;
  sessionId: string | null;
  description: string;
  mode: "production" | "fallback";
}

export async function generateWisePaymentSession(
  params: WiseSessionParams,
): Promise<WiseSession> {
  const reference = generatePaymentReference(
    params.matterReference,
    params.paymentType,
  );
  const description = generatePaymentDescription(
    params.paymentType,
    params.founderName,
  );
  const currency = params.currency ?? "USD";

  const result = await createWisePaymentRequest({
    dealId: reference,
    amount: params.amount,
    currency,
    description,
    clientName: params.payerName ?? null,
    clientEmail: params.payerEmail ?? null,
    redirectUrl: params.redirectUrl ?? null,
  });

  return {
    paymentUrl: result.url,
    reference,
    sessionId: result.id,
    description,
    mode: result.mode,
  };
}

function money(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount * 100) / 100
    : 0;
}

export function calculatePaymentAmount(
  deal: {
    amount?: number | null;
    total_price?: number | null;
    amount_due?: number | null;
    invoice_retainer?: number | null;
    invoice_balance?: number | null;
    rush_fee?: number | null;
    translation_fee?: number | null;
    apostille_fee?: number | null;
  },
  paymentType: PaymentType,
): number {
  const total = money(deal.total_price ?? deal.amount ?? 0);

  switch (paymentType) {
    case "retainer": {
      // The persisted Matter obligation is authoritative. This preserves the
      // 50% invoice doctrine while also honoring any approved discount that
      // already recalculated amount_due/invoice_retainer server-side.
      const due = money(deal.amount_due);
      if (due > 0) return due;
      const retainer = money(deal.invoice_retainer);
      if (retainer > 0) return retainer;
      return Math.round(total * 0.5 * 100) / 100;
    }

    case "final_balance": {
      const balance = money(deal.invoice_balance);
      if (balance > 0) return balance;
      return Math.round(total * 0.5 * 100) / 100;
    }

    case "rush_upgrade":
      return money(deal.rush_fee) || URGENCY_FEES.rush;

    case "translation_addon":
      // Translation is not a globally fixed canonical fee in lib/pricing.ts.
      // Fail closed unless the Matter has an approved stored translation fee.
      return money(deal.translation_fee);

    case "additional_apostille":
      return money(deal.apostille_fee) || APOSTILLE_FEES.additional;

    case "supplemental":
    case "refund":
    default:
      return total;
  }
}
