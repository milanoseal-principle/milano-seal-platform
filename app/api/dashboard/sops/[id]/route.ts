import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["founder_admin", "admin_operator"]);

const ALLOWED_CATEGORIES = new Set([
  "Intake",
  "Payment",
  "Scheduling",
  "RON",
  "Apostille",
  "Translation",
  "Courier",
  "Client Communication",
  "VA Tasks",
  "Alliance Dispatch",
  "Release Authorization",
]);

export async function GET(
  _req: NextRequest,
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

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const admin = createAdminClient();
    const { data: sop, error } = await admin
      .from("sops")
      .select(
        "id, title, category, role_scope, status, version, owner_id, body_markdown, checklist_json, created_at, updated_at, published_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json({ migration_needed: true }, { status: 503 });
      }
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      throw error;
    }

    if (!sop) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ sop });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
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

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    title?: string;
    category?: string;
    role_scope?: string[];
    body_markdown?: string;
    checklist_json?: unknown;
    status?: string;
    change_note?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.category && !ALLOWED_CATEGORIES.has(body.category)) {
    return NextResponse.json(
      { error: "category must be one of the allowed values" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    // Fetch current sop to get current version and status
    const { data: current, error: fetchError } = await admin
      .from("sops")
      .select("id, version, status")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (
        fetchError.message?.includes("does not exist") ||
        fetchError.code === "42P01"
      ) {
        return NextResponse.json({ migration_needed: true }, { status: 503 });
      }
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      throw fetchError;
    }

    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const newVersion = current.version + 1;
    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      version: newVersion,
      updated_at: now,
    };

    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.role_scope !== undefined) updatePayload.role_scope = body.role_scope;
    if (body.body_markdown !== undefined)
      updatePayload.body_markdown = body.body_markdown;
    if (body.checklist_json !== undefined)
      updatePayload.checklist_json = body.checklist_json;
    if (body.status !== undefined) {
      updatePayload.status = body.status;
      // Set published_at when transitioning to published
      if (body.status === "published" && current.status !== "published") {
        updatePayload.published_at = now;
      }
    }

    const { error: updateError } = await admin
      .from("sops")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) throw updateError;

    await admin.from("sop_versions").insert({
      sop_id: id,
      version: newVersion,
      body_markdown: body.body_markdown ?? null,
      checklist_json: body.checklist_json ?? null,
      changed_by: user.id,
      change_note: body.change_note ?? null,
    });

    return NextResponse.json({ success: true, version: newVersion });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
