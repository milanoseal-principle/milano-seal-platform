export type ExecutionMethod = "ron" | "mobile" | "in_person" | "other" | "unknown";
export type NotarialAct = "jurat" | "acknowledgment" | "oath_only" | "copy_certification" | "other" | "unknown";
export type RequirementState = "required" | "not_required" | "unknown" | "already_completed";

export interface DynamicSessionPlaybookInput {
  matterId: string;
  matterLabel: string;
  documentType: string;
  destinationCountry?: string | null;
  executionMethod: ExecutionMethod;
  notarialAct: NotarialAct;
  estimatedSessionMinutes?: number | null;
  requiredDocuments?: string[];
  requiredStatements?: string[];
  oathState?: RequirementState;
  witnessState?: RequirementState;
  witnessCount?: number | null;
  translatorState?: RequirementState;
  looseCertificateState?: RequirementState;
  postSessionActions?: string[];
  operatorNotes?: string[];
}

export interface DynamicSessionPlaybook {
  matterId: string;
  matterLabel: string;
  documentType: string;
  destinationCountry: string | null;
  executionMethod: ExecutionMethod;
  notarialAct: NotarialAct;
  estimatedSessionMinutes: number | null;
  requiredDocuments: string[];
  requiredStatements: string[];
  oathState: RequirementState;
  witnessState: RequirementState;
  witnessCount: number | null;
  translatorState: RequirementState;
  looseCertificateState: RequirementState;
  postSessionActions: string[];
  operatorNotes: string[];
  blockers: string[];
  readyForOperatorUse: boolean;
}

const clean = (values: string[] | undefined): string[] =>
  Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const asArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\r?\n|\s*;\s*/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

