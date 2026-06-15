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
      phone: body.phone,
      state_commissioned: body.state_commissioned,
      commission_number: body.commission_number,
      commission_expiration: body.commission_expiration ?? null,
      ron_authorized: body.ron_authorized ?? false,
      ron_platforms: body.ron_platforms ?? null,
      bluenotary_experience: body.bluenotary_experience ?? null,
      eo_provider: body.eo_provider ?? null,
      eo_policy_limit: body.eo_policy_limit ?? null,
      background_check_status: body.background_check_status ?? null,
      languages: body.languages ?? null,
      availability: body.availability ?? null,
      mobile_notary: body.mobile_notary ?? false,
      apostille_experience: body.apostille_experience ?? false,
      international_doc_experience: body.international_doc_experience ?? false,
      shipping_dropoff_access: body.shipping_dropoff_access ?? false,
      preferred_service_area: body.preferred_service_area ?? null,
      notes: body.notes ?? null,
      status: "pending",
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
