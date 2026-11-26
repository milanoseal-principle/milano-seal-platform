import { NextResponse } from "next/server";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";

// Retired. It used to set a Milano OS `matters` record to
// final_payment_required (a parallel entity, not the canonical deals Matter)
// and write to the legacy event_ledger. Access is still checked first; the
// handler reads and writes nothing.
export async function POST() {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  return NextResponse.json(
    {
      error: "This legacy final-payment request is retired. Use the governed Matter payment workflow.",
      code: "USE_GOVERNED_PAYMENT_WORKFLOW",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
