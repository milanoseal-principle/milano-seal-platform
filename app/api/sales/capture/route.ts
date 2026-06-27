import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type CaptureBody = {
  full_name?: string;
  email?: string;
  phone?: string;
  audience?: string;
  country?: string;
  document_type?: string;
  industry?: string;
  product_interest?: string;
  urgency?: string;
  source_route?: string;
  desired_next_step?: string;
  // Application-specific extra fields are accepted and stored in details.
  [key: string]: unknown;
};

function deriveLeadType(body: CaptureBody): string {
  const step = (body.desired_next_step ?? "").toLowerCase();
  const audience = (body.audience ?? "").toLowerCase();
  const interest = (body.product_interest ?? "").toLowerCase();

  if (step === "alliance_application" || audience === "alliance_notary") {
    return "alliance_application";
  }
  if (step === "va_application" || audience === "virtual_assistant") {
    return "va_application";
  }
  if (
    step.includes("lawyer-pack") ||
    audience === "international_lawyer" ||
    interest.includes("lawyer-pack")
  ) {
    return "lawyer_access";
  }
  if (
    step.includes("private-client") ||
    audience === "private_client" ||
    interest.includes("private-client")
  ) {
    return "private_client_review";
  }
  return "client_intake";
}

export async function POST(request: Request) {
  let body: CaptureBody;
  try {
    body = (await request.json()) as CaptureBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email is required." },
      { status: 400 },
    );
  }

  const leadType = deriveLeadType(body);

  let leadId: string | null = null;

  // Best-effort persistence. A missing table or missing env must never 500.
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("sales_leads")
      .insert({
        full_name: body.full_name ?? null,
        email,
        phone: body.phone ?? null,
        audience: body.audience ?? null,
        country: body.country ?? null,
        document_type: body.document_type ?? null,
        industry: body.industry ?? null,
        product_interest: body.product_interest ?? null,
        urgency: body.urgency ?? null,
        source_route: body.source_route ?? null,
        desired_next_step: body.desired_next_step ?? null,
        lead_type: leadType,
        details: body,
      })
      .select("id")
      .single();

    if (!error && data && typeof data.id !== "undefined") {
      leadId = String(data.id);
    }
  } catch {
    // Swallow — lead is captured best-effort, never block the user.
    leadId = null;
  }

  return NextResponse.json({
    ok: true,
    leadId,
    leadType,
    nextUrl: "/intake",
    recommendedAction:
      "Start your controlled intake so The Milano Seal can review your route. Routing snapshots remain subject to receiving-authority review.",
    ctaLabel: "Start Controlled Intake",
  });
}
