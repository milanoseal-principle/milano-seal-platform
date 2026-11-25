// Public lead capture for the alliance and VA application pages
// (app/alliance/apply, app/(public)/va/apply). Anonymous by design; it creates
// a sales_leads row only (no account, role, Matter or payment). Same abuse
// controls as the other public lead forms (lib/acquisition/concierge.ts,
// pricingRequest.ts): a foreign Origin is refused, the body is size-capped,
// and each client address is limited per hour on sales_leads.ip_hash.

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { hashClientIp } from "@/lib/acquisition/concierge";
import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_SALES_CAPTURE_BODY_BYTES = 16 * 1024;
export const MAX_SALES_CAPTURE_PER_IP_PER_HOUR = 10;

export type SalesCaptureDeps = {
  admin: () => SupabaseClient;
  hashIp: (headers: Headers) => string;
};

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

export function deriveLeadType(body: CaptureBody): string {
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

export async function receiveSalesCapture(
  request: Request,
  deps: SalesCaptureDeps = { admin: createAdminClient, hashIp: hashClientIp },
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: "Please submit from the Milano website." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_SALES_CAPTURE_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "The request is too large." }, { status: 413 });
  }
  const raw = await request.text().catch(() => "");
  if (Buffer.byteLength(raw, "utf8") > MAX_SALES_CAPTURE_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "The request is too large." }, { status: 413 });
  }
  let body: CaptureBody;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as CaptureBody;
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

  // Receipt requires persistence. Missing infrastructure returns a retryable 503.
  try {
    const supabase = deps.admin();
    const ipHash = deps.hashIp(request.headers);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: rateError } = await supabase
      .from("sales_leads")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (rateError) throw rateError;
    if ((count ?? 0) >= MAX_SALES_CAPTURE_PER_IP_PER_HOUR) {
      return NextResponse.json({ ok: false, error: "Please wait before sending another request." }, { status: 429 });
    }
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
        ip_hash: ipHash,
        details: body,
      })
      .select("id")
      .single();

    if (!error && data && typeof data.id !== "undefined") {
      leadId = String(data.id);
    }
  } catch {
    // No reference means no confirmed receipt; the response below must fail.
    leadId = null;
  }

  return NextResponse.json({
    ok: Boolean(leadId),
    ...(leadId ? {} : { error: "Your request could not be saved. Please try again." }),
    leadId,
    leadType,
    nextUrl: "/intake",
    recommendedAction:
      "Start your controlled intake so The Milano Seal can review your route. Routing snapshots remain subject to receiving-authority review.",
    ctaLabel: "Start Controlled Intake",
  }, { status: leadId ? 200 : 503 });
}
