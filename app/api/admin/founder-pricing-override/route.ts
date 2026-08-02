import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const role = user.app_metadata?.role ?? user.app_metadata?.role;
  if (role !== "founder_admin") {
    return NextResponse.json(
      { success: false, code: "FOUNDER_ONLY_PRICING_CONTROL" },
      { status: 403 }
    );
  }

  let body: {
    dealId?: string;
    finalClientPrice?: number;
    discountType?: string;
    discountAmount?: number;
    discountReason?: string;
    discountNote?: string;
    platformFeeRequired?: number;
    serviceFeeWaived?: boolean;
    lockOverride?: boolean;
    unlockOverride?: boolean;
    clearOverride?: boolean;
    adjustAfterPaymentConfirmed?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const { dealId } = body;
  if (!dealId) {
    return NextResponse.json(
      { success: false, code: "MISSING_DEAL_ID" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const actorEmail = user.email ?? user.id;
  const now = new Date().toISOString();

  // --- CLEAR OVERRIDE ---
  if (body.clearOverride) {
    const { error } = await admin
      .from("deals")
      .update({
        discount_type: null,
        discount_amount: 0,
        discount_reason: null,
        discount_note: null,
        discount_applied_by: actorEmail,
        discount_applied_at: now,
        founder_price_override: null,
        platform_fee_required: null,
        service_fee_waived: false,
        price_override_locked: false,
      })
      .eq("id", dealId);

    if (error) {
      console.error("[founder-pricing-override] clear failed:", error.message);
      return NextResponse.json(
        { success: false, code: "DISCOUNT_UPDATE_FAILED" },
        { status: 500 }
      );
    }

    await logActivity({
      deal_id: dealId,
      actor: actorEmail,
      action: "founder_pricing_override_cleared",
      detail: "Founder pricing override cleared.",
      meta: { actor: actorEmail, timestamp: now },
    });

    return NextResponse.json({ success: true });
  }

  // --- UNLOCK OVERRIDE ---
  if (body.unlockOverride) {
    const { error } = await admin
      .from("deals")
      .update({ price_override_locked: false })
      .eq("id", dealId);

    if (error) {
      console.error("[founder-pricing-override] unlock failed:", error.message);
      return NextResponse.json(
        { success: false, code: "DISCOUNT_UPDATE_FAILED" },
        { status: 500 }
      );
    }

    await logActivity({
      deal_id: dealId,
      actor: actorEmail,
      action: "founder_pricing_override_unlocked",
      detail: "Founder pricing override unlocked.",
      meta: { actor: actorEmail, timestamp: now },
    });

    return NextResponse.json({ success: true });
  }

  // --- LOCK OVERRIDE ---
  if (body.lockOverride) {
    const { error } = await admin
      .from("deals")
      .update({ price_override_locked: true })
      .eq("id", dealId);

    if (error) {
      console.error("[founder-pricing-override] lock failed:", error.message);
      return NextResponse.json(
        { success: false, code: "DISCOUNT_UPDATE_FAILED" },
        { status: 500 }
      );
    }

    await logActivity({
      deal_id: dealId,
      actor: actorEmail,
      action: "founder_pricing_override_locked",
      detail: "Founder pricing override locked.",
      meta: { actor: actorEmail, timestamp: now },
    });

    return NextResponse.json({ success: true });
  }

  // --- DEFAULT: APPLY OVERRIDE ---
  const updatePayload: Record<string, unknown> = {
    discount_applied_by: actorEmail,
    discount_applied_at: now,
  };

  if (body.finalClientPrice !== undefined) {
    updatePayload.founder_price_override = body.finalClientPrice;
  }
  if (body.discountType !== undefined) {
    updatePayload.discount_type = body.discountType;
  }
  if (body.discountAmount !== undefined) {
    updatePayload.discount_amount = body.discountAmount;
  }
  if (body.discountReason !== undefined) {
    updatePayload.discount_reason = body.discountReason;
  }
  if (body.discountNote !== undefined) {
    updatePayload.discount_note = body.discountNote;
  }
  if (body.platformFeeRequired !== undefined) {
    updatePayload.platform_fee_required = body.platformFeeRequired;
  }
  if (body.serviceFeeWaived !== undefined) {
    updatePayload.service_fee_waived = body.serviceFeeWaived;
  }

  const { error } = await admin
    .from("deals")
    .update(updatePayload)
    .eq("id", dealId);

  if (error) {
    console.error("[founder-pricing-override] apply failed:", error.message);
    return NextResponse.json(
      { success: false, code: "DISCOUNT_UPDATE_FAILED" },
      { status: 500 }
    );
  }

  await logActivity({
    deal_id: dealId,
    actor: actorEmail,
    action: "founder_pricing_override",
    detail: `Founder pricing override applied. Type: ${body.discountType ?? "unset"}. Final price: ${body.finalClientPrice ?? "unchanged"}.`,
    meta: {
      actor: actorEmail,
      timestamp: now,
      discount_type: body.discountType,
      final_client_price: body.finalClientPrice,
      platform_fee_required: body.platformFeeRequired,
      service_fee_waived: body.serviceFeeWaived,
      adjust_after_payment_confirmed: body.adjustAfterPaymentConfirmed ?? false,
    },
  });

  return NextResponse.json({ success: true });
}
