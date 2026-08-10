import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordSecurityEvent } from "@/lib/security/security-events";

export const runtime = "nodejs";

// Manual payment confirmation is intentionally disabled.
// Wise reconciliation is the only canonical paid-state authority.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await recordSecurityEvent({
    event_name: "PAYMENT_CONFIRMATION_REJECTED",
    severity: "high",
    actor: user?.email ?? user?.id ?? undefined,
    matter_id: id || undefined,
    route: "/api/admin/matters/[id]/confirm-payment",
    client_safe: false,
    metadata: {
      reason: "wise_reconciliation_authoritative",
    },
  });

  return NextResponse.json(
    {
      ok: false,
      code: "MANUAL_PAYMENT_CONFIRMATION_DISABLED",
      message:
        "Payment settlement is confirmed only through canonical Wise reconciliation.",
    },
    { status: 409 },
  );
}
