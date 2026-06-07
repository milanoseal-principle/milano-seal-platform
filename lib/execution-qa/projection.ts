// Safe fields for operator QA display — never expose operator_notes to client surfaces
const SAFE_QA_FIELDS = [
  "id",
  "deal_id",
  "execution_qa_status",
  "scanback_status",
  "witness_status",
  "checklist_type",
  "missing_items",
  "blocking_items",
  "reviewed_at",
  "passed_at",
  "blocked_at",
  "created_at",
  "updated_at",
];

export const QA_SELECT = SAFE_QA_FIELDS.join(", ");

// Client-safe portal copy — never expose internal QA details
export function getClientSafeQAStatus(qaStatus: string): string {
  if (qaStatus === "PASSED") return "Execution Review Complete";
  if (qaStatus === "REVIEW_REQUIRED") return "Coordinator Review Required";
  if (qaStatus === "BLOCKED") return "Document Review In Progress";
  if (qaStatus === "IN_REVIEW") return "Execution Review Pending";
  return "Under Coordinator Review";
}
