import { NextResponse } from "next/server";
import { buildClientHandoffUrl, createReferralReference } from "@/lib/professional/referral";
import { professionalCanSubmit } from "@/lib/professional/profile";
import { requireProfessional } from "@/lib/professional/server";

export const runtime = "nodejs";

// CLIENT COMPLETES SECURE INTAKE: returns a governed handoff link carrying only
// the professional profile id, destination, document type and a signed
// referral reference. Client facts are never placed in the URL.
export async function POST(request: Request) {
  const context = await requireProfessional();
  if (!context.ok) return NextResponse.json({ error: context.error }, { status: context.status });
  if (!professionalCanSubmit(context.profile)) {
    return NextResponse.json({ error: "Professional profile is not active." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const reference = createReferralReference(context.profile.id, "handoff");
    const url = buildClientHandoffUrl({
      origin: new URL(request.url).origin,
      profileId: context.profile.id,
      destination: body.destination_country,
      documentType: body.document_type,
      reference,
    });
    return NextResponse.json({ url, referral_reference: reference });
  } catch (error) {
    console.error("[professional/handoff] failed", error);
    return NextResponse.json({ error: "Handoff link is unavailable right now." }, { status: 503 });
  }
}
