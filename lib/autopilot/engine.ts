/**
 * Matter Intelligence Autopilot Engine
 *
 * Generates automation suggestions triggered by matter status transitions.
 * ALL suggestions require operator confirmation before execution.
 * This engine never executes — it only recommends.
 *
 * Safeguards (hard-coded, never overridable by config):
 * - Cannot mark payment confirmed
 * - Cannot release documents
 * - Cannot override QA gates
 * - Cannot override authority confidence
 * - Cannot override protected identifier lock
 */

export type AutopilotTrigger =
  | "PAYMENT_CONFIRMED"
  | "EXECUTION_SCHEDULED"
  | "EXECUTION_COMPLETED"
  | "APOSTILLE_COMPLETED"
  | "DELIVERED";

export type AutopilotTaskType =
  | "SCHEDULE_NOTARY"
  | "GENERATE_INTAKE_REVIEW"
  | "GENERATE_AUTHORITY_REVIEW"
  | "VERIFY_WITNESS"
  | "PREPARE_RON_SESSION"
  | "PREPARE_EXECUTION_PACKET"
  | "PREPARE_APOSTILLE_PACKET"
  | "PREPARE_COURIER_RELEASE"
  | "PREPARE_TRANSLATION_REVIEW"
  | "GENERATE_FINAL_QA"
  | "CREATE_COURIER_LABEL"
  | "PREPARE_RELEASE_REVIEW"
  | "GENERATE_CERTIFICATE"
  | "ARCHIVE_MATTER"
  | "GENERATE_CLIENT_FOLLOWUP";

export type AutopilotTaskStatus =
  | "pending_confirmation"   // waiting for operator to confirm
  | "confirmed"              // operator confirmed, ready to execute
  | "executing"              // in progress
  | "completed"              // done
  | "blocked"                // missing data or gate failure
  | "dismissed";             // operator dismissed

export type AutopilotAssignee = "operator" | "va" | "coordinator";

export interface AutopilotTask {
  id: string;
  trigger: AutopilotTrigger;
  task_type: AutopilotTaskType;
  matter_id: string;
  matter_label: string;           // "Italy / Power of Attorney" — no client name
  priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  status: AutopilotTaskStatus;
  assignee: AutopilotAssignee;
  required_action: string;        // operator-facing instruction
  blocker_reason: string | null;  // why it's blocked, if blocked
  requires_operator_confirmation: true;  // always true — autopilot never auto-executes
  safeguard_note: string;         // what this task cannot do
  generated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
}

export interface AutopilotInput {
  matter_id: string;
  country_id: string;
  document_id: string;
  matter_status: string | null;
  payment_status: string | null;
  is_paid_and_released: boolean;
  is_notarized: boolean;
  has_apostille: boolean;
  has_translation: boolean;
  has_scheduled: boolean;
  courier_status: string | null;
  requires_qa_checklist: boolean;
  ron_eligible: boolean;
  witness_required: boolean;
  translation_required: boolean;
  apostille_required: boolean;
}

export interface AutopilotResult {
  matter_id: string;
  trigger: AutopilotTrigger | null;
  tasks: AutopilotTask[];
  blocked_tasks: AutopilotTask[];
  pending_confirmation: AutopilotTask[];
  completed_tasks: AutopilotTask[];
  summary: string;
}

const TRIGGER_MAP: Record<string, AutopilotTrigger> = {
  "payment_confirmed": "PAYMENT_CONFIRMED",
  "scheduled": "EXECUTION_SCHEDULED",
  "in_execution": "EXECUTION_COMPLETED",
  "apostille_processing": "APOSTILLE_COMPLETED",
  "delivered": "DELIVERED",
  "completed": "DELIVERED",
};

function makeTask(
  trigger: AutopilotTrigger,
  matter_id: string,
  matter_label: string,
  type: AutopilotTaskType,
  priority: AutopilotTask["priority"],
  assignee: AutopilotAssignee,
  required_action: string,
  safeguard_note: string,
  blocker_reason: string | null = null,
): AutopilotTask {
  return {
    id: `ap-${matter_id.substring(0, 8)}-${type.toLowerCase().replace(/_/g, "-")}-${Date.now()}`,
    trigger,
    task_type: type,
    matter_id,
    matter_label,
    priority,
    status: blocker_reason ? "blocked" : "pending_confirmation",
    assignee,
    required_action,
    blocker_reason,
    requires_operator_confirmation: true,
    safeguard_note,
    generated_at: new Date().toISOString(),
    confirmed_at: null,
    completed_at: null,
  };
}

