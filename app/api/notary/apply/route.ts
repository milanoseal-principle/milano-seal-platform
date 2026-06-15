import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;

    const required = ["full_name", "email", "phone", "state_commissioned", "commission_number"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const admin = createAdminClient();
    const { error } = await admin.from("notary_applications").insert({
      full_name: body.full_name,
      email: (body.email as string).trim().toLowerCase(),
      phone: body.phone ?? null,
      state_commissioned: body.state_commissioned,
      commission_number: body.commission_number,
      commission_expiration: body.commission_expiration ?? null,
      ron_authorized: body.ron_authorized ?? false,
      ron_platforms_used: body.ron_platforms_used ?? null,
      blue_notary_experience: body.blue_notary_experience ?? null,
      remote_online_notary_certification: body.remote_online_notary_certification ?? null,
      e_and_o_insurance_provider: body.e_and_o_insurance_provider ?? null,
      e_and_o_policy_limit: body.e_and_o_policy_limit ?? null,
      background_check_status: body.background_check_status ?? null,
      languages: body.languages ?? null,
      availability: body.availability ?? null,
      mobile_notary_available: body.mobile_notary_available ?? false,
      apostille_experience: body.apostille_experience ?? false,
      international_document_experience: body.international_document_experience ?? false,
      shipping_dropoff_access: body.shipping_dropoff_access ?? false,
      preferred_service_area: body.preferred_service_area ?? null,
      notes: body.notes ?? null,
      status: "APPLICATION_RECEIVED",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "An application for this email already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Application received. We will review and contact you within 3 business days." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
