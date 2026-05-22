import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  if (!dealId) {
    return NextResponse.json({ error: "deal_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("deals")
    .select("payment_status, status")
    .eq("deal_id", dealId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { payment_status: data.payment_status, status: data.status },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
