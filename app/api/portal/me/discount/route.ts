import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { buildClientInvoiceSnapshot } from "@/lib/portalInvoice";
import { applyDiscountToMatter } from "@/src/features/discounts/discountService";

export const runtime = "nodejs";

function normalizeCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export async function POST(req: NextRequest) {
  const server = await createClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    code?: unknown;
    deal_id?: unknown;
  };
  const code = normalizeCode(body.code);
  const dealId = typeof body.deal_id === "string" ? body.deal_id : null;
  if (!code) {
    return NextResponse.json({ error: "Enter a valid discount code." }, { status: 400 });
  }

  const clientCtx = await getCurrentClientDeal(dealId);
  if (!clientCtx?.deal) {
    return NextResponse.json({ error: "Matter not found." }, { status: 404 });
  }

  const existingCode = normalizeCode(clientCtx.deal.discount_code);
  if (existingCode && existingCode !== code) {
    return NextResponse.json(
      { error: "A discount has already been applied to this Matter." },
      { status: 409 },
    );
  }

  try {
    const admin = createAdminClient();
    const { data: paymentGuard, error: paymentGuardError } = await admin
      .from("deals")
      .select("payment_status,payment_confirmed,payment_observed_at")
      .eq("id", clientCtx.deal.id)
      .single();
    if (paymentGuardError || !paymentGuard) {
      throw paymentGuardError ?? new Error("Matter payment state is unavailable.");
    }
    if (
      paymentGuard.payment_observed_at ||
      paymentGuard.payment_confirmed ||
      ["paid", "deposit_paid", "payment_confirmed"].includes(String(paymentGuard.payment_status ?? ""))
    ) {
      return NextResponse.json(
        { error: "Discount cannot change after Wise payment has been submitted." },
        { status: 409 },
      );
    }

    let updated: Record<string, unknown> | null = null;

    if (existingCode === code) {
      const { data, error } = await admin
        .from("deals")
        .select("*")
        .eq("id", clientCtx.deal.id)
        .single();
      if (error || !data) throw error ?? new Error("Matter pricing is unavailable.");
      updated = data as Record<string, unknown>;
    } else {
      updated = (await applyDiscountToMatter(
        clientCtx.deal.id,
        code,
        user.email,
      )) as Record<string, unknown>;
    }

    return NextResponse.json({
      success: true,
      invoice: buildClientInvoiceSnapshot(updated),
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Discount could not be applied.";
    const status = /payment|already|review|required/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
