import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseCertificateEligibility } from "@/lib/release/certificateEligibility";
import { generateCustodyHash, generateVerificationId, generatePublicSummary } from "@/lib/custody/hash";

export async function POST(req: NextRequest) {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { matter_id, document_count, destination_country, document_type, released_at, generated_by } = body;

    if (!matter_id || !released_at) {
      return NextResponse.json({ error: "matter_id and released_at are required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Canonical gate: verified settlement plus the recorded exact release (shared helper).
    const eligibility = await releaseCertificateEligibility(supabase, matter_id);
    if (!eligibility.ok) {
      return NextResponse.json(
        {
          error: eligibility.status === 404 ? eligibility.error : "Certificate cannot be generated until matter is paid and released.",
          gate: eligibility.status === 404 ? eligibility.gate : "PAYMENT_AND_RELEASE_REQUIRED",
          reason: eligibility.gate,
        },
        { status: eligibility.status }
      );
    }

    // Check if certificate already exists
    const { data: existing } = await supabase
      .from("verification_records")
      .select("verification_id, custody_ledger_hash")
      .eq("matter_id", matter_id)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        already_exists: true,
        verification_id: existing.verification_id,
        custody_hash: existing.custody_ledger_hash,
      });
    }

    const count = document_count ?? 1;
    const releasedAt = released_at ?? new Date().toISOString();

    const hash = generateCustodyHash({
      matter_id,
      released_at: releasedAt,
      document_count: count,
      destination_country: destination_country ?? null,
      document_type: document_type ?? null,
    });

    const verificationId = generateVerificationId(matter_id);
    const publicSummary = generatePublicSummary(count, destination_country ?? null, document_type ?? null);

    const { data: record, error: insertError } = await supabase
      .from("verification_records")
      .insert({
        verification_id: verificationId,
        matter_id,
        custody_ledger_hash: hash,
        document_count: count,
        destination_country: destination_country ?? null,
        document_type: document_type ?? null,
        release_status: "VALID",
        released_at: releasedAt,
        generated_by: generated_by ?? "operator",
        public_summary: publicSummary,
      })
      .select("verification_id, custody_ledger_hash")
      .single();

    if (insertError || !record) {
      return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      verification_id: record.verification_id,
      custody_hash: record.custody_ledger_hash,
      verification_url: `/verify/${record.verification_id}`,
    });
  } catch {
    return NextResponse.json({ error: "Certificate generation failed" }, { status: 500 });
  }
}
