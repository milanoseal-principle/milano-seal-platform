import { createHmac, timingSafeEqual } from "crypto";
import type { MilanoMatterLike, PaymentType } from "@/src/features/milano/types";

export interface WiseInstructionInput {
  matter: MilanoMatterLike;
  paymentType: PaymentType;
  amountDue: number;
  clientName?: string;
}

export function buildWisePaymentInstructions(input: WiseInstructionInput) {
  const reference = input.matter.payment_reference || `${input.matter.matter_reference ?? "MS"}-${input.paymentType.toUpperCase()}`;
  return {
    payment_method: "Wise",
    payment_reference: reference,
    amount_due: Math.round(Number(input.amountDue) * 100) / 100,
    currency: "USD",
    client_name: input.clientName ?? "Milano Seal Client",
    matter_reference: input.matter.matter_reference,
    document_type: input.matter.document_type,
    support_cta: "Contact The Milano Seal with your matter reference after payment is sent.",
  };
}

export function verifyWiseSignature(rawBody: string, signature: string | null, secret = process.env.WISE_WEBHOOK_SECRET): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = signature.replace(/^sha256=/, "");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
