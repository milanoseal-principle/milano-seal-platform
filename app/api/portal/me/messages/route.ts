import { NextRequest, NextResponse } from "next/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdminAlert } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  const ctx = await getCurrentClientDeal(dealId);
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deal) return NextResponse.json({ messages: [] });

  const admin = createAdminClient();
  const { data } = await admin
    .from("messages")
    .select("id, deal_id, content, sender_role, sender_name, direction, channel, created_at")
    .eq("deal_id", ctx.deal.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  const ctx = await getCurrentClientDeal(dealId);
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deal) {
    return NextResponse.json(
      { error: "No matter linked to this account" },
      { status: 404 },
    );
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
  const { data, error } = await admin
    .from("messages")
    .insert({
      deal_id: ctx.deal.id,
      direction: "inbound",
      channel: "portal",
      content,
      status: "received",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to send message", details: error.message },
      { status: 500 },
    );
  }

  await sendAdminAlert(
    `Client message · ${ctx.deal.client_name ?? ctx.email}: ${content.slice(0, 240)}`,
  );

  return NextResponse.json({ message: data });
}
