import { SupabaseClient } from "@supabase/supabase-js";

export type ReadinessVerdict =
  | "READY"
  | "BLOCKED"
  | "REVIEW_REQUIRED"
  | "MISSING_INFO"
  | "ESCALATE_TO_NICHOLAS";

export type ReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  verdict: ReadinessVerdict;
  reason?: string;
};

export type ReadinessResult = {
  matterId: string;
  verdict: ReadinessVerdict;
  checks: ReadinessCheck[];
  blockerCount: number;
  reviewCount: number;
  missingCount: number;
  evaluatedAt: string;
};

function worstVerdict(verdicts: ReadinessVerdict[]): ReadinessVerdict {
  if (verdicts.includes("BLOCKED")) return "BLOCKED";
  if (verdicts.includes("ESCALATE_TO_NICHOLAS")) return "ESCALATE_TO_NICHOLAS";
  if (verdicts.includes("MISSING_INFO")) return "MISSING_INFO";
  if (verdicts.includes("REVIEW_REQUIRED")) return "REVIEW_REQUIRED";
  return "READY";
}

export async function evaluateExecutionReadiness(
  matterId: string,
  adminClient: SupabaseClient
): Promise<ReadinessResult> {
  const evaluatedAt = new Date().toISOString();

  // Fetch deal
  const { data: deal, error: dealError } = await adminClient
    .from("deals")
    .select(
      "id, deal_id, deal_status, payment_status, destination_country, document_type, client_user_id"
    )
    .eq("id", matterId)
    .single();

  if (dealError || !deal) {
    return {
      matterId,
      verdict: "REVIEW_REQUIRED",
      checks: [
        {
          id: "database_access",
          label: "Database Access",
          passed: false,
          verdict: "REVIEW_REQUIRED",
          reason: "Matter data unavailable",
        },
      ],
      blockerCount: 0,
      reviewCount: 1,
      missingCount: 0,
      evaluatedAt,
    };
  }

  // Fetch va_tasks for this matter
  const { data: tasks } = await adminClient
    .from("va_tasks")
    .select("id, task_type, status")
    .eq("matter_id", matterId);

  const taskList = tasks ?? [];

  const checks: ReadinessCheck[] = [];

  // 1. payment_confirmed
  const paymentPassed = deal.payment_status === "paid";
  checks.push({
    id: "payment_confirmed",
    label: "Payment Confirmed",
    passed: paymentPassed,
    verdict: paymentPassed ? "READY" : "BLOCKED",
    reason: paymentPassed ? undefined : "Payment required before execution",
  });

  // 2. destination_country
  const destPassed = deal.destination_country != null;
  checks.push({
    id: "destination_country",
    label: "Destination Country",
    passed: destPassed,
    verdict: destPassed ? "READY" : "MISSING_INFO",
    reason: destPassed ? undefined : "Destination country required",
  });

  // 3. document_type
  const docTypePassed = deal.document_type != null;
  checks.push({
    id: "document_type",
    label: "Document Type",
    passed: docTypePassed,
    verdict: docTypePassed ? "READY" : "MISSING_INFO",
    reason: docTypePassed ? undefined : "Document type required",
  });

  // 4. signer_info
  const signerTask = taskList.find(
    (t) =>
      t.task_type === "signer_confirmation" &&
      t.status === "COMPLETE"
  );
  checks.push({
    id: "signer_info",
    label: "Signer Confirmation",
    passed: !!signerTask,
    verdict: signerTask ? "READY" : "REVIEW_REQUIRED",
    reason: signerTask ? undefined : "Signer confirmation not completed",
  });

  // 5. receiving_authority
  let receivingAuthorityPassed = false;
  try {
    const { data: ra } = await adminClient
      .from("receiving_authorities")
      .select("id")
      .eq("destination_country", deal.destination_country ?? "")
      .eq("document_type", deal.document_type ?? "")
      .maybeSingle();
    receivingAuthorityPassed = !!ra;
  } catch {
    receivingAuthorityPassed = false;
  }
  checks.push({
    id: "receiving_authority",
    label: "Receiving Authority",
    passed: receivingAuthorityPassed,
    verdict: receivingAuthorityPassed ? "READY" : "REVIEW_REQUIRED",
    reason: receivingAuthorityPassed
      ? undefined
      : "Receiving authority not confirmed — manual routing review required",
  });

  // 6. apostille_route
  const statusStr: string = deal.deal_status ?? "";
  const apostillePassed = !statusStr.includes("compliance");
  checks.push({
    id: "apostille_route",
    label: "Apostille Route",
    passed: apostillePassed,
    verdict: apostillePassed ? "READY" : "REVIEW_REQUIRED",
    reason: apostillePassed ? undefined : "Apostille route under review",
  });

  // 7. courier_address
  const courierTask = taskList.find(
    (t) => t.task_type === "courier_review" && t.status === "COMPLETE"
  );
  checks.push({
    id: "courier_address",
    label: "Courier Address",
    passed: !!courierTask,
    verdict: courierTask ? "READY" : "REVIEW_REQUIRED",
    reason: courierTask ? undefined : "Courier address not confirmed",
  });

  const verdict = worstVerdict(checks.map((c) => c.verdict));
  const blockerCount = checks.filter((c) => c.verdict === "BLOCKED").length;
  const reviewCount = checks.filter(
    (c) => c.verdict === "REVIEW_REQUIRED"
  ).length;
  const missingCount = checks.filter(
    (c) => c.verdict === "MISSING_INFO"
  ).length;

  return {
    matterId,
    verdict,
    checks,
    blockerCount,
    reviewCount,
    missingCount,
    evaluatedAt,
  };
}
