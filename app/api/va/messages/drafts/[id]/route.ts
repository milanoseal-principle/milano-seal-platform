import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";
import type { VAMessageDraft } from "@/lib/va/vaTaskTypes";

export const dynamic = "force-dynamic";

function projectDraft(raw: Record<string, unknown>): VAMessageDraft {
  return {
    id: String(raw.id ?? ""),
    matter_id: (raw.matter_id as string) ?? null,
    draft_type: (raw.draft_type as "client" | "partner") ?? "client",
    subject: String(raw.subject ?? ""),
    body: String(raw.body ?? ""),
    status: (raw.status as VAMessageDraft["status"]) ?? "draft",
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? raw.created_at ?? ""),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!isVARole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("va_message_drafts")
      .select("id, matter_id, draft_type, subject, body, status, created_at, updated_at")
      .eq("id", id)
      .eq("created_by", user.id)
      .maybeSingle();

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ draft: projectDraft(data as Record<string, unknown>) });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!isVARole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: { subject?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // VA can only update subject and body — never status
  const updates: Record<string, string> = {};
  if (typeof body.subject === "string") updates.subject = body.subject;
  if (typeof body.body === "string") updates.body = body.body;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  try {
    const admin = createAdminClient();

    // Verify ownership
    const { data: existing } = await admin
      .from("va_message_drafts")
      .select("id, status")
      .eq("id", id)
      .eq("created_by", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await admin
      .from("va_message_drafts")
      .update(updates)
      .eq("id", id)
      .select("id, matter_id, draft_type, subject, body, status, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
    }

    return NextResponse.json({ draft: projectDraft(data as Record<string, unknown>) });
  } catch {
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}
