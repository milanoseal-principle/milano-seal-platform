import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function resolvePartner(): Promise<{ partnerId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role =
    (user.app_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined) ??
    "";

  const allowed = ["founder_admin", "alliance", "alliance_partner", "alliance_member"];
  if (!allowed.includes(role)) return null;

  const admin = createAdminClient();
  const { data: partner } = await admin
    .from("alliance_partners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!partner) return null;
  return { partnerId: partner.id };
}

// GET /api/alliance/messages — fetch messages for current partner
export async function GET() {
  const session = await resolvePartner();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: messages, error } = await admin
    .from("partner_messages")
    .select("id, from_role, content, read, created_at")
    .eq("partner_id", session.partnerId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }

  // Map from_role → from for the client
  const safe = (messages ?? []).map((m) => ({
    id: m.id,
    from: m.from_role as "partner" | "milano_seal",
    content: m.content,
    created_at: m.created_at,
    read: m.read,
  }));

  return NextResponse.json({ messages: safe });
}

// POST /api/alliance/messages — send a message
export async function POST(req: NextRequest) {
  const session = await resolvePartner();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = (body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  if (content.length > 1000) {
    return NextResponse.json(
      { error: "Message exceeds 1000 character limit" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from("partner_messages")
    .insert({
      partner_id: session.partnerId,
      from_role: "partner",
      content,
      read: false,
    })
    .select("id, from_role, content, read, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({
    message: {
      id: inserted.id,
      from: inserted.from_role,
      content: inserted.content,
      created_at: inserted.created_at,
      read: inserted.read,
    },
  });
}
