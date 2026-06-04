import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["founder_admin", "admin", "admin_operator", "ops_manager"]);

async function requireFounderAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined) ??
    "";
  if (role !== "founder_admin") return null;
  return { user, role };
}

async function requireDashboardRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined) ??
    "";
  if (!ADMIN_ROLES.has(role)) return null;
  return { user, role };
}

const PUBLIC_FIELDS = [
  "id",
  "country_name",
  "country_code",
  "hague_member",
  "apostille_authority",
  "processing_time_days",
  "notes_public",
  "source_url",
  "source_type",
  "confidence_level",
  "last_verified_at",
  "verified_by",
  "stale_after_days",
  "manual_review_required",
  "routing_status",
] as const;

export async function GET() {
  const auth = await requireDashboardRead();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from("country_registry")
      .select(PUBLIC_FIELDS.join(", "))
      .order("country_name", { ascending: true });

    if (error) {
      const isTableMissing =
        error.message?.includes("does not exist") || error.code === "42P01";
      if (isTableMissing) {
        return NextResponse.json({ countries: [], governance_columns_missing: true });
      }
      // If governance columns missing (column does not exist error), return base fields only
      if (error.message?.includes("column") && error.message?.includes("does not exist")) {
        const { data: baseData, error: baseError } = await supabase
          .from("country_registry")
          .select("id, country_name, country_code, hague_member, apostille_authority, processing_time_days, notes_public")
          .order("country_name", { ascending: true });
        if (baseError) {
          return NextResponse.json({ error: baseError.message }, { status: 500 });
        }
        return NextResponse.json({ countries: baseData ?? [], governance_columns_missing: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ countries: data ?? [], governance_columns_missing: false });
  } catch {
    return NextResponse.json({ error: "Failed to load Atlas data" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireFounderAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized — founder_admin only" }, { status: 401 });
  }

  let body: {
    id?: string;
    source_url?: string;
    confidence_level?: string;
    routing_status?: string;
    last_verified_at?: string;
    manual_review_required?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Whitelist updatable fields
  const allowed = ["source_url", "confidence_level", "routing_status", "last_verified_at", "manual_review_required"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) {
      patch[key] = (updates as Record<string, unknown>)[key];
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from("country_registry")
      .update(patch)
      .eq("id", id)
      .select(PUBLIC_FIELDS.join(", "))
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ country: data });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
