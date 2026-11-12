import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { sendWhatsApp } from "@/lib/whatsapp";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveDealUuid(id: string): Promise<{
  uuid: string;
  phone: string | null;
  client_name: string | null;
} | null> {
  const admin = createAdminClient();
  const isUuid = UUID_RE.test(id);
  const { data } = await admin
    .from("deals")
    .select("id, phone, client_name")
    .eq(isUuid ? "id" : "deal_id", id)
    .single();
  if (!data) return null;
  return {
    uuid: data.id as string,
    phone: (data.phone as string | null) ?? null,
    client_name: (data.client_name as string | null) ?? null,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  const { id } = await params;
  const deal = await resolveDealUuid(id);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("deal_id", deal.uuid)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  const { id } = await params;
  const deal = await resolveDealUuid(id);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  let body: { content?: string };
  try {
    body = (await req.json()) as { content?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = (body.content ?? "").trim();
  if (!content) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json(
      { error: "Message exceeds 2000 characters" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: message, error } = await admin
    .from("messages")
    .insert({
      deal_id: deal.uuid,
      direction: "outbound",
      channel: "portal",
      content,
      status: "sent",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (deal.phone) {
    await sendWhatsApp(
      deal.phone,
      `Milano Seal — Message from your coordinator:\n\n${content}`,
    ).catch(() => {});
  }

  return NextResponse.json({ message });
}
