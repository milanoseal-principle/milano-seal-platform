import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  if (!dealId)
    return NextResponse.json({ error: "Missing deal_id" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ files: files || [] });
}
