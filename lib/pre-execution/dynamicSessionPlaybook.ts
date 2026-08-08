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

export function sessionPlaybookLabel(playbook: DynamicSessionPlaybook): string {
  const destination = playbook.destinationCountry ? ` → ${playbook.destinationCountry}` : "";
  return `${playbook.documentType}${destination}`;
}
