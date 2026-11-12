import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public endpoint — no auth required.
// Returns only public-safe fields. Never returns PII, pricing, or internal data.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  const { verificationId } = await params;

  if (!verificationId || verificationId.length > 100) {
    return NextResponse.json({ error: "Invalid verification ID" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("verification_records")
      .select(
        "verification_id, custody_ledger_hash, document_count, destination_country, document_type, release_status, released_at, public_summary, created_at"
      )
      .eq("verification_id", verificationId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          verified: false,
          status: "NOT_FOUND",
          message: "No verification record found for this ID.",
        },
        { status: 404 }
      );
    }

    // Log the access (anonymized, no PII)
    await supabase.from("verification_logs").insert({
      verification_id: verificationId,
      access_context: "api",
      viewer_type: "public",
    });

    // Return ONLY public-safe fields
    return NextResponse.json({
      verified: data.release_status === "VALID",
      status: data.release_status,
      verification_id: data.verification_id,
      custody_hash: data.custody_ledger_hash,
      document_count: data.document_count,
      destination_country: data.destination_country,
      document_type: data.document_type,
      released_at: data.released_at,
      public_summary: data.public_summary,
      issuer: "The Milano Seal™",
      // Explicitly never include: matter_id, client info, pricing, operator notes
    });
  } catch {
    return NextResponse.json(
      { verified: false, status: "ERROR", message: "Verification lookup failed." },
      { status: 500 }
    );
  }
}

// ─── Release Certificate hash lookup (public) ─────────────────────────────
// Accessible at: /api/verify/<verification_hash>
// Returns only: valid, status, verificationHash, displayId, releaseDate, documentCount, custodyStatus, releasedAt
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  const { verificationId } = await params;
  const body = (await req.json().catch(() => ({}))) as { mode?: string };

  if (body.mode !== "release_cert") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!verificationId) {
    return NextResponse.json({ valid: false, status: "not_found" }, { status: 404 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("release_certificates")
      .select("deal_id,verification_hash,release_date,document_count,status,created_at")
      .eq("verification_hash", verificationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, status: "not_found", verificationHash: verificationId });
    }

    const certStatus = data.status as "valid" | "revoked" | "expired";
    // Public display reference only (the same value printed on the certificate).
    const { data: matter } = data.deal_id
      ? await supabase.from("deals").select("deal_id").eq("id", data.deal_id).maybeSingle()
      : { data: null };
    return NextResponse.json({
      valid: certStatus === "valid",
      status: certStatus,
      verificationHash: data.verification_hash,
      displayId: matter?.deal_id ?? null,
      releaseDate: data.release_date,
      documentCount: data.document_count,
      custodyStatus: data.status,
      releasedAt: data.created_at,
    });
  } catch {
    return NextResponse.json({ valid: false, status: "error" }, { status: 500 });
  }
}
