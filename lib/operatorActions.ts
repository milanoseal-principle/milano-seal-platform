/**
 * Operator Action Engine
 *
 * Derives the priority operator action queue for any matter given its state.
 * Operator-only — never exposed to portal or client surfaces.
 */

export type OperatorActionPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
export type OperatorActionCategory =
  | "payment"
  | "scheduling"
  | "document_review"
  | "authority"
  | "apostille"
  | "courier"
  | "compliance"
  | "communication";

export interface OperatorAction {
  id: string;
  priority: OperatorActionPriority;
  category: OperatorActionCategory;
  label: string;
  description: string;
  cta: string;                    // Button label
  route: string | null;           // Dashboard route if actionable
  blocked_by: string | null;      // Another action id that must complete first
  auto_resolvable: boolean;       // Whether system can mark this done without operator input
}

export interface OperatorActionQueue {
  matter_id: string | null;
  total_actions: number;
  critical_count: number;
  next_action: OperatorAction | null;
  actions: OperatorAction[];
  operator_summary: string;
}

export interface MatterActionInput {
  matter_id?: string | null;
  deal_status?: string | null;
  payment_status?: string | null;
  is_paid_and_released?: boolean;
  destination_country?: string | null;
  document_type?: string | null;
  client_name?: string | null;
  is_notarized?: boolean;
  has_apostille?: boolean;
  has_translation?: boolean;
  has_scheduled?: boolean;
  courier_status?: string | null;
  // Authority intelligence overlay
  authority_confidence?: string | null;
  chain_certification_status?: string | null;
  requires_qa_checklist?: boolean;
}

export function computeOperatorActions(input: MatterActionInput): OperatorActionQueue {
  const actions: OperatorAction[] = [];

  const isPaid =
    input.payment_status === "paid" ||
    input.payment_status === "confirmed" ||
    input.payment_status === "payment_confirmed" ||
    input.deal_status === "payment_confirmed" ||
    !!input.is_paid_and_released;

  const isScheduled = input.has_scheduled ?? false;
  const isNotarized = input.is_notarized ?? false;
  const hasApostille = input.has_apostille ?? false;
  const courierStatus = input.courier_status ?? null;

  const status = input.deal_status ?? "";

  // ── Payment ────────────────────────────────────────────────────────────────

  if (!isPaid && status !== "closed" && status !== "completed") {
    actions.push({
      id: "send_payment_link",
      priority: "HIGH",
      category: "payment",
      label: "Send Payment Reference",
      description: "Matter is pending payment. Send the Wise payment reference to client.",
      cta: "Send Wise Reference",
      route: input.matter_id ? `/dashboard/deals/${input.matter_id}` : "/dashboard/deals",
      blocked_by: null,
      auto_resolvable: false,
    });
  }

  if (isPaid && !isScheduled && status !== "closed" && status !== "completed") {
    actions.push({
      id: "schedule_execution",
      priority: "HIGH",
      category: "scheduling",
      label: "Schedule Execution Session",
      description: "Payment confirmed. Schedule the notarization / execution session.",
      cta: "Schedule Session",
      route: input.matter_id ? `/dashboard/deals/${input.matter_id}` : "/dashboard/deals",
      blocked_by: null,
      auto_resolvable: false,
    });
  }

  // ── Authority chain ────────────────────────────────────────────────────────

  const chainStatus = input.chain_certification_status ?? null;
  if (
    chainStatus === "INCOMPLETE" ||
    chainStatus === "NO_CHAIN" ||
    input.authority_confidence === "VERIFICATION_REQUIRED"
  ) {
    actions.push({
      id: "verify_authority_chain",
      priority: "CRITICAL",
      category: "authority",
      label: "Authority Chain Requires Verification",
      description:
        "Receiving authority chain is incomplete or unverified. Do not proceed to execution until chain is certified.",
      cta: "Review Authority Chain",
      route: "/dashboard/authorities",
      blocked_by: null,
      auto_resolvable: false,
    });
  }

  // ── QA checklist ──────────────────────────────────────────────────────────

  if (input.requires_qa_checklist && isScheduled && !isNotarized) {
    actions.push({
      id: "qa_checklist",
      priority: "HIGH",
      category: "compliance",
      label: "Complete Pre-Execution QA Checklist",
      description:
        "This matter requires a QA checklist review before execution. Italy matters and high-friction corridors require this.",
      cta: "Open QA Checklist",
      route: input.matter_id ? `/dashboard/deals/${input.matter_id}` : "/dashboard/deals",
      blocked_by: "schedule_execution",
      auto_resolvable: false,
    });
  }

  // ── Document review ────────────────────────────────────────────────────────

  if (isPaid && !isNotarized && isScheduled) {
    actions.push({
      id: "execute_documents",
      priority: "NORMAL",
      category: "document_review",
      label: "Execute Documents at Appointment",
      description: "Session is scheduled. Notarize/execute the documents at the confirmed appointment.",
      cta: "Mark Executed",
      route: input.matter_id ? `/dashboard/deals/${input.matter_id}` : "/dashboard/deals",
      blocked_by: "schedule_execution",
      auto_resolvable: false,
    });
  }

  // ── Apostille ─────────────────────────────────────────────────────────────

  if (isNotarized && !hasApostille) {
    actions.push({
      id: "file_apostille",
      priority: "HIGH",
      category: "apostille",
      label: "File for Apostille — Florida Dept of State",
      description: "Documents are executed. File for apostille with the Florida Department of State.",
      cta: "Mark Apostille Filed",
      route: input.matter_id ? `/dashboard/deals/${input.matter_id}` : "/dashboard/deals",
      blocked_by: "execute_documents",
      auto_resolvable: false,
    });
  }

  // ── Courier ────────────────────────────────────────────────────────────────

  if (hasApostille && courierStatus !== "shipped" && courierStatus !== "delivered") {
    actions.push({
      id: "release_to_courier",
      priority: "HIGH",
      category: "courier",
      label: "Release to International Courier",
      description: "Apostille complete. Generate shipping label and release to courier.",
      cta: "Create Shipment",
      route: input.matter_id ? `/dashboard/deals/${input.matter_id}/courier` : "/dashboard/courier",
      blocked_by: "file_apostille",
      auto_resolvable: false,
    });
  }

  // ── Sort by priority ───────────────────────────────────────────────────────

  const priorityOrder: Record<OperatorActionPriority, number> = {
    CRITICAL: 0,
    HIGH: 1,
    NORMAL: 2,
    LOW: 3,
  };

  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const criticalCount = actions.filter((a) => a.priority === "CRITICAL").length;
  const nextAction = actions[0] ?? null;

  const operatorSummary =
    criticalCount > 0
      ? `${criticalCount} critical action${criticalCount > 1 ? "s" : ""} require immediate attention.`
      : nextAction
      ? `Next: ${nextAction.label}`
      : "No pending actions. Matter is on track.";

  return {
    matter_id: input.matter_id ?? null,
    total_actions: actions.length,
    critical_count: criticalCount,
    next_action: nextAction,
    actions,
    operator_summary: operatorSummary,
  };
}
