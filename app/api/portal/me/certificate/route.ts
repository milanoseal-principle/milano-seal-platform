import { NextRequest, NextResponse } from "next/server";
import { getAllClientDeals } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Portal certificate lookup — returns verification_id and public URL only.
// Never returns matter_id internals, client PII, or pricing.
export async function GET(req: NextRequest) {
  const ctx = await getAllClientDeals();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ctx.deals.length) {
    return NextResponse.json({ certificate: null });
  }

  const dealId = req.nextUrl.searchParams.get("deal_id");
  const deal = (dealId ? ctx.deals.find((d) => d.id === dealId) : null) ?? ctx.deals[0];

  if (!deal) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  // Only return certificate if matter is paid and released
  if (!deal.is_paid_and_released) {
    return NextResponse.json({ certificate: null, reason: "NOT_RELEASED" });
  }

  const supabase = createAdminClient();

  const { data: record } = await supabase
    .from("verification_records")
    .select("verification_id, custody_ledger_hash, released_at, public_summary")
    .eq("matter_id", deal.id)
    .eq("release_status", "VALID")
    .single();

  if (!record) {
    return NextResponse.json({ certificate: null, reason: "NOT_GENERATED" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.milanoseal.com";

  return NextResponse.json({
    certificate: {
      verification_id: record.verification_id,
      verification_url: `${baseUrl}/verify/${record.verification_id}`,
      custody_hash: record.custody_ledger_hash,
      released_at: record.released_at,
      public_summary: record.public_summary,
    },
  });
}
