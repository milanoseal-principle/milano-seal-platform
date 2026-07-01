import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDiscountEngineEnabled } from "@/lib/discounts/env";
import { canApproveComp } from "@/lib/discounts/permissions";
import { compClearMatter } from "@/lib/discounts/compClear";
import { recordSecurityEvent } from "@/lib/security/security-events";

export const runtime = "nodejs";

// POST /api/admin/discounts/comp-clear
// Applies an owner/operator-approved 100% comp to a matter and clears payment
// through an audited discount redemption. Strictest gate in the engine:
// canApproveComp (env flag + owner role or owner/operator allow-listed email).
export async function POST(request: Request) {
  if (!isDiscountEngineEnabled()) {
    return NextResponse.json({ error: "Discount engine is disabled." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (user.app_metadata?.role ?? user.user_metadata?.role) as string | undefined;
  if (!canApproveComp(role, user.email)) {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      actor: user.email ?? user.id,
      route: "/api/admin/discounts/comp-clear",
      client_safe: false,
      metadata: { role: String(role), reason: "comp_not_permitted" },
    });
    return NextResponse.json(
      { error: "A 100% comp requires owner/operator approval." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    matter_id?: string;
    deal_id?: string;
    discount_code_id?: string;
    reason?: string;
  };
  const dealId = body.deal_id || body.matter_id;
  if (!dealId || !body.discount_code_id) {
    return NextResponse.json(
      { error: "deal_id (matter_id) and discount_code_id are required." },
      { status: 400 },
    );
  }

  try {
    const result = await compClearMatter({
      dealId,
      discountCodeId: body.discount_code_id,
      approverUserId: user.id,
      approverEmail: user.email ?? null,
      reason: body.reason ?? null,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Comp clear failed." },
      { status: 400 },
    );
  }
}
