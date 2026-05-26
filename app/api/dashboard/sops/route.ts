import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["admin", "ops_manager"]);

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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { data: sops, error } = await admin
      .from("sops")
      .select(
        "id, title, category, role_scope, status, version, owner_id, created_at, updated_at, published_at"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json({ sops: [], migration_needed: true });
      }
      throw error;
    }

    return NextResponse.json({ sops: sops ?? [] });
  } catch {
    return NextResponse.json({ sops: [], migration_needed: true });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    title?: string;
    category?: string;
    role_scope?: string[];
    body_markdown?: string;
    checklist_json?: unknown;
    status?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, category, role_scope, body_markdown, checklist_json, status } =
    body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return NextResponse.json(
      { error: "title is required and must be non-empty" },
      { status: 400 }
    );
  }

  if (!category || !ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: "category must be one of the allowed values" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: sop, error: insertError } = await admin
      .from("sops")
      .insert({
        title: title.trim(),
        category,
        role_scope: Array.isArray(role_scope) ? role_scope : [],
        body_markdown: body_markdown ?? null,
        checklist_json: checklist_json ?? null,
        status: status ?? "draft",
        version: 1,
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      if (
        insertError.message?.includes("does not exist") ||
        insertError.code === "42P01"
      ) {
        return NextResponse.json({ migration_needed: true }, { status: 503 });
      }
      throw insertError;
    }

    await admin.from("sop_versions").insert({
      sop_id: sop.id,
      version: 1,
      body_markdown: body_markdown ?? null,
      checklist_json: checklist_json ?? null,
      changed_by: user.id,
      change_note: "Initial version",
    });

    return NextResponse.json({ sop_id: sop.id, success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
