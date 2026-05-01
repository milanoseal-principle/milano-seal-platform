import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { document_id, country, event_type, session_id } = await req.json();
    if (!document_id) return NextResponse.json({ ok: false });

    const supabase = createAdminClient();
    await supabase.from("document_intel_events").insert({
      document_id: String(document_id).slice(0, 100),
      country: country ? String(country).slice(0, 100) : null,
      event_type: event_type ? String(event_type).slice(0, 50) : "view",
      session_id: session_id ? String(session_id).slice(0, 100) : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("document_intel_events")
      .select("document_id, country, event_type, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}
