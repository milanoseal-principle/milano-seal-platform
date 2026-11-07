import { collectAllProjectionRows } from "@/lib/matter/readAllDealsForProjection";
import {
  summarizeProfessionalAttribution,
  type AttributionMatterRow,
} from "@/lib/professional/attribution";
import {
  projectAcquisition,
  filterAcquisition,
  acquisitionSummary,
  type AcquisitionLead,
} from "@/lib/counsel/operator";
import { handleCounselOperatorPost } from "@/lib/counsel/operator-actions";
import { NextResponse } from "next/server";
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
export async function GET(request: Request) {
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
  const allInquiries = (data ?? []) as AcquisitionLead[];
  const ids = allInquiries
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
  const inquiries = filterAcquisition(
    allInquiries,
    new URL(request.url).searchParams,
    matters,
  );
  matters = matters.filter((matter) =>
    inquiries.some((lead) => lead.canonical_matter_id === matter.id),
  );
  const profileIds = [
    ...new Set(
      inquiries
        .map(
          (lead) =>
            projectAcquisition(
              lead,
              matters.find((matter) => matter.id === lead.canonical_matter_id),
            ).professional_profile_id,
        )
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const profiles = profileIds.length
    ? await admin
        .from("professional_profiles")
        .select("id,firm_name,email,status,user_id")
        .in("id", profileIds)
    : { data: [], error: null };
  let professionalHistory: ReturnType<
    typeof summarizeProfessionalAttribution
  > | null = [];
  if (profileIds.length) {
    try {
      const rows = await collectAllProjectionRows<AttributionMatterRow>(
        async (offset, limit) => {
          const result = await admin
            .from("deals")
            .select(
              "id,professional_profile_id,referral_source_type,destination_country,document_type,created_at,completed_at,final_total,discount_amount,amount_paid,verified_revenue,payment_status,quote_review_required,deal_status",
            )
            .in("professional_profile_id", profileIds)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offset, offset + limit - 1);
          if (result.error) throw result.error;
          return result.data ?? [];
        },
      );
      professionalHistory = summarizeProfessionalAttribution(rows);
    } catch {
      professionalHistory = null;
    }
  }
  const marketing = await Promise.all(
    [
      "counsel_visit",
      "counsel_inquiry_opened",
      "counsel_inquiry_submitted",
      "counsel_submission_failed",
      "review_clicked",
      "intake_abandoned",
      "document_uploaded",
      "upload_failed",
    ].map(async (event) => {
      let query = admin
        .from("ux_learning_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", event)
        .eq("surface", "public_site");
      if (!event.startsWith("counsel_"))
        query = query.contains("metadata", { journeySurface: "counsel" });
      const { count, error } = await query;
      return [event, error ? "unavailable" : (count ?? 0)];
    }),
  );
  return NextResponse.json({
    professional_history: professionalHistory,
    professional_history_scope:
      "All canonical Matters for identified profiles, paginated; account history is not allocated to an inquiry or campaign without an actual link.",
    marketing: Object.fromEntries(marketing),
    marketing_scope:
      "All-time event observations across public_site; not filtered cohort counts, unique visitors or operational evidence.",
    professional_profiles: profiles.error ? null : profiles.data,
    notification_failures: (notifications ?? []).filter(
      (item) => item.delivery_status === "failed" || item.status === "failed",
    ).length,
    operational: counselOperationalFunnel(matters),
    acquisition: acquisitionSummary(inquiries, matters),
    inquiries: inquiries.map((lead) => ({
      ...lead,
      acquisition: projectAcquisition(
        lead,
        matters.find((matter) => matter.id === lead.canonical_matter_id),
      ),
    })),
    notifications,
    matters,
    scope:
      "Latest 100 inquiries; canonical Matter facts are separate from marketing events.",
  });
}
export async function POST(request: Request) {
  return handleCounselOperatorPost(request, {
    actor: allowed,
    admin: createAdminClient,
    notify: sendCounselInquiryAlerts,
  });
}
