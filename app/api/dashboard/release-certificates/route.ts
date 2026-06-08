import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

const SAFE_FIELDS =
  "id,verification_hash,display_id,release_date,document_count,custody_status,release_method,created_at";

const WRITE_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function GET(_req: NextRequest) {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("release_certificates")
    .select(SAFE_FIELDS)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { certificates: [], error: "Failed to load certificates" },
      { status: 500 }
    );
  }

  return NextResponse.json({ certificates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { role } = await requireDashboardAccess();
  if (!WRITE_ROLES.has(role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = (await req.json()) as {
    matter_id?: string;
    display_id?: string;
    document_count?: number;
    release_method?: string;
    released_by?: string;
  };

  const { matter_id, display_id, document_count, release_method, released_by } = body;

  if (!matter_id || !display_id) {
    return NextResponse.json(
      { error: "matter_id and display_id are required" },
      { status: 400 }
    );
  }

  // Generate a verification hash from matter_id + timestamp
  const rawHash = `${matter_id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(rawHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const verification_hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const supabase = createAdminClient();
  const { data: cert, error } = await supabase
    .from("release_certificates")
    .insert({
      verification_hash,
      matter_id,
      display_id,
      release_date: new Date().toISOString(),
      document_count: document_count ?? null,
      custody_status: "valid",
      release_method: release_method ?? null,
      released_by: released_by ?? null,
    })
    .select(SAFE_FIELDS)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create release certificate" },
      { status: 500 }
    );
  }

  return NextResponse.json({ certificate: cert }, { status: 201 });
}