export function generateAutopilotTasks(input: AutopilotInput): AutopilotTask[] {
  const tasks: AutopilotTask[] = [];
  const trigger = TRIGGER_MAP[input.matter_status ?? ""] ?? null;
  const label = `${input.country_id.replace(/-/g, " ")} / ${input.document_id.replace(/-/g, " ")}`;

  if (!trigger) return [];

  // ── PAYMENT_CONFIRMED ──────────────────────────────────────────────────────

  if (trigger === "PAYMENT_CONFIRMED") {
    tasks.push(makeTask(
      trigger, input.matter_id, label,
      "SCHEDULE_NOTARY", "HIGH", "coordinator",
      "Payment confirmed. Schedule the notarization / execution session with the client.",
      "Cannot mark session as scheduled without operator or coordinator action.",
    ));

    tasks.push(makeTask(
      trigger, input.matter_id, label,
      "GENERATE_INTAKE_REVIEW", "NORMAL", "va",
      "Review intake documents for completeness before execution session.",
      "Cannot approve or reject intake — flags for operator review only.",
    ));

    if (input.apostille_required) {
      tasks.push(makeTask(
        trigger, input.matter_id, label,
        "GENERATE_AUTHORITY_REVIEW", "NORMAL", "va",
        "Confirm receiving authority requirements and apostille route for this corridor.",
        "Cannot promote authority confidence — flags for operator review only.",
      ));
    }
  }

  // ── EXECUTION_SCHEDULED ───────────────────────────────────────────────────

  if (trigger === "EXECUTION_SCHEDULED") {
    if (input.witness_required) {
      tasks.push(makeTask(
        trigger, input.matter_id, label,
        "VERIFY_WITNESS", "HIGH", "coordinator",
        "Confirm witness availability for execution session. Witnesses may not be related to the principal.",
        "Cannot confirm witnesses without coordinator action.",
      ));
    }

    if (input.ron_eligible) {
      tasks.push(makeTask(
        trigger, input.matter_id, label,
        "PREPARE_RON_SESSION", "HIGH", "operator",
        "Prepare Remote Online Notarization session. Confirm platform, link, and signer access.",
        "Cannot initiate RON session — operator must prepare and send access link.",
      ));
    }

    tasks.push(makeTask(
      trigger, input.matter_id, label,
      "PREPARE_EXECUTION_PACKET", "NORMAL", "va",
      "Prepare execution packet: confirm document version, notary commission currency, and witness requirements.",
      "Cannot execute documents — prepares packet for operator review only.",
    ));

    if (input.requires_qa_checklist) {
      tasks.push(makeTask(
        trigger, input.matter_id, label,
        "GENERATE_FINAL_QA", "HIGH", "operator",
        "Complete pre-execution QA checklist. Required for Italy matters and high-friction corridors.",
        "Cannot override QA gate — operator must complete checklist before execution proceeds.",
      ));
    }
  }

  // ── EXECUTION_COMPLETED ───────────────────────────────────────────────────

  if (trigger === "EXECUTION_COMPLETED") {
    if (input.apostille_required) {
      tasks.push(makeTask(
        trigger, input.matter_id, label,
        "PREPARE_APOSTILLE_PACKET", "HIGH", "va",
        "Documents executed. Prepare apostille filing packet for Florida Department of State submission.",
        "Cannot file for apostille — prepares packet for operator action.",
      ));
    }

    if (input.translation_required && !input.has_translation) {
      tasks.push(makeTask(
        trigger, input.matter_id, label,
        "PREPARE_TRANSLATION_REVIEW", "HIGH", "operator",
        "Translation required. Confirm certified translator assignment and language.",
        "Cannot assign translator — operator must confirm certified translator.",
      ));
    }
  }

  // ── APOSTILLE_COMPLETED ───────────────────────────────────────────────────

  if (trigger === "APOSTILLE_COMPLETED") {
    tasks.push(makeTask(
      trigger, input.matter_id, label,
      "CREATE_COURIER_LABEL", "HIGH", "operator",
      "Apostille complete. Generate Shippo courier label for international release.",
      "Cannot create courier label without operator action in the courier module.",
    ));

    tasks.push(makeTask(
      trigger, input.matter_id, label,
      "PREPARE_RELEASE_REVIEW", "HIGH", "operator",
      "Final review before courier release. Confirm document count, addresses, and apostille completeness.",
      "Cannot approve release — operator must complete release review.",
    ));
  }

  // ── DELIVERED ─────────────────────────────────────────────────────────────

  if (trigger === "DELIVERED") {
    tasks.push(makeTask(
      trigger, input.matter_id, label,
      "GENERATE_CERTIFICATE", "NORMAL", "operator",
      "Matter delivered. Generate Certificate of Digital Custody and share verification link with client.",
      "Cannot generate certificate without operator action. Requires PAID_AND_RELEASED confirmation.",
      input.is_paid_and_released ? null : "Matter must reach PAID_AND_RELEASED before certificate generation.",
    ));

    tasks.push(makeTask(
      trigger, input.matter_id, label,
      "ARCHIVE_MATTER", "LOW", "operator",
      "Archive matter record. Confirm all documents are in vault and custody ledger is complete.",
      "Cannot archive — operator must confirm completeness before archiving.",
    ));

    tasks.push(makeTask(
      trigger, input.matter_id, label,
      "GENERATE_CLIENT_FOLLOWUP", "LOW", "coordinator",
      "Send client follow-up: confirm document receipt and provide verification link.",
      "Cannot send external communications — coordinator must initiate from outside the system.",
    ));
  }

  return tasks;
}

export function buildAutopilotResult(input: AutopilotInput): AutopilotResult {
  const trigger = (TRIGGER_MAP[input.matter_status ?? ""] ?? null) as AutopilotTrigger | null;
  const tasks = generateAutopilotTasks(input);

  const blocked = tasks.filter(t => t.status === "blocked");
  const pending = tasks.filter(t => t.status === "pending_confirmation");
  const completed = tasks.filter(t => t.status === "completed");

  const summary = tasks.length === 0
    ? "No autopilot tasks for current matter status."
    : blocked.length > 0
    ? `${tasks.length} task${tasks.length > 1 ? "s" : ""} generated. ${blocked.length} blocked — operator review required.`
    : `${tasks.length} task${tasks.length > 1 ? "s" : ""} pending operator confirmation.`;

  return {
    matter_id: input.matter_id,
    trigger,
    tasks,
    blocked_tasks: blocked,
    pending_confirmation: pending,
    completed_tasks: completed,
    summary,
  };
}
