import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCounselInquiryAlerts } from "@/lib/notifications/transactionalEmailAlerts";
import { counselHandoffError } from "./handoff";
import {
  operatorActionSchema,
  appendOperatorAction,
  type AcquisitionLead,
} from "./operator";
const actionSchema = z.object({
  reference: z.string().uuid(),
  action: z.enum([
    "retry_notification",
    "document",
    "link_matter",
    "record_action",
  ]),
  matter_id: z.string().uuid().optional(),
  operator_action: operatorActionSchema.optional(),
});
export async function handleCounselOperatorPost(
  request: Request,
  dependencies: {
    actor: () => Promise<string | null | undefined>;
    admin: typeof createAdminClient;
    notify: typeof sendCounselInquiryAlerts;
  },
) {
  const actor = await dependencies.actor();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  const { reference, action, matter_id } = parsed.data;
  const admin = dependencies.admin();
  const { data: lead, error } = await admin
    .from("sales_leads")
    .select("id,email,country,created_at,details,canonical_matter_id")
    .eq("id", reference)
    .eq("lead_type", "counsel_inquiry")
    .single();
  if (error || !lead)
    return NextResponse.json(
      { error: "Inquiry unavailable." },
      { status: 404 },
    );
  const handoffLead = lead;
  async function failedHandoff(code: string, message: string, status: number) {
    const previous = Array.isArray(handoffLead.details?.handoff_failures)
      ? handoffLead.details.handoff_failures
      : [];
    const { data: recorded, error: recordError } = await admin
      .from("sales_leads")
      .update({
        details: {
          ...handoffLead.details,
          handoff_failures: [
            ...previous.slice(-19),
            { code, actor, occurred_at: new Date().toISOString() },
          ],
        },
      })
      .eq("id", reference)
      .eq("details", JSON.stringify(handoffLead.details))
      .select("id")
      .maybeSingle();
    return NextResponse.json(
      {
        error: message,
        failure_code: code,
        diagnostic_recorded: Boolean(recorded && !recordError),
      },
      { status },
    );
  }
  if (action === "record_action") {
    const actionInput = parsed.data.operator_action;
    if (!actionInput)
      return NextResponse.json(
        { error: "Operator evidence is required." },
        { status: 400 },
      );
    if (actionInput.kind === "qualify") {
      const { data: profile, error: profileError } = await admin
        .from("professional_profiles")
        .select("id,email")
        .eq("id", actionInput.professional_profile_id!)
        .maybeSingle();
      if (profileError)
        return NextResponse.json(
          { error: "Professional identity unavailable." },
          { status: 503 },
        );
      if (
        !profile ||
        profile.email.trim().toLowerCase() !== lead.email.trim().toLowerCase()
      )
        return NextResponse.json(
          { error: "Professional identity does not match this inquiry." },
          { status: 409 },
        );
    }
    try {
      const result = appendOperatorAction(lead as AcquisitionLead, {
        ...actionInput,
        actor,
        recorded_at: new Date().toISOString(),
        evidence_scope: "operator_attested",
      });
      if (result.duplicate)
        return NextResponse.json({ ok: true, duplicate: true });
      // Compare-and-swap the existing JSON record: preserve uploads/context and
      // reject concurrent edits rather than losing operator evidence.
      const { data: saved, error: saveError } = await admin
        .from("sales_leads")
        .update({ details: result.details })
        .eq("id", reference)
        .eq("details", JSON.stringify(lead.details))
        .select("id")
        .maybeSingle();
      if (saveError)
        return NextResponse.json(
          { error: "Operator action could not be saved." },
          { status: 503 },
        );
      if (!saved)
        return NextResponse.json(
          { error: "Inquiry changed. Refresh and retry the same action." },
          { status: 409 },
        );
      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Operator evidence is invalid.",
        },
        { status: 409 },
      );
    }
  }
  if (action === "retry_notification")
    return NextResponse.json({
      notification: await dependencies.notify(reference),
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
    .select("id,professional_profile_id,referral_source_type")
    .eq("id", matter_id)
    .single();
  if (!matter)
    return NextResponse.json(
      { error: "Canonical Matter not found." },
      { status: 404 },
    );
  const { data: profile, error: profileError } = matter.professional_profile_id
    ? await admin
        .from("professional_profiles")
        .select("email")
        .eq("id", matter.professional_profile_id)
        .maybeSingle()
    : { data: null, error: null };
  if (profileError)
    return NextResponse.json(
      { error: "Professional identity could not be verified." },
      { status: 503 },
    );
  const handoffError = counselHandoffError({
    inquiryEmail: lead.email,
    profileEmail: profile?.email,
    professionalProfileId: matter.professional_profile_id,
    referralSourceType: matter.referral_source_type,
  });
  if (handoffError)
    return failedHandoff(
      "PROFESSIONAL_ATTRIBUTION_MISMATCH",
      handoffError,
      409,
    );
  if (lead.canonical_matter_id === matter_id)
    return NextResponse.json({ ok: true, duplicate: true });
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
