// ─── Types ───────────────────────────────────────────────────────────────────

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

export type AutopilotTaskStatus = "PENDING" | "CONFIRMED" | "DISMISSED" | "BLOCKED" | "COMPLETED";

export interface AutopilotTask {
  id: string;
  matter_id: string;
  trigger: AutopilotTrigger;
  task_type: AutopilotTaskType;
  label: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "NORMAL";
  status: AutopilotTaskStatus;
  requires_operator_confirmation: true; // always true — autopilot never executes
  blocked_reason?: string;
  generated_at: string;
}

export interface AutopilotInput {
  matter_id: string;
  matter_status: string | null;
  payment_status: string | null;
  destination_country: string | null;
  document_type: string | null;
  witness_required?: boolean;
  ron_eligible?: boolean;
  translation_required?: boolean;
  apostille_required?: boolean;
  consular_required?: boolean;
  is_paid_and_released?: boolean;
}

export interface AutopilotResult {
  matter_id: string;
  trigger: AutopilotTrigger | null;
  tasks: AutopilotTask[];
  blocked: AutopilotTask[];
  pending_confirmation: AutopilotTask[];
  total_tasks: number;
  can_auto_drive: false; // Autopilot recommends only. Operator confirmation required before any task executes.
}

// ─── Trigger detection ───────────────────────────────────────────────────────

function detectTrigger(matter_status: string | null): AutopilotTrigger | null {
  switch (matter_status) {
    case "payment_confirmed":
      return "PAYMENT_CONFIRMED";
    case "scheduled":
      return "EXECUTION_SCHEDULED";
    case "in_execution":
      return "EXECUTION_COMPLETED";
    case "apostille_processing":
      return "APOSTILLE_COMPLETED";
    case "delivered":
      return "DELIVERED";
    default:
      return null;
  }
}

// ─── Task definitions ────────────────────────────────────────────────────────

const TASK_META: Record<AutopilotTaskType, { label: string; description: string }> = {
  SCHEDULE_NOTARY: {
    label: "Schedule Notary",
    description: "Coordinate notary appointment based on matter and document requirements.",
  },
  GENERATE_INTAKE_REVIEW: {
    label: "Generate Intake Review",
    description: "Review intake documents for completeness and accuracy before proceeding.",
  },
  GENERATE_AUTHORITY_REVIEW: {
    label: "Generate Authority Review",
    description: "Verify issuing authority credentials and chain of custody documentation.",
  },
  VERIFY_WITNESS: {
    label: "Verify Witness",
    description: "Confirm witness identity and eligibility for execution proceedings.",
  },
  PREPARE_RON_SESSION: {
    label: "Prepare RON Session",
    description: "Set up Remote Online Notarization session for eligible matter.",
  },
  PREPARE_EXECUTION_PACKET: {
    label: "Prepare Execution Packet",
    description: "Assemble all documents required for scheduled execution.",
  },
  PREPARE_APOSTILLE_PACKET: {
    label: "Prepare Apostille Packet",
    description: "Compile documents and cover sheets for apostille submission.",
  },
  PREPARE_COURIER_RELEASE: {
    label: "Prepare Courier Release",
    description: "Stage documents and release authorization for courier dispatch.",
  },
  PREPARE_TRANSLATION_REVIEW: {
    label: "Prepare Translation Review",
    description: "Queue documents requiring certified translation for destination country.",
  },
  GENERATE_FINAL_QA: {
    label: "Generate Final QA",
    description: "Run final quality assurance check on completed execution documents.",
  },
  CREATE_COURIER_LABEL: {
    label: "Create Courier Label",
    description: "Generate shipping label and tracking details for document delivery.",
  },
  PREPARE_RELEASE_REVIEW: {
    label: "Prepare Release Review",
    description: "Review all release conditions before authorizing courier dispatch.",
  },
  GENERATE_CERTIFICATE: {
    label: "Generate Certificate",
    description: "Issue completion certificate upon successful matter delivery.",
  },
  ARCHIVE_MATTER: {
    label: "Archive Matter",
    description: "Archive matter records and close all open action items.",
  },
  GENERATE_CLIENT_FOLLOWUP: {
    label: "Generate Client Follow-up",
    description: "Prepare post-delivery follow-up communication for client.",
  },
};

// ─── Task generator ──────────────────────────────────────────────────────────

