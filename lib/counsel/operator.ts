import { z } from "zod";

export const operatorActionSchema = z
  .object({
    id: z.string().uuid(),
    kind: z.enum(["review", "respond", "qualify", "close", "follow_up"]),
    note: z.string().trim().min(10).max(1000),
    next_action: z.string().trim().max(240).default(""),
    follow_up_at: z.string().datetime({ offset: true }).optional(),
    channel: z.enum(["email", "phone", "meeting", "other"]).optional(),
    evidence_reference: z.string().trim().max(300).optional(),
    professional_profile_id: z.string().uuid().optional(),
  })
  .superRefine((action, ctx) => {
    if (action.kind === "follow_up" && !action.follow_up_at)
      ctx.addIssue({
        code: "custom",
        message: "Set a follow-up date for the operator queue.",
      });
    if (
      action.kind === "respond" &&
      (!action.channel || !action.evidence_reference?.trim())
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Record the completed response channel and evidence reference. This is operator attestation, not delivery confirmation.",
      });
    if (action.kind === "qualify" && !action.professional_profile_id)
      ctx.addIssue({
        code: "custom",
        message: "Select an existing matching professional profile.",
      });
    if (action.kind !== "close" && !action.next_action)
      ctx.addIssue({
        code: "custom",
        message: "Record the next operator action.",
      });
  });
