import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("notary_credentials")
      .select("*")
      .order("matters_completed", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ credentials: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
