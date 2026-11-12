import { NextResponse } from "next/server";
import { getMatterById, updateMatter } from "@/src/features/matters/matterRepository";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";
import type { PaymentType } from "@/src/features/milano/types";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { canPerformAction } from "@/lib/security/access-control";

function money(value: number) {
  return Math.round(value * 100) / 100;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Manual payment confirmation is a founder-only action; the audit actor is the
  // verified session, never a client-supplied email.
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  if (!canPerformAction(access.role, "confirm_payment_manual")) {
    return NextResponse.json({ error: "FOUNDER_ADMIN_REQUIRED" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = (await request.json()) as { payment_type?: PaymentType; amount_received?: number; payment_reference?: string };
    const matterResult = await getMatterById(id);
    if (matterResult.error) throw matterResult.error;
    const matter = matterResult.data;
    const paymentType = body.payment_type ?? "full_payment";
    const amountReceived = money(Number(body.amount_received ?? 0));
    const finalTotal = money(Number(matter.final_total ?? matter.original_total ?? 0));
    const depositAmount = money(Number(matter.deposit_amount ?? finalTotal));
    const amountDue = paymentType === "deposit" ? depositAmount : paymentType === "final_balance" ? money(finalTotal - Number(matter.deposit_paid_amount ?? 0)) : finalTotal;
    const mismatch = amountReceived < amountDue;

    const values: Record<string, unknown> = {
      amount_received: paymentType === "deposit" ? Number(matter.amount_received ?? 0) + amountReceived : amountReceived,
      payment_method: "Wise",
      payment_reference: body.payment_reference ?? matter.payment_reference,
      payment_mismatch_flag: mismatch,
      payment_status: mismatch ? "mismatch_review" : paymentType === "deposit" ? "deposit_paid" : "paid",
    };

    if (!mismatch && paymentType === "deposit") {
      values.deposit_paid_amount = amountReceived;
      values.status = "scheduling_unlocked";
    }
    if (!mismatch && (paymentType === "final_balance" || paymentType === "full_payment")) {
      values.balance_due = 0;
      values.release_status = "ready_for_release";
      values.status = "ready_for_release";
      values.release_unlocked_at = new Date().toISOString();
    }

    const updated = await updateMatter(id, values);
    if (updated.error) throw updated.error;
    await writeEventLedger({ matterId: id, actorEmail: access.actor, eventType: mismatch ? "PAYMENT_MISMATCH_FLAGGED" : "MANUAL_PAYMENT_CONFIRMED", metadata: { paymentType, amountDue, amountReceived } });
    if (!mismatch && paymentType === "deposit") await writeEventLedger({ matterId: id, actorEmail: access.actor, eventType: "SCHEDULING_UNLOCKED" });
    if (!mismatch && (paymentType === "final_balance" || paymentType === "full_payment")) await writeEventLedger({ matterId: id, actorEmail: access.actor, eventType: "RELEASE_UNLOCKED" });
    return NextResponse.json({ matter: updated.data, mismatch });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment confirmation failed." }, { status: 400 });
  }
}
