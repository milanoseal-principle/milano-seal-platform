import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serializeActivityMS } from "@/lib/milanoSerialize";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin/activity]", error.message);
    return NextResponse.json([]);
  }

  return NextResponse.json((data ?? []).map(serializeActivityMS));
}