function normalizeExecutionMethod(value: unknown): ExecutionMethod {
  const normalized = asString(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (["ron", "remote", "remote_online", "remote_online_notarization"].includes(normalized)) return "ron";
  if (["mobile", "mobile_notary", "travel"].includes(normalized)) return "mobile";
  if (["in_person", "inperson", "office", "physical"].includes(normalized)) return "in_person";
  if (normalized) return "other";
  return "unknown";
}

function normalizeNotarialAct(value: unknown): NotarialAct {
  const normalized = asString(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (["jurat", "oath_jurat"].includes(normalized)) return "jurat";
  if (["acknowledgment", "acknowledgement", "ack"].includes(normalized)) return "acknowledgment";
  if (["oath", "oath_only", "affirmation"].includes(normalized)) return "oath_only";
  if (["copy_certification", "copy_certificate", "certified_copy"].includes(normalized)) return "copy_certification";
  if (normalized) return "other";
  return "unknown";
}

function normalizeRequirementState(stateValue: unknown, booleanValue?: unknown): RequirementState {
  const state = asString(stateValue).toLowerCase().replace(/[\s-]+/g, "_");
  if (["required", "yes", "true"].includes(state)) return "required";
  if (["not_required", "no", "false"].includes(state)) return "not_required";
  if (["already_completed", "completed", "done"].includes(state)) return "already_completed";
  if (booleanValue === true) return "required";
  if (booleanValue === false) return "not_required";
  return "unknown";
}

/**
 * Builds the exact operator session from already-resolved canonical facts.
 * This function deliberately does not infer a notarial act, witness requirement,
 * translator requirement, apostille route, or execution method. Unknown execution
 * facts remain blockers so the operator cannot treat an AI guess as binding truth.
 */
export function buildDynamicSessionPlaybook(
  input: DynamicSessionPlaybookInput,
): DynamicSessionPlaybook {
  const blockers: string[] = [];

  if (!input.matterId.trim()) blockers.push("Matter ID is required.");
  if (!input.documentType.trim()) blockers.push("Document type is required.");
  if (input.executionMethod === "unknown") blockers.push("Execution method is not confirmed.");
  if (input.notarialAct === "unknown") blockers.push("Notarial act is not confirmed.");

  const oathState = input.oathState ?? "unknown";
  const witnessState = input.witnessState ?? "unknown";
  const translatorState = input.translatorState ?? "unknown";
  const looseCertificateState = input.looseCertificateState ?? "unknown";

  if (oathState === "unknown" && input.notarialAct === "jurat") {
    blockers.push("Oath/affirmation requirement must be confirmed for the jurat session.");
  }
  if (witnessState === "unknown") blockers.push("Witness requirement is not confirmed.");
  if (witnessState === "required" && (!input.witnessCount || input.witnessCount < 1)) {
    blockers.push("Witness count is required when witnesses are required.");
  }
  if (translatorState === "unknown") blockers.push("Translator requirement is not confirmed.");
  if (looseCertificateState === "unknown") blockers.push("Loose-certificate requirement is not confirmed.");

  const estimatedSessionMinutes =
    typeof input.estimatedSessionMinutes === "number" && input.estimatedSessionMinutes > 0
      ? Math.round(input.estimatedSessionMinutes)
      : null;

  return {
    matterId: input.matterId,
    matterLabel: input.matterLabel,
    documentType: input.documentType,
    destinationCountry: input.destinationCountry?.trim() || null,
    executionMethod: input.executionMethod,
    notarialAct: input.notarialAct,
    estimatedSessionMinutes,
    requiredDocuments: clean(input.requiredDocuments),
    requiredStatements: clean(input.requiredStatements),
    oathState,
    witnessState,
    witnessCount: witnessState === "required" ? input.witnessCount ?? null : null,
    translatorState,
    looseCertificateState,
    postSessionActions: clean(input.postSessionActions),
    operatorNotes: clean(input.operatorNotes),
    blockers,
    readyForOperatorUse: blockers.length === 0,
  };
}

/**
 * Adapter from the existing canonical Matter/deal record. It reads only fields
 * that are already stored. Missing facts remain unknown and block operator use.
 */
export function buildDynamicSessionPlaybookFromMatterRecord(
  matter: Record<string, unknown>,
): DynamicSessionPlaybook {
  const matterId =
    asString(matter.id) || asString(matter.deal_id) || asString(matter.matter_id);
  const documentType =
    asString(matter.document_type) || asString(matter.documentType) || "";
  const matterLabel =
    asString(matter.matter_label) || asString(matter.matterLabel) || documentType || matterId;

  return buildDynamicSessionPlaybook({
    matterId,
    matterLabel,
    documentType,
    destinationCountry:
      asString(matter.destination_country) || asString(matter.destinationCountry) || null,
    executionMethod: normalizeExecutionMethod(
      matter.execution_method ?? matter.executionMethod ?? matter.signing_type,
    ),
    notarialAct: normalizeNotarialAct(matter.notarial_act ?? matter.notarialAct),
    estimatedSessionMinutes: asNumber(
      matter.estimated_session_minutes ?? matter.estimatedSessionMinutes,
    ),
    requiredDocuments: asArray(matter.required_documents ?? matter.requiredDocuments),
    requiredStatements: asArray(matter.required_statements ?? matter.requiredStatements),
    oathState: normalizeRequirementState(matter.oath_state, matter.oath_required),
    witnessState: normalizeRequirementState(
      matter.witness_state,
      matter.witness_required ?? matter.witnesses_required,
    ),
    witnessCount: asNumber(matter.witness_count ?? matter.witnessCount),
    translatorState: normalizeRequirementState(
      matter.translator_state,
      matter.translator_required,
    ),
    looseCertificateState: normalizeRequirementState(
      matter.loose_certificate_state,
      matter.loose_certificate_required,
    ),
    postSessionActions: asArray(
      matter.post_session_actions ?? matter.postSessionActions,
    ),
    operatorNotes: asArray(matter.operator_session_notes ?? matter.operatorNotes),
  });
}

export function sessionPlaybookLabel(playbook: DynamicSessionPlaybook): string {
  const destination = playbook.destinationCountry ? ` → ${playbook.destinationCountry}` : "";
  return `${playbook.documentType}${destination}`;
}
