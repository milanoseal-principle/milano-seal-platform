import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json() as { code?: string };
    const code = (body.code ?? "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Discount code is required." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Load the deal
    const { data: deal, error: dealErr } = await admin
      .from("deals")
      .select("id, deal_id, payment_status, payment_amount_due, amount_due, discount_code_id")
      .eq("id", id)
      .maybeSingle();

    if (dealErr || !deal) {
      return NextResponse.json({ error: "Matter not found." }, { status: 404 });
    }

    // Payment gate — cannot apply discount after payment confirmed
    if (deal.payment_status === "paid" || deal.payment_status === "confirmed") {
      return NextResponse.json(
        { error: "Discount codes cannot be applied after payment is confirmed." },
        { status: 409 },
      );
    }

    // Load discount code
    const { data: discountCode, error: codeErr } = await admin
      .from("discount_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (codeErr || !discountCode) {
      return NextResponse.json({ error: "Discount code not found." }, { status: 404 });
    }

    // Validate status
    if (discountCode.status !== "ACTIVE") {
      const msg =
        discountCode.status === "EXPIRED" ? "This discount code has expired." :
        discountCode.status === "REVOKED" ? "This discount code has been revoked." :
        "This discount code is not active.";
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    // Validate expiration
    if (discountCode.expiration_date && new Date(discountCode.expiration_date) < new Date()) {
      return NextResponse.json({ error: "This discount code has expired." }, { status: 409 });
    }

    // Validate usage limit
    if (
      discountCode.usage_limit !== null &&
      discountCode.usage_count >= discountCode.usage_limit
    ) {
      return NextResponse.json(
        { error: "This discount code has reached its maximum usage." },
        { status: 409 },
      );
    }

    // Validate matter restriction
    if (discountCode.matter_id && discountCode.matter_id !== id) {
      return NextResponse.json(
        { error: "This code is restricted to a specific matter." },
        { status: 409 },
      );
    }

    // Compute amounts — server-side only
    const originalAmount = Number(deal.payment_amount_due ?? deal.amount_due ?? 0);
    if (originalAmount <= 0) {
      return NextResponse.json(
        { error: "Cannot apply a discount to a matter with no amount due." },
        { status: 409 },
      );
    }

    let discountAmount = 0;
    if (discountCode.discount_type === "percentage") {
      discountAmount = Math.round((originalAmount * Number(discountCode.discount_value)) / 100 * 100) / 100;
    } else {
      // fixed_amount
      discountAmount = Math.min(Number(discountCode.discount_value), originalAmount);
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    // Update deal with discount info
    const { error: updateErr } = await admin
      .from("deals")
      .update({
        discount_code_id: discountCode.id,
        payment_amount_due: finalAmount,
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[apply-discount] deal update error:", updateErr);
      return NextResponse.json({ error: "Failed to apply discount." }, { status: 500 });
    }

    // Record redemption
    const user = await requireAuth();
    await admin.from("discount_redemptions").insert({
      discount_code_id: discountCode.id,
      code: discountCode.code,
      matter_id: id,
      client_id: user?.id ?? null,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
    });

    // Increment usage count
    await admin
      .from("discount_codes")
      .update({ usage_count: (discountCode.usage_count ?? 0) + 1 })
      .eq("id", discountCode.id);

    // Audit log
    await admin.from("discount_audit_log").insert({
      discount_code_id: discountCode.id,
      action: "DISCOUNT_APPLIED",
      actor_id: user?.id ?? null,
      matter_id: id,
      internal_reason: `Code ${code} applied to matter ${deal.deal_id ?? id}`,
      metadata: {
        original_amount: originalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        discount_type: discountCode.discount_type,
        discount_value: discountCode.discount_value,
      },
    });

    // Event ledger
    await logActivity({
      deal_id: deal.deal_id ?? id,
      actor: user?.email ?? "client",
      action: "DISCOUNT_APPLIED",
      detail: `Discount code ${code} applied · ${
        discountCode.discount_type === "percentage"
          ? `${discountCode.discount_value}% off`
          : `$${discountAmount} off`
      } · original $${originalAmount} → final $${finalAmount}`,
      meta: {
        code,
        discount_type: discountCode.discount_type,
        discount_value: discountCode.discount_value,
        discount_amount: discountAmount,
        original_amount: originalAmount,
        final_amount: finalAmount,
        client_label: discountCode.client_label,
      },
    });

    return NextResponse.json({
      ok: true,
      code: discountCode.code,
      client_label: discountCode.client_label,
      discount_type: discountCode.discount_type,
      discount_value: Number(discountCode.discount_value),
      discount_amount: discountAmount,
      original_amount: originalAmount,
      final_amount: finalAmount,
    });
  } catch (err) {
    console.error("[apply-discount] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data: deal } = await admin
      .from("deals")
      .select("id, deal_id, payment_status, discount_code_id, amount_due")
      .eq("id", id)
      .maybeSingle();

    if (!deal) return NextResponse.json({ error: "Matter not found." }, { status: 404 });

    if (deal.payment_status === "paid" || deal.payment_status === "confirmed") {
      return NextResponse.json(
        { error: "Discount cannot be removed after payment is confirmed." },
        { status: 409 },
      );
    }

    // Restore original amount_due and clear discount
    const { data: redemption } = await admin
      .from("discount_redemptions")
      .select("original_amount")
      .eq("matter_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const originalAmount = Number(redemption?.original_amount ?? deal.amount_due ?? 0);

    await admin
      .from("deals")
      .update({ discount_code_id: null, payment_amount_due: originalAmount })
      .eq("id", id);

    const user = await requireAuth();
    await logActivity({
      deal_id: deal.deal_id ?? id,
      actor: user?.email ?? "operator",
      action: "DISCOUNT_REMOVED",
      detail: `Discount code removed from matter. Amount restored to $${originalAmount}.`,
      meta: { original_amount: originalAmount },
    });

    return NextResponse.json({ ok: true, restored_amount: originalAmount });
  } catch (err) {
    console.error("[remove-discount] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
import { NextResponse } from "next/server";
import { applyDiscountToMatter, removeDiscountFromMatter } from "@/src/features/discounts/discountService";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { code?: string; actorEmail?: string };
    if (!body.code) return NextResponse.json({ error: "Discount code is required." }, { status: 400 });
    const matter = await applyDiscountToMatter(id, body.code, body.actorEmail);
    return NextResponse.json({ matter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Discount failed." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actorEmail = request.headers.get("x-actor-email");
    const matter = await removeDiscountFromMatter(id, actorEmail);
    return NextResponse.json({ matter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Discount removal failed." }, { status: 400 });
  }
}