export type OperatorAction = z.infer<typeof operatorActionSchema> & {
  actor: string;
  recorded_at: string;
  evidence_scope: "operator_attested";
};
export type AcquisitionLead = {
  id: string;
  email: string;
  country?: string;
  full_name?: string;
  created_at: string;
  canonical_matter_id: string | null;
  details: {
    operator_actions?: OperatorAction[];
    attribution?: Record<string, string>;
    destination?: string;
    document_status?: string;
    [key: string]: unknown;
  };
};
export function projectAcquisition(
  lead: AcquisitionLead,
  matter?: {
    id: string;
    completed_at?: string | null;
    professional_profile_id?: string | null;
  },
  now = Date.now(),
) {
  const actions = lead.details.operator_actions ?? [];
  const last = actions.at(-1);
  const responded = actions.some(
    (action) =>
      action.kind === "respond" && action.channel && action.evidence_reference,
  );
  const qualified = [...actions]
    .reverse()
    .find((action) => action.kind === "qualify");
  const stage =
    matter?.id === lead.canonical_matter_id
      ? "MATTER CREATED"
      : last?.kind === "close"
        ? "CLOSED"
        : qualified
          ? "QUALIFIED"
          : responded
            ? "RESPONDED"
            : actions.length
              ? "REVIEWING"
              : "NEW";
  const profileId =
    matter?.professional_profile_id ??
    qualified?.professional_profile_id ??
    null;
  const ageHours = Math.max(
    0,
    Math.floor((now - new Date(lead.created_at).getTime()) / 3600000),
  );
  return {
    stage,
    age_hours: ageHours,
    response_evidence: responded ? "operator_attested" : "none",
    qualified: Boolean(qualified),
    professional_profile_id: profileId,
    last_operator_action: last ?? null,
    next_action:
      last?.next_action ||
      (stage === "CLOSED"
        ? "Closed inquiry; reopen through an operator review if appropriate"
        : matter
          ? "Continue in canonical Matter workspace"
          : "Review and respond to counsel"),
    follow_up_due: Boolean(
      stage !== "CLOSED" &&
        last?.follow_up_at &&
        Date.parse(last.follow_up_at) <= now,
    ),
    linkage_pending: Boolean(lead.canonical_matter_id && !matter),
    activation_opportunity: Boolean(
      stage !== "CLOSED" && qualified && responded && profileId,
    ),
    repeat_opportunity: Boolean(matter?.completed_at && profileId),
  };
}
export function appendOperatorAction(
  lead: AcquisitionLead,
  action: OperatorAction,
) {
  const actions = lead.details.operator_actions ?? [];
  const duplicate = actions.find((item) => item.id === action.id);
  if (duplicate) {
    // A retry cannot overwrite an earlier attestation or change its meaning.
    const { actor: _actor, recorded_at: _at, ...prior } = duplicate;
    const { actor: _nextActor, recorded_at: _nextAt, ...next } = action;
    if (JSON.stringify(prior) !== JSON.stringify(next))
      throw new Error(
        "This action identifier was already used for different evidence.",
      );
    return { details: lead.details, duplicate: true };
  }
  if (actions.length >= 200)
    throw new Error(
      "This inquiry's action history requires operator review before adding more entries.",
    );
  if (
    action.kind === "qualify" &&
    !actions.some((item) => item.kind === "respond")
  )
    throw new Error(
      "Record a completed professional response before qualification.",
    );
  return {
    details: { ...lead.details, operator_actions: [...actions, action] },
    duplicate: false,
  };
}
export function filterAcquisition(
  leads: AcquisitionLead[],
  filters: URLSearchParams,
  matters: { id: string; professional_profile_id?: string | null }[] = [],
) {
  return leads.filter((lead) => {
    const context = lead.details.attribution ?? {};
    const projection = projectAcquisition(
      lead,
      matters.find((matter) => matter.id === lead.canonical_matter_id),
    );
    const values: Record<string, unknown> = {
      source: context.utm_source || context.source || "unknown",
      medium: context.utm_medium || context.medium || "unknown",
      campaign: context.utm_campaign || context.campaign || "unknown",
      content: context.utm_content || context.content || "unknown",
      landing_page: context.landing_page || "unknown",
      destination: lead.details.destination || "unknown",
      professional_country: lead.country || "unknown",
      practice_area: context.practice_area || "unknown",
      professional_id: projection.professional_profile_id || "unknown",
      referral_source: context.referral_source || "unknown",
    };
    return Object.entries(values).every(
      ([key, value]) =>
        !filters.get(key) ||
        String(value).toLowerCase() === filters.get(key)!.toLowerCase(),
    );
  });
}
export function acquisitionSummary(
  leads: AcquisitionLead[],
  matters: {
    id: string;
    completed_at?: string | null;
    professional_profile_id?: string | null;
  }[],
  now = Date.now(),
) {
  const businessDay = (date: string | number) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  const byId = new Map(matters.map((matter) => [matter.id, matter]));
  const rows = leads.map((lead) => ({
    lead,
    projection: projectAcquisition(
      lead,
      byId.get(lead.canonical_matter_id ?? ""),
      now,
    ),
  }));
  const sources: Record<string, number> = Object.create(null),
    destinations: Record<
      string,
      { inquiries: number; linked_matters: number }
    > = Object.create(null);
  for (const { lead, projection } of rows) {
    const context = lead.details.attribution ?? {};
    const source = context.utm_source || context.source || "unknown";
    sources[source] = (sources[source] ?? 0) + 1;
    const destination = lead.details.destination || "unknown";
    const bucket = (destinations[destination] ??= {
      inquiries: 0,
      linked_matters: 0,
    });
    bucket.inquiries++;
    if (projection.stage === "MATTER CREATED") bucket.linked_matters++;
  }
  return {
    persisted_inquiries: rows.length,
    new_today: leads.filter(
      (lead) => businessDay(lead.created_at) === businessDay(now),
    ).length,
    awaiting_response: rows.filter(
      ({ projection }) =>
        projection.response_evidence === "none" &&
        projection.stage !== "CLOSED",
    ).length,
    qualified: rows.filter(({ projection }) => projection.qualified).length,
    documents_received: leads.filter(
      (lead) => lead.details.document_status === "received",
    ).length,
    uploads_pending: leads.filter(
      (lead) => lead.details.document_status === "pending",
    ).length,
    follow_ups_due: rows.filter(({ projection }) => projection.follow_up_due)
      .length,
    sources,
    destinations,
    time_basis:
      "America/New_York; persisted latest-100 inquiry cohort; no conversion percentages",
  };
}
