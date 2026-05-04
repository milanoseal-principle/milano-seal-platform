import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    let dealId = id;
    if (isUuid) {
      const { data: deal } = await supabase
        .from("deals")
        .select("deal_id")
        .eq("id", id)
        .single();
      if (!deal?.deal_id) {
        return NextResponse.json({ activity: [] });
      }
      dealId = deal.deal_id;
    }

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[activity] read failed:", error.message);
      return NextResponse.json({ activity: [], error: error.message });
    }

    return NextResponse.json({ activity: data ?? [] });
  } catch (err) {
    console.error("[activity] route error:", err);
    return NextResponse.json({ activity: [] });
  }
}
