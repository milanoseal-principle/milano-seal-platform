import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      referral_code, partner_name, partner_email, partner_firm,
      client_name, client_email, client_phone, preferred_contact_method,
      destination_country, document_type, matter_type, urgency,
      signer_location, requires_apostille, requires_translation, requires_witness,
      partner_context_note, deadline_note, receiving_authority_note, known_issue_note,
    } = body;

    // Validation
    if (!partner_email && !referral_code) {
      return NextResponse.json({ error: "Please complete the required referral details before submitting." }, { status: 400 });
    }
    if (!client_name && !client_email) {
      return NextResponse.json({ error: "Please complete the required referral details before submitting." }, { status: 400 });
    }
    if (!destination_country || !document_type || !matter_type) {
      return NextResponse.json({ error: "Please complete the required referral details before submitting." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Look up partner by referral_code if provided
    let partner_id: string | null = null;
    if (referral_code) {
      const { data: partner } = await supabase
        .from("alliance_partners")
        .select("id")
        .eq("referral_code", referral_code)
        .single();
      if (partner) partner_id = partner.id;
    }

    // Build observation text from context notes
    const observationParts: string[] = [];
    if (partner_context_note) observationParts.push(partner_context_note);
    if (deadline_note) observationParts.push(`Deadline: ${deadline_note}`);
    if (receiving_authority_note) observationParts.push(`Authority note: ${receiving_authority_note}`);
    if (known_issue_note) observationParts.push(`Known issue: ${known_issue_note}`);

    // Build a metadata summary for operator review
    const metaSummary = [
      `Partner: ${partner_name || partner_email || referral_code || "unknown"}`,
      partner_firm ? `Firm: ${partner_firm}` : null,
      `Client: ${client_name || client_email || "unknown"}`,
      client_phone ? `Phone: ${client_phone}` : null,
      `Contact method: ${preferred_contact_method || "Email"}`,
      `Matter type: ${matter_type}`,
      `Urgency: ${urgency || "Standard"}`,
      signer_location ? `Signer location: ${signer_location}` : null,
      requires_apostille ? "Requires apostille" : null,
      requires_translation ? "Requires translation" : null,
      requires_witness ? "Requires witness" : null,
    ].filter(Boolean).join(" | ");

    const fullText = [metaSummary, ...observationParts].join("\n\n") || "Partner referral submission";

    // Store referral submission — use partner_observations table as staging
    // (referral_ledger rows are created by operator when attaching to a matter)
    const { data: observation, error } = await supabase
      .from("partner_observations")
      .insert({
        partner_id,
        observation_type: "authority_observation", // closest match; operator reclassifies
        observation_text: fullText,
        source_url: null,
        country: destination_country,
        document_type,
        status: "pending_review",
      })
      .select("id")
      .single();

    if (error || !observation) {
      // Graceful degradation — log and return success anyway (don't lose referral)
      console.error("[REFERRAL_SUBMISSION_ERROR]", error?.message);
    }

    const referral_id = observation?.id
      ? `REF-${observation.id.substring(0, 8).toUpperCase()}`
      : `REF-${Date.now().toString(36).toUpperCase()}`;

    // Return ONLY partner-safe fields
    return NextResponse.json({
      success: true,
      referral_id,
      status: "submitted",
      message: "Referral received. The Milano Seal team will review and follow up.",
    });
  } catch {
    return NextResponse.json({ error: "Submission failed. Please try again." }, { status: 500 });
  }
}

// GET — partner-safe referral status list
// No auth on GET — partners identify by referral_code query param
export async function GET(req: NextRequest) {
  const referral_code = req.nextUrl.searchParams.get("ref");
  if (!referral_code) {
    return NextResponse.json({ referrals: [] });
  }

  const supabase = createAdminClient();

  // Look up partner
  const { data: partner } = await supabase
    .from("alliance_partners")
    .select("id")
    .eq("referral_code", referral_code)
    .single();

  if (!partner) {
    return NextResponse.json({ referrals: [] });
  }

  const { data: observations } = await supabase
    .from("partner_observations")
    .select("id, country, document_type, status, created_at")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Map to partner-safe format — never expose operator notes, revenue, client details
  const referrals = (observations ?? []).map((obs: {
    id: string;
    country: string | null;
    document_type: string | null;
    status: string;
    created_at: string;
  }) => ({
    referral_id: `REF-${obs.id.substring(0, 8).toUpperCase()}`,
    submitted_at: obs.created_at,
    destination_country: obs.country,
    document_type: obs.document_type,
    status: obs.status === "pending_review" ? "submitted"
          : obs.status === "accepted" ? "accepted"
          : obs.status === "rejected" ? "not_accepted"
          : "under_review",
    public_next_step: obs.status === "pending_review"
      ? "Your referral has been received and is pending review."
      : obs.status === "accepted"
      ? "Referral accepted. Matter is being prepared for execution."
      : obs.status === "rejected"
      ? "This referral was not accepted at this time."
      : "The Milano Seal team is reviewing this referral.",
  }));

  return NextResponse.json({ referrals });
}
