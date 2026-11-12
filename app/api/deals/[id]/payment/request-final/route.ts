import { NextResponse } from "next/server";
import { updateMatter } from "@/src/features/matters/matterRepository";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  const { id } = await params;
  const actorEmail = access.actor;
  const updated = await updateMatter(id, { status: "final_payment_required" });
  if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 400 });
  await writeEventLedger({ matterId: id, actorEmail, eventType: "FINAL_PAYMENT_REQUESTED", statusAfter: "final_payment_required" });
  return NextResponse.json({ matter: updated.data });
}
