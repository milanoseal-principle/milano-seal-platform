import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { computeExecutionReadiness, toSlug } from "@/lib/executionReadiness";
import { computeMatterIntelligence } from "@/lib/matterIntelligence";
import { computeOperatorActions } from "@/lib/operatorActions";

export async function GET(req: NextRequest) {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const country = searchParams.get("country") ?? "";
  const document = searchParams.get("document") ?? "";
  const matterId = searchParams.get("matter_id") ?? null;
  const dealStatus = searchParams.get("deal_status") ?? null;
  const paymentStatus = searchParams.get("payment_status") ?? null;
  const isPaidParam = searchParams.get("is_paid") ?? null;
  const isNotarized = searchParams.get("is_notarized") === "true";
  const hasApostille = searchParams.get("has_apostille") === "true";
  const hasTranslation = searchParams.get("has_translation") === "true";
  const hasScheduled = searchParams.get("has_scheduled") === "true";
  const courierStatus = searchParams.get("courier_status") ?? null;

  if (!country || !document) {
    return NextResponse.json(
      { error: "country and document params are required" },
      { status: 400 },
    );
  }

  const countryId = toSlug(country);
  const documentId = toSlug(document);

  const isPaid = isPaidParam === "true" || paymentStatus === "paid" || paymentStatus === "confirmed";

  const matterState = {
    matter_status: dealStatus,
    payment_status: paymentStatus,
    is_paid_and_released: false,
    destination_country: countryId,
    document_type: documentId,
  };

  // Compute readiness
  const readiness = computeExecutionReadiness(countryId, documentId, matterState);

  // Compute matter intelligence
  let intelligence = null;
  try {
    intelligence = computeMatterIntelligence({
      country_id: countryId,
      document_id: documentId,
      matter_type: "general",
      is_paid: isPaid,
      is_notarized: isNotarized,
      has_apostille: hasApostille,
      has_translation: hasTranslation,
      has_scheduled: hasScheduled,
      courier_status: courierStatus,
      deal_status: dealStatus,
    });
  } catch {
    // Intelligence is advisory — never block the response
  }

  // Compute operator actions
  const actionInput = {
    matter_id: matterId,
    deal_status: dealStatus,
    payment_status: paymentStatus,
    is_paid_and_released: false,
    destination_country: countryId,
    document_type: documentId,
    is_notarized: isNotarized,
    has_apostille: hasApostille,
    has_translation: hasTranslation,
    has_scheduled: hasScheduled,
    courier_status: courierStatus,
    authority_confidence: intelligence?.authority_confidence ?? null,
    chain_certification_status: intelligence?.authority_chain?.status ?? null,
    requires_qa_checklist: intelligence?.requires_qa_checklist ?? false,
  };

  const operatorActions = computeOperatorActions(actionInput);

  return NextResponse.json({
    matter_id: matterId,
    country_id: countryId,
    document_id: documentId,
    readiness_score: readiness.score,
    risk_level: readiness.riskLevel,
    execution_ready: readiness.executionReady,
    missing_items: readiness.missing.map((i) => i.label),
    fatal_blockers: readiness.fatalBlockers.map((i) => i.label),
    operator_actions: {
      total_actions: operatorActions.total_actions,
      critical_count: operatorActions.critical_count,
      next_action: operatorActions.next_action
        ? {
            priority: operatorActions.next_action.priority,
            label: operatorActions.next_action.label,
            description: operatorActions.next_action.description,
            cta: operatorActions.next_action.cta,
            route: operatorActions.next_action.route,
          }
        : null,
      operator_summary: operatorActions.operator_summary,
      actions: operatorActions.actions,
    },
    matter_intelligence: intelligence
      ? {
          authority_confidence: intelligence.authority_confidence ?? null,
          chain_certification_status: intelligence.authority_chain?.status ?? null,
          estimated_timeline_days: intelligence.estimated_timeline_days ?? null,
          requires_qa_checklist: intelligence.requires_qa_checklist ?? false,
          is_derived: intelligence.is_derived,
          next_action_operator: intelligence.next_action_operator ?? null,
        }
      : null,
    timeline: readiness.timeline,
    corridor_label: readiness.corridorLabel,
    execution_path: readiness.executionPath,
    is_derived: readiness.isDerived,
  });
}
