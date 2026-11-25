import { NextRequest } from "next/server";
import { authorizePaymentRequest } from "@/lib/payments/authorizePaymentRequest";
import { receivePaymentInstruction } from "@/lib/payments/instruction";
export const runtime = "nodejs";
export const maxDuration = 30;

// A Matter identifier alone is never authority to create or read a Wise
// payment instruction: an operator, the Matter owner, or this Matter's own
// intake payment capability (retainer only) is required. The shared handler
// is unchanged; amount and currency remain server-computed from the Matter.
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await req.clone().json().catch(() => ({}))) as { paymentType?: unknown };
  const paymentType = typeof body.paymentType === "string" && body.paymentType ? body.paymentType : "retainer";
  const authorization = await authorizePaymentRequest(req, id ?? "", paymentType);
  if (!authorization.ok) return authorization.response;
  return receivePaymentInstruction(req, { params: Promise.resolve({ id }) });
}
