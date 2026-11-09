import { NextRequest } from "next/server";
import { receivePaymentInstruction } from "@/lib/payments/instruction";
export const runtime = "nodejs";
export const maxDuration = 30;
export function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return receivePaymentInstruction(req, context);
}
