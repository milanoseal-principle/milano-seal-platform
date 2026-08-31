import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 24_000;
const MAX_TEXT = 2_000;
const MAX_NOTES = 6_000;

function cleanText(value: unknown, max = MAX_TEXT) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\u0000/g, "").slice(0, max);
  return cleaned || null;
}

function cleanCsv(value: unknown, maxItems = 20) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return source
    .map((item) => cleanText(item, 120))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
}

function booleanValue(value: unknown) {
  return value === true;
}

function obviousSpam(body: Record<string, unknown>) {
  const honeypot = cleanText(body.website ?? body.company_website ?? body.fax_number, 200);
  if (honeypot) return true;

  const combined = [body.full_name, body.business_name, body.notes]
    .map((value) => cleanText(value, 2_000) ?? "")
    .join(" ");
  const linkCount = (combined.match(/https?:\/\//gi) ?? []).length;
  return linkCount > 4 || /(casino bonus|crypto giveaway|buy followers|viagra|seo backlinks)/i.test(combined);
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Application payload is too large." }, { status: 413 });
    }

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Application payload is too large." }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (obviousSpam(body)) {
      return NextResponse.json({ error: "Application could not be accepted." }, { status: 429 });
    }

    const fullName = cleanText(body.full_name, 200);
    const email = cleanText(body.email, 320)?.toLowerCase() ?? null;
    const phone = cleanText(body.phone, 80);
    const stateCommissioned = cleanText(body.state_commissioned, 120);
    const commissionNumber = cleanText(body.commission_number, 160);

    if (!fullName || !email || !phone || !stateCommissioned || !commissionNumber) {
      return NextResponse.json(
        { error: "full_name, email, phone, state_commissioned, and commission_number are required" },
        { status: 400 },
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Email uniqueness is both a business constraint and a durable duplicate-submission guard.
    const { data: existing, error: existingError } = await admin
      .from("notary_applications")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("[notary-apply] duplicate check failed", existingError.code);
      return NextResponse.json({ error: "Application intake is temporarily unavailable." }, { status: 503 });
    }
    if (existing) {
      return NextResponse.json({ error: "An application for this email already exists." }, { status: 409 });
    }

    const { error } = await admin.from("notary_applications").insert({
      full_name: fullName,
      email,
      phone,
      state_commissioned: stateCommissioned,
      commission_number: commissionNumber,
      commission_expiration: cleanText(body.commission_expiration, 32),
      ron_authorized: booleanValue(body.ron_authorized),
      ron_platforms_used: cleanCsv(body.ron_platforms_used),
      // Legacy field retained only for schema compatibility. Milano does not use
      // "RON certified" as a public or verification designation.
      blue_notary_experience: booleanValue(body.blue_notary_experience),
      remote_online_notary_certification: false,
      e_and_o_insurance_provider: cleanText(body.e_and_o_insurance_provider, 240),
      e_and_o_policy_limit: cleanText(body.e_and_o_policy_limit, 120),
      background_check_status: cleanText(body.background_check_status, 120),
      languages: cleanCsv(body.languages),
      availability: cleanText(body.availability, 500),
      mobile_notary_available: booleanValue(body.mobile_notary_available),
      apostille_experience: booleanValue(body.apostille_experience),
      international_document_experience: booleanValue(body.international_document_experience),
      shipping_dropoff_access: booleanValue(body.shipping_dropoff_access),
      preferred_service_area: cleanText(body.preferred_service_area, 500),
      notes: cleanText(body.notes, MAX_NOTES),
      status: "APPLICATION_RECEIVED",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "An application for this email already exists." }, { status: 409 });
      }
      console.error("[notary-apply] insert failed", error.code);
      return NextResponse.json({ error: "Application intake is temporarily unavailable." }, { status: 503 });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Application received for credential review. Approval and dispatch readiness are separate governed decisions.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
