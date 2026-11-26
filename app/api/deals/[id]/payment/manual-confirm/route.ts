import { NextResponse } from "next/server";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { canPerformAction } from "@/lib/security/access-control";

// Retired (also served at payment/confirm-final, which re-exports this handler).
// It used to mark a Milano OS `matters` record paid / ready_for_release and
// emit SCHEDULING_UNLOCKED / RELEASE_UNLOCKED from an operator's statement
// alone. A client or operator statement cannot establish settlement: payment is
// confirmed only by the signature-verified Wise reconciliation path. Access is
// still checked first (unauthorized callers get 401/403, not 410), and the
// handler reads and writes nothing.
export async function POST() {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  if (!canPerformAction(access.role, "confirm_payment_manual")) {
    return NextResponse.json({ error: "FOUNDER_ADMIN_REQUIRED" }, { status: 403 });
  }
  return NextResponse.json(
    {
      error: "Manual payment confirmation is retired. Payment is confirmed only through verified Wise settlement.",
      code: "USE_GOVERNED_WISE_RECONCILIATION",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
