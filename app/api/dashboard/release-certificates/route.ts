import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { releaseCertificateEligibility } from "@/lib/release/certificateEligibility";

export const runtime = "nodejs";

// Real columns (repository and hosted agree); display_id is the Matter's deals.deal_id.
const SAFE_FIELDS =
  "id,deal_id,verification_id,verification_hash,release_date,document_count,status,public_summary,created_at";

type CertificateRow = { deal_id: string | null; status: string | null } & Record<string, unknown>;
async function withDisplayIds(supabase: ReturnType<typeof createAdminClient>, rows: CertificateRow[]) {
  const ids = [...new Set(rows.map((r) => r.deal_id).filter((id): id is string => Boolean(id)))];
  const refs = new Map<string, string>();
  if (ids.length) {
    const { data } = await supabase.from("deals").select("id, deal_id").in("id", ids);
    for (const d of data ?? []) refs.set(d.id as string, d.deal_id as string);
  }
  return rows.map((r) => ({ ...r, display_id: r.deal_id ? refs.get(r.deal_id) ?? null : null, custody_status: r.status }));
}

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

  return NextResponse.json({ certificates: await withDisplayIds(supabase, (data ?? []) as CertificateRow[]) });
}

export async function POST(req: NextRequest) {
  const { role, userId } = await requireDashboardAccess();
  if (!WRITE_ROLES.has(role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = (await req.json()) as {
    matter_id?: string;
    document_count?: number;
    release_method?: string;
  };

  const { matter_id, document_count, release_method } = body;

  if (!matter_id) {
    return NextResponse.json(
      { error: "matter_id is required" },
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
  // Never attest a release the canonical authorities have not recorded.
  const eligibility = await releaseCertificateEligibility(supabase, matter_id);
  if (!eligibility.ok) {
    return NextResponse.json({ error: eligibility.error, gate: eligibility.gate }, { status: eligibility.status });
  }
  const { data: cert, error } = await supabase
    .from("release_certificates")
    .insert({
      deal_id: matter_id,
      verification_id: `MSV-${verification_hash.slice(0, 16).toUpperCase()}`,
      verification_hash,
      release_date: eligibility.releasedAt,
      document_count: document_count ?? 0,
      status: "valid",
      // Issuer is the verified operator session, never a client-supplied value.
      issued_by: userId,
      public_summary: release_method ? `Released via ${release_method}` : null,
    })
    .select(SAFE_FIELDS)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create release certificate" },
      { status: 500 }
    );
  }

  const [certificate] = await withDisplayIds(supabase, [cert as unknown as CertificateRow]);
  return NextResponse.json({ certificate }, { status: 201 });
}
