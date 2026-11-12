import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { partnerIdForReferralCode, resolveAlliancePartner } from "@/lib/alliance/partnerContext";
import { ALLIANCE_REFERRAL_LEAD_TYPE, submitPartnerReferral } from "@/lib/alliance/referralLeads";

const INCOMPLETE = "Please complete the required referral details before submitting.";

async function sessionUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// POST — partner referral into the canonical lead intake. Attribution comes from the signed-in
// partner or a verified referral code, never from a typed partner email. A referral is reported
// received only after it is stored.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: INCOMPLETE }, { status: 400 });
  }
  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim().slice(0, 2000) : "");
  const referral_code = text("referral_code"), client_email = text("client_email");
  const destination_country = text("destination_country"), document_type = text("document_type"), matter_type = text("matter_type");

  if (!client_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) {
    return NextResponse.json({ error: "Please add the client's email address so the team can reach them." }, { status: 400 });
  }
  // The governed lead-to-Matter conversion requires the client's name and email.
  if (!text("client_name") || !destination_country || !document_type || !matter_type) {
    return NextResponse.json({ error: INCOMPLETE }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const sessionPartner = await resolveAlliancePartner(await sessionUserId(), db);
    const partnerId = sessionPartner?.id ?? (await partnerIdForReferralCode(referral_code, db));
    if (!partnerId) {
      return NextResponse.json({ error: "Sign in to your Alliance account or use a valid referral code." }, { status: 400 });
    }
    const stored = await submitPartnerReferral(db, {
      client_name: text("client_name") || null,
      client_email,
      client_phone: text("client_phone") || null,
      destination_country,
      document_type,
      matter_type,
      urgency: text("urgency") || null,
      referral_code: sessionPartner?.referral_code ?? referral_code ?? null,
      context: {
        preferred_contact_method: text("preferred_contact_method") || "Email",
        signer_location: text("signer_location") || null,
        requires_apostille: body.requires_apostille === true,
        requires_translation: body.requires_translation === true,
        requires_witness: body.requires_witness === true,
        partner_context_note: text("partner_context_note") || null,
        deadline_note: text("deadline_note") || null,
        receiving_authority_note: text("receiving_authority_note") || null,
        known_issue_note: text("known_issue_note") || null,
      },
    }, partnerId);
    return NextResponse.json({
      success: true,
      referral_id: stored.reference,
      status: "submitted",
      message: "Referral received. The Milano Seal team will review and follow up.",
    });
  } catch {
    // Never report a referral as received unless it was stored.
    return NextResponse.json({ error: "Submission failed. Please try again." }, { status: 503 });
  }
}

// GET — the signed-in partner's own referral statuses, partner-safe fields only.
export async function GET() {
  try {
    const db = createAdminClient();
    const partner = await resolveAlliancePartner(await sessionUserId(), db);
    if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: leads, error } = await db
      .from("sales_leads")
      .select("id, country, document_type, canonical_matter_id, details, created_at")
      .eq("lead_type", ALLIANCE_REFERRAL_LEAD_TYPE)
      .eq("details->>partner_id", partner.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: "Referrals are unavailable right now." }, { status: 503 });

    // Never expose operator notes, revenue or client contact details.
    const referrals = (leads ?? []).map((lead) => {
      const review = String((lead.details as Record<string, unknown> | null)?.review_status ?? "pending_review");
      const status = lead.canonical_matter_id ? "accepted" : review === "rejected" ? "not_accepted" : review === "pending_review" ? "submitted" : "under_review";
      return {
        referral_id: `REF-${String(lead.id).slice(0, 8).toUpperCase()}`,
        submitted_at: lead.created_at,
        destination_country: lead.country,
        document_type: lead.document_type,
        status,
        public_next_step: status === "submitted" ? "Your referral has been received and is pending review."
          : status === "accepted" ? "Referral accepted. Matter is being prepared for execution."
          : status === "not_accepted" ? "This referral was not accepted at this time."
          : "The Milano Seal team is reviewing this referral.",
      };
    });
    return NextResponse.json({ referrals });
  } catch {
    return NextResponse.json({ error: "Referrals are unavailable right now." }, { status: 503 });
  }
}
