// lib/vaTasks.ts
// VA Task Intelligence — generates structured task queue from matter state.
// VA cannot: promote authority confidence, approve release, mark payment confirmed,
//            override QA gates, access revenue/margin/operator notes.

import { getAllianceExpansionTarget } from "@/lib/alliance/expansionTargets";
import { getCountryLanguageProfile } from "@/data/intelligence/languageProfiles";

export type VATaskType =
  | "AUTHORITY_DISCOVERY"
  | "SOURCE_VALIDATION"
  | "REQUIREMENT_EXTRACTION"
  | "REQUEST_MISSING_DOCUMENT"
  | "VERIFY_PROTECTED_IDENTIFIER"
  | "PREPARE_APOSTILLE_PACKET"
  | "CHECK_COURIER_STATUS"
  | "FOLLOW_UP_CLIENT"
  | "ESCALATE_TO_OPERATOR";

export type VATaskPriority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
export type VATaskStatus = "open" | "in_progress" | "completed" | "escalated";
export type VAAllowedRole = "va" | "operator";

export interface VATask {
  id: string;
  task_type: VATaskType;
  matter_id: string;
  matter_label: string; // "Italy / Birth Certificate" — no client name
  priority: VATaskPriority;
  due_date: string | null;
  required_action: string;
  escalation_required: boolean;
  escalation_note: string | null;
  allowed_role: VAAllowedRole;
  status: VATaskStatus;
  created_at: string;
}

export interface VATaskInput {
  matter_id: string;
  country_id: string;
  document_id: string;
  deal_status: string | null;
  payment_status: string | null;
  is_notarized: boolean;
  has_apostille: boolean;
  has_translation: boolean;
  courier_status: string | null;
  // Intelligence overlay
  missing_items: string[];
  authority_confidence: string | null;
  chain_certification_status: string | null;
  requires_qa_checklist: boolean;
}