function makeTask(
  matter_id: string,
  trigger: AutopilotTrigger,
  task_type: AutopilotTaskType,
  priority: "CRITICAL" | "HIGH" | "NORMAL",
  status: AutopilotTaskStatus = "PENDING",
  blocked_reason?: string
): AutopilotTask {
  const meta = TASK_META[task_type];
  return {
    id: crypto.randomUUID(),
    matter_id,
    trigger,
    task_type,
    label: meta.label,
    description: meta.description,
    priority,
    status,
    requires_operator_confirmation: true as const,
    ...(blocked_reason ? { blocked_reason } : {}),
    generated_at: new Date().toISOString(),
  };
}

export function generateAutopilotTasks(input: AutopilotInput): AutopilotTask[] {
  const trigger = detectTrigger(input.matter_status);
  if (!trigger) return [];

  const { matter_id } = input;
  const tasks: AutopilotTask[] = [];

  switch (trigger) {
    case "PAYMENT_CONFIRMED":
      tasks.push(makeTask(matter_id, trigger, "GENERATE_INTAKE_REVIEW", "HIGH"));
      tasks.push(makeTask(matter_id, trigger, "GENERATE_AUTHORITY_REVIEW", "HIGH"));
      tasks.push(makeTask(matter_id, trigger, "SCHEDULE_NOTARY", "CRITICAL"));
      break;

    case "EXECUTION_SCHEDULED":
      if (input.witness_required) {
        tasks.push(makeTask(matter_id, trigger, "VERIFY_WITNESS", "HIGH"));
      }
      if (input.ron_eligible) {
        tasks.push(makeTask(matter_id, trigger, "PREPARE_RON_SESSION", "HIGH"));
      }
      tasks.push(makeTask(matter_id, trigger, "PREPARE_EXECUTION_PACKET", "CRITICAL"));
      if (input.translation_required) {
        tasks.push(makeTask(matter_id, trigger, "PREPARE_TRANSLATION_REVIEW", "NORMAL"));
      }
      break;

    case "EXECUTION_COMPLETED":
      if (input.apostille_required) {
        tasks.push(makeTask(matter_id, trigger, "PREPARE_APOSTILLE_PACKET", "CRITICAL"));
      } else if (input.consular_required) {
        tasks.push(
          makeTask(
            matter_id,
            trigger,
            "PREPARE_APOSTILLE_PACKET",
            "CRITICAL",
            "BLOCKED",
            "Consular route — apostille not applicable."
          )
        );
      } else {
        // apostille_required is false (and not consular) — still add as BLOCKED
        tasks.push(
          makeTask(
            matter_id,
            trigger,
            "PREPARE_APOSTILLE_PACKET",
            "CRITICAL",
            "BLOCKED",
            "Apostille not required for this corridor"
          )
        );
      }
      tasks.push(makeTask(matter_id, trigger, "PREPARE_COURIER_RELEASE", "NORMAL"));
      tasks.push(makeTask(matter_id, trigger, "GENERATE_FINAL_QA", "HIGH"));
      break;

    case "APOSTILLE_COMPLETED":
      tasks.push(makeTask(matter_id, trigger, "CREATE_COURIER_LABEL", "HIGH"));
      tasks.push(makeTask(matter_id, trigger, "PREPARE_RELEASE_REVIEW", "CRITICAL"));
      break;

    case "DELIVERED":
      tasks.push(makeTask(matter_id, trigger, "GENERATE_CERTIFICATE", "HIGH"));
      tasks.push(makeTask(matter_id, trigger, "GENERATE_CLIENT_FOLLOWUP", "NORMAL"));
      tasks.push(makeTask(matter_id, trigger, "ARCHIVE_MATTER", "NORMAL"));
      break;
  }

  return tasks;
}

export function buildAutopilotResult(input: AutopilotInput): AutopilotResult {
  const trigger = detectTrigger(input.matter_status);
  const tasks = generateAutopilotTasks(input);

  const blocked = tasks.filter((t) => t.status === "BLOCKED");
  const pending_confirmation = tasks.filter((t) => t.status === "PENDING");

  return {
    matter_id: input.matter_id,
    trigger,
    tasks,
    blocked,
    pending_confirmation,
    total_tasks: tasks.length,
    can_auto_drive: false, // Autopilot recommends only. Operator confirmation required before any task executes.
  };
}
