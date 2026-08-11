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

export async function GET() {
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

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("va_message_drafts")
      .select("id, matter_id, draft_type, subject, body, status, created_at, updated_at")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false });

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      return NextResponse.json({ drafts: [], migration_needed: true });
    }

    const drafts = (data ?? []).map((row) => projectDraft(row as Record<string, unknown>));
    return NextResponse.json({ drafts });
  } catch {
    return NextResponse.json({ drafts: [], migration_needed: true });
  }
}

export async function POST(req: Request) {
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

  let body: { matter_id?: string; draft_type?: string; subject?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { matter_id, draft_type, subject, body: draftBody } = body;

  if (!subject || !draftBody) {
    return NextResponse.json({ error: "subject and body are required" }, { status: 400 });
  }

  if (draft_type && draft_type !== "client" && draft_type !== "partner") {
    return NextResponse.json({ error: "draft_type must be client or partner" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("va_message_drafts")
      .insert({
        matter_id: matter_id ?? null,
        draft_type: draft_type ?? "client",
        subject,
        body: draftBody,
        status: "draft", // VA drafts always start as draft — only operator can approve
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, matter_id, draft_type, subject, body, status, created_at, updated_at")
      .single();

    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      return NextResponse.json({ error: "Table not found", migration_needed: true }, { status: 503 });
    }

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
    }

    return NextResponse.json({ draft: projectDraft(data as Record<string, unknown>) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
  }
}
