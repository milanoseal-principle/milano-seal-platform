import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";
import { NextResponse } from "next/server";
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
  const partner = await resolveAlliancePartner(user.id);

  if (!partner) return null;
  return { partnerId: partner.id };
}

// GET /api/alliance/documents — fetch shared documents for current partner
export async function GET() {
  const session = await resolvePartner();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("partner_document_shares")
    // Explicitly exclude storage_path, shared_by (internal), expires_at (internal)
    .select("id, document_name, document_type, download_url, shared_at")
    .eq("partner_id", session.partnerId)
    .order("shared_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }

  // Filter out expired documents
  const now = new Date();
  const documents = (rows ?? [])
    .map((d) => ({
      id: d.id,
      document_name: d.document_name,
      document_type: d.document_type ?? undefined,
      download_url: d.download_url ?? undefined,
      shared_at: d.shared_at,
      // Never return storage_path, raw_event, signing_url, or internal fields
    }));

  return NextResponse.json({ documents });
}