export function generateVATasks(input: VATaskInput): VATask[] {
  const tasks: VATask[] = [];
  const now = new Date().toISOString();
  const matterLabel = `${input.country_id.replace(/-/g, " ")} / ${input.document_id.replace(/-/g, " ")}`;

  // Authority discovery if chain is incomplete
  if (
    input.chain_certification_status === "INCOMPLETE" ||
    input.chain_certification_status === "NO_CHAIN" ||
    input.authority_confidence === "VERIFICATION_REQUIRED"
  ) {
    tasks.push({
      id: `va-auth-${input.matter_id}-${Date.now()}`,
      task_type: "AUTHORITY_DISCOVERY",
      matter_id: input.matter_id,
      matter_label: matterLabel,
      priority: "HIGH",
      due_date: null,
      required_action:
        "Research and document the receiving authority requirements for this corridor. Submit findings for operator review. Do not promote authority confidence — operator must approve.",
      escalation_required: true,
      escalation_note:
        "Authority chain incomplete — operator must certify before execution.",
      allowed_role: "va",
      status: "open",
      created_at: now,
    });
  }

  // Missing document requests
  for (const item of input.missing_items) {
    if (item.toLowerCase().includes("translation")) {
      tasks.push({
        id: `va-trans-${input.matter_id}-${Date.now()}`,
        task_type: "REQUIREMENT_EXTRACTION",
        matter_id: input.matter_id,
        matter_label: matterLabel,
        priority: "NORMAL",
        due_date: null,
        required_action: `Confirm translation requirements: ${item}. Document the certified translator requirement and language for operator review.`,
        escalation_required: false,
        escalation_note: null,
        allowed_role: "va",
        status: "open",
        created_at: now,
      });
    } else if (
      item.toLowerCase().includes("id") ||
      item.toLowerCase().includes("passport") ||
      item.toLowerCase().includes("identifier")
    ) {
      tasks.push({
        id: `va-id-${input.matter_id}-${Date.now()}`,
        task_type: "VERIFY_PROTECTED_IDENTIFIER",
        matter_id: input.matter_id,
        matter_label: matterLabel,
        priority: "HIGH",
        due_date: null,
        required_action: `Verify protected identifier document: ${item}. Follow secure document handling protocol — do not store copies outside the secure vault.`,
        escalation_required: false,
        escalation_note: null,
        allowed_role: "va",
        status: "open",
        created_at: now,
      });
    } else {
      tasks.push({
        id: `va-missing-${input.matter_id}-${Date.now()}`,
        task_type: "REQUEST_MISSING_DOCUMENT",
        matter_id: input.matter_id,
        matter_label: matterLabel,
        priority: "NORMAL",
        due_date: null,
        required_action: `Request missing document from client: ${item}. Use approved client communication template only.`,
        escalation_required: false,
        escalation_note: null,
        allowed_role: "va",
        status: "open",
        created_at: now,
      });
    }
  }

  // Apostille packet prep
  if (input.is_notarized && !input.has_apostille) {
    tasks.push({
      id: `va-apostille-${input.matter_id}-${Date.now()}`,
      task_type: "PREPARE_APOSTILLE_PACKET",
      matter_id: input.matter_id,
      matter_label: matterLabel,
      priority: "HIGH",
      due_date: null,
      required_action:
        "Documents are executed. Prepare apostille filing packet for Florida Department of State. Confirm document count and ensure notary commission is current.",
      escalation_required: false,
      escalation_note: null,
      allowed_role: "va",
      status: "open",
      created_at: now,
    });
  }

  // Courier status check
  if (
    input.courier_status &&
    input.courier_status !== "delivered" &&
    input.courier_status !== "not_started"
  ) {
    tasks.push({
      id: `va-courier-${input.matter_id}-${Date.now()}`,
      task_type: "CHECK_COURIER_STATUS",
      matter_id: input.matter_id,
      matter_label: matterLabel,
      priority: "NORMAL",
      due_date: null,
      required_action:
        "Check courier tracking status and update matter record. Flag any delays to operator.",
      escalation_required: false,
      escalation_note: null,
      allowed_role: "va",
      status: "open",
      created_at: now,
    });
  }

  // QA checklist required
  if (input.requires_qa_checklist) {
    tasks.push({
      id: `va-qa-${input.matter_id}-${Date.now()}`,
      task_type: "SOURCE_VALIDATION",
      matter_id: input.matter_id,
      matter_label: matterLabel,
      priority: "HIGH",
      due_date: null,
      required_action:
        "QA checklist required for this matter. Validate all source documents against the matter checklist and submit completed checklist for operator review. Do not override QA gates.",
      escalation_required: true,
      escalation_note:
        "QA gate active — operator must approve before execution proceeds.",
      allowed_role: "va",
      status: "open",
      created_at: now,
    });
  }

  // Alliance expansion: authority research needed
  const allianceTarget = getAllianceExpansionTarget(input.country_id);
  if (allianceTarget?.authority_research_needed) {
    const alreadyHasAuthDiscovery = tasks.some((t) => t.task_type === "AUTHORITY_DISCOVERY");
    if (!alreadyHasAuthDiscovery) {
      tasks.push({
        id: `va-alliance-auth-${input.matter_id}-${Date.now()}`,
        task_type: "AUTHORITY_DISCOVERY",
        matter_id: input.matter_id,
        matter_label: matterLabel,
        priority: "HIGH",
        due_date: null,
        required_action:
          "Alliance expansion target: authority research is needed for this corridor. Research and document receiving authority requirements. Submit findings for operator review. Do not promote authority confidence.",
        escalation_required: true,
        escalation_note: "Alliance target corridor — operator must certify authority research before execution.",
        allowed_role: "va",
        status: "open",
        created_at: now,
      });
    }
  }

  // Alliance expansion: translation partner needed
  if (allianceTarget?.translation_partner_needed && !input.has_translation) {
    tasks.push({
      id: `va-alliance-trans-${input.matter_id}-${Date.now()}`,
      task_type: "SOURCE_VALIDATION",
      matter_id: input.matter_id,
      matter_label: matterLabel,
      priority: "NORMAL",
      due_date: null,
      required_action:
        "Alliance expansion target: translation partner coordination may be needed for this destination. Validate translation source and confirm partner availability with operator.",
      escalation_required: false,
      escalation_note: null,
      allowed_role: "va",
      status: "open",
      created_at: now,
    });
  }

  // Language profile missing for destination
  const languageProfile = getCountryLanguageProfile(input.country_id);
  if (!languageProfile) {
    const alreadyHasRequirementExtraction = tasks.some((t) => t.task_type === "REQUIREMENT_EXTRACTION");
    if (!alreadyHasRequirementExtraction) {
      tasks.push({
        id: `va-lang-missing-${input.matter_id}-${Date.now()}`,
        task_type: "REQUIREMENT_EXTRACTION",
        matter_id: input.matter_id,
        matter_label: matterLabel,
        priority: "NORMAL",
        due_date: null,
        required_action:
          "Language profile is not yet mapped for this destination. Research language review requirements and submit for operator review.",
        escalation_required: false,
        escalation_note: null,
        allowed_role: "va",
        status: "open",
        created_at: now,
      });
    }
  }

  return tasks;
}
