import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readAppRole } from "@/lib/auth/server-role";
import { isOperatorOrFounder } from "@/lib/security/access-control";
import { sendCounselInquiryAlerts } from "@/lib/notifications/transactionalEmailAlerts";
import {
  counselOperationalFunnel,
  type CounselMatterTruth,
} from "@/lib/counsel/funnel";
export const runtime = "nodejs";
async function allowed() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return isOperatorOrFounder(readAppRole(user)) ? user?.id : null;
}
export async function GET() {
  if (!(await allowed()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const [{ data, error }, { data: notifications, error: notificationError }] =
    await Promise.all([
      admin
        .from("sales_leads")
        .select(
          "id,full_name,email,country,details,created_at,canonical_matter_id",
        )
        .eq("lead_type", "counsel_inquiry")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("notifications")
        .select(
          "id,status,delivery_status,error_message,provider_message_id,metadata,created_at",
        )
        .eq("type", "operator_counsel_inquiry")
        .order("created_at", { ascending: false })
        .limit(300),
    ]);
  if (error || notificationError)
    return NextResponse.json(
      { error: "Inquiry data unavailable." },
      { status: 503 },
    );
  const ids = (data ?? [])
    .map((row) => row.canonical_matter_id)
    .filter(Boolean);
  let matters: CounselMatterTruth[] = [];
  if (ids.length) {
    const result = await admin
      .from("deals")
      .select(
        "id,deal_id,professional_profile_id,payment_status,payment_settlement_status,payment_confirmed,quote_approved_at,completed_at,deal_status,verified_revenue",
      )
      .in("id", ids);
    if (result.error)
      return NextResponse.json(
        { error: "Canonical Matter data unavailable." },
        { status: 503 },
      );
    matters = result.data ?? [];
  }
  const marketing = await Promise.all(
    [
      "counsel_visit",
      "counsel_inquiry_opened",
      "counsel_inquiry_submitted",
    ].map(async (event) => {
      const { count, error } = await admin
        .from("ux_learning_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", event)
        .eq("surface", "public_site");
      return [event, error ? "unavailable" : (count ?? 0)];
    }),
  );
  return NextResponse.json({
    marketing: Object.fromEntries(marketing),
    operational: counselOperationalFunnel(matters),
    inquiries: data,
    notifications,
    matters,
    scope:
      "Latest 100 inquiries; canonical Matter facts are separate from marketing events.",
  });
}
const actionSchema = z.object({
  reference: z.string().uuid(),
  action: z.enum(["retry_notification", "document", "link_matter"]),
  matter_id: z.string().uuid().optional(),
});
export async function POST(request: Request) {
  const actor = await allowed();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { reference, action, matter_id } = parsed.data;
  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("sales_leads")
    .select("id,details,canonical_matter_id")
    .eq("id", reference)
    .eq("lead_type", "counsel_inquiry")
    .single();
  if (error || !lead)
    return NextResponse.json(
      { error: "Inquiry unavailable." },
      { status: 404 },
    );
  if (action === "retry_notification")
    return NextResponse.json({
      notification: await sendCounselInquiryAlerts(reference),
    });
  if (action === "document") {
    const path = lead.details?.document?.path;
    if (
      lead.details?.document_status !== "received" ||
      typeof path !== "string" ||
      !path.startsWith(`counsel/${reference}/`)
    )
      return NextResponse.json(
        { error: "No confirmed document." },
        { status: 404 },
      );
    const { data, error: signError } = await admin.storage
      .from("deal-documents")
      .createSignedUrl(path, 60, { download: true });
    if (signError)
      return NextResponse.json(
        { error: "Document unavailable." },
        { status: 503 },
      );
    return NextResponse.json({ url: data.signedUrl });
  }
  if (!matter_id)
    return NextResponse.json(
      { error: "An existing canonical Matter UUID is required." },
      { status: 400 },
    );
  if (lead.canonical_matter_id && lead.canonical_matter_id !== matter_id)
    return NextResponse.json(
      { error: "Inquiry is already linked to a different Matter." },
      { status: 409 },
    );
  const { data: matter } = await admin
    .from("deals")
    .select("id")
    .eq("id", matter_id)
    .single();
  if (!matter)
    return NextResponse.json(
      { error: "Canonical Matter not found." },
      { status: 404 },
    );
  // Association preserves the original inquiry and acquisition record. It never
  // writes referral identity, lifecycle, quote, payment or scheduling authority.
  const { data: linked, error: linkError } = await admin
    .from("sales_leads")
    .update({
      canonical_matter_id: matter_id,
      linked_by: actor,
      linked_at: new Date().toISOString(),
    })
    .eq("id", reference)
    .or(`canonical_matter_id.is.null,canonical_matter_id.eq.${matter_id}`)
    .select("id")
    .maybeSingle();
  if (!linkError && !linked)
    return NextResponse.json(
      {
        error:
          "Inquiry was linked by another operator. Refresh before continuing.",
      },
      { status: 409 },
    );
  return linkError
    ? NextResponse.json({ error: "Link could not be saved." }, { status: 503 })
    : NextResponse.json({ ok: true });
}
