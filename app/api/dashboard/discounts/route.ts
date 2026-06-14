import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCourtesyCode, validateCodeRedeemable, computeDiscountAmount } from "@/lib/discountCodes";

function isFounder(req: NextRequest): boolean {
  const role = req.headers.get("x-ms-role");
  return role === "founder" || role === "admin";
}

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const deal_id = searchParams.get("deal_id");

    if (code) {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (error || !data) {
        return NextResponse.json({ valid: false, error: "Code not found" });
      }

      const check = validateCodeRedeemable(data, deal_id ?? undefined);
      if (!check.ok) return NextResponse.json({ valid: false, error: check.error });

      return NextResponse.json({ valid: true, code: data });
    }

    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ codes: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isFounder(req)) {
    return NextResponse.json({ error: "Founder access required" }, { status: 403 });
  }
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const { label, discount_type, discount_value, max_uses, valid_until,
            notes, deal_id_restriction, single_use, custom_code } = body;

    const code = (custom_code ?? generateCourtesyCode()).toUpperCase();

    const { data, error } = await supabase
      .from("discount_codes")
      .insert({
        code,
        label,
        discount_type,
        discount_value: discount_value ?? 0,
        max_uses: max_uses ?? null,
        valid_until: valid_until ?? null,
        notes,
        deal_id_restriction: deal_id_restriction ?? null,
        single_use: single_use ?? false,
        created_by: "founder",
        active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ code: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const { code, deal_id, original_amount, redeemed_by } = body;

    const { data: codeRecord, error: fetchErr } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (fetchErr || !codeRecord) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    const check = validateCodeRedeemable(codeRecord, deal_id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

    const discount_amount = computeDiscountAmount(codeRecord, original_amount ?? 0);
    const final_amount = Math.max(0, (original_amount ?? 0) - discount_amount);

    await supabase
      .from("discount_codes")
      .update({ uses_count: codeRecord.uses_count + 1 })
      .eq("id", codeRecord.id);

    const { data: redemption } = await supabase
      .from("discount_redemptions")
      .insert({ code_id: codeRecord.id, deal_id, redeemed_by, discount_applied: discount_amount, original_amount, final_amount })
      .select()
      .single();

    return NextResponse.json({ redemption, discount_amount, final_amount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isFounder(req)) {
    return NextResponse.json({ error: "Founder access required" }, { status: 403 });
  }
  const supabase = createAdminClient();
  try {
    const { id } = await req.json();
    await supabase.from("discount_codes").update({ active: false }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
