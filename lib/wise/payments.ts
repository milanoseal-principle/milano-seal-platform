import { createWisePaymentRequest } from "@/lib/wise";
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

export function calculatePaymentAmount(
  deal: {
    amount?: number | null;
    total_price?: number | null;
    rush_fee?: number | null;
    translation_fee?: number | null;
    apostille_fee?: number | null;
  },
  paymentType: PaymentType,
): number {
  const total = Number(deal.total_price ?? deal.amount ?? 0);
  switch (paymentType) {
    case "retainer":
      return Math.round(total * 0.5 * 100) / 100;
    case "final_balance":
      return Math.round(total * 0.5 * 100) / 100;
    case "rush_upgrade":
      return Number(deal.rush_fee ?? 250);
    case "translation_addon":
      return Number(deal.translation_fee ?? 150);
    case "additional_apostille":
      return Number(deal.apostille_fee ?? 175);
    case "supplemental":
    case "refund":
    default:
      return total;
  }
}
