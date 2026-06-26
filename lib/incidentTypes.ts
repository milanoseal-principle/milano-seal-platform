// Compliance Incident Response — 18 incident types + workflow doctrine

export const INCIDENT_TYPES = [
  "IDENTIFIER_ERROR",
  "WRONG_NAME_EXECUTED",
  "WRONG_DATE_EXECUTED",
  "APOSTILLE_ROUTING_ERROR",
  "WRONG_DOCUMENT_SENT",
  "COURIER_LOSS",
  "COURIER_DAMAGE",
  "COURIER_DELAY_CRITICAL",
  "PAYMENT_MISMATCH",
  "PAYMENT_RETURNED",
  "RON_SESSION_FAILED",
  "WITNESS_MISSING",
  "JURISDICTION_MISMATCH",
  "CLIENT_DATA_DISCREPANCY",
  "POST_RELEASE_CORRECTION",
  "UNAUTHORIZED_DISCLOSURE",
  "LEGAL_HOLD_REQUIRED",
  "INTERNAL_PROCESS_BREACH",
] as const;

export type IncidentType = typeof INCIDENT_TYPES[number];

export interface IncidentTypeMeta {
  type: IncidentType;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  triggers_freeze: boolean;
  description: string;
  remediation_steps: string[];
}

export const INCIDENT_TYPE_MAP: Record<IncidentType, IncidentTypeMeta> = {
  IDENTIFIER_ERROR: {
    type: "IDENTIFIER_ERROR",
    label: "Critical Identifier Error",
    severity: "critical",
    triggers_freeze: true,
    description: "A protected identifier (codice fiscale, passport, SSN, etc.) was entered or transmitted incorrectly.",
    remediation_steps: [
      "Freeze the matter immediately",
      "Capture snapshot of the incorrect identifier",
      "Pull source document for correct value",
      "Notify client calmly — do not admit liability in automated message",
      "Prepare correction packet if post-execution",
      "Log to incident audit trail",
    ],
  },
  WRONG_NAME_EXECUTED: {
    type: "WRONG_NAME_EXECUTED",
    label: "Wrong Name Executed",
    severity: "critical",
    triggers_freeze: true,
    description: "Document was executed with an incorrect or transposed legal name.",
    remediation_steps: [
      "Freeze execution and apostille steps",
      "Pull original source document for correct name",
      "Determine if re-execution is required",
      "Notify client — acknowledge issue without admitting broader liability",
      "Prepare Make-It-Right packet",
    ],
  },
  WRONG_DATE_EXECUTED: {
    type: "WRONG_DATE_EXECUTED",
    label: "Wrong Execution Date",
    severity: "high",
    triggers_freeze: true,
    description: "Document was executed with an incorrect date that may affect its legal validity.",
    remediation_steps: [
      "Freeze apostille coordination",
      "Consult authority requirements for date correction",
      "Determine if re-execution is required or correction affidavit suffices",
      "Log and notify client",
    ],
  },
  APOSTILLE_ROUTING_ERROR: {
    type: "APOSTILLE_ROUTING_ERROR",
    label: "Apostille Routing Error",
    severity: "high",
    triggers_freeze: false,
    description: "Document was routed to incorrect competent authority for apostille.",
    remediation_steps: [
      "Retrieve document if not yet processed",
      "Identify correct competent authority",
      "Re-route with corrected cover letter",
      "Update matter record and notify client of delay",
    ],
  },
  WRONG_DOCUMENT_SENT: {
    type: "WRONG_DOCUMENT_SENT",
    label: "Wrong Document Sent",
    severity: "high",
    triggers_freeze: true,
    description: "The incorrect document version or an unrelated document was sent to the destination.",
    remediation_steps: [
      "Freeze release",
      "Contact courier for intercept if possible",
      "Identify correct document version",
      "Prepare corrected shipment",
      "Notify client with status update",
    ],
  },
  COURIER_LOSS: {
    type: "COURIER_LOSS",
    label: "Courier Package Loss",
    severity: "critical",
    triggers_freeze: false,
    description: "A shipped package is confirmed lost in transit.",
    remediation_steps: [
      "File courier claim immediately (Shippo)",
      "Determine if documents can be re-executed",
      "Notify client — express concern, do not admit fault until investigation",
      "Open E&O review if original cannot be replaced",
    ],
  },
  COURIER_DAMAGE: {
    type: "COURIER_DAMAGE",
    label: "Courier Package Damaged",
    severity: "high",
    triggers_freeze: false,
    description: "Delivered package arrived with physical damage affecting document integrity.",
    remediation_steps: [
      "Document damage with photos",
      "File courier claim",
      "Assess if document is still usable",
      "Coordinate replacement if required",
      "Notify client",
    ],
  },
  COURIER_DELAY_CRITICAL: {
    type: "COURIER_DELAY_CRITICAL",
    label: "Critical Courier Delay",
    severity: "medium",
    triggers_freeze: false,
    description: "Package delay threatens a client deadline or authority submission window.",
    remediation_steps: [
      "Contact courier for expedite or hold options",
      "Notify client proactively",
      "Assess whether authority deadline extension is needed",
      "Log incident for SLA review",
    ],
  },
  PAYMENT_MISMATCH: {
    type: "PAYMENT_MISMATCH",
    label: "Payment Amount Mismatch",
    severity: "medium",
    triggers_freeze: false,
    description: "Wise payment received does not match the invoiced amount.",
    remediation_steps: [
      "Do not release matter until reconciled",
      "Contact client for reference or correction",
      "Log payment discrepancy in ledger",
      "Resolve before proceeding",
    ],
  },
  PAYMENT_RETURNED: {
    type: "PAYMENT_RETURNED",
    label: "Payment Returned / Failed",
    severity: "high",
    triggers_freeze: true,
    description: "A client payment was returned, reversed, or failed after matter work began.",
    remediation_steps: [
      "Freeze execution if not yet completed",
      "Notify client of payment failure",
      "Request corrected payment before proceeding",
      "Document in ledger",
    ],
  },
  RON_SESSION_FAILED: {
    type: "RON_SESSION_FAILED",
    label: "RON Session Failed",
    severity: "high",
    triggers_freeze: false,
    description: "Remote Online Notarization session could not be completed due to technical or identity verification failure.",
    remediation_steps: [
      "Determine cause: tech, identity, or platform issue",
      "Re-schedule RON session",
      "If identity verification failed, notify client of requirements",
      "Log session attempt and failure reason",
    ],
  },
  WITNESS_MISSING: {
    type: "WITNESS_MISSING",
    label: "Required Witness Missing",
    severity: "high",
    triggers_freeze: true,
    description: "Document requiring witnesses was executed without the required number of witnesses present.",
    remediation_steps: [
      "Freeze apostille coordination",
      "Determine if re-execution is required",
      "Coordinate witness network if re-execution possible",
      "Notify client and log",
    ],
  },
  JURISDICTION_MISMATCH: {
    type: "JURISDICTION_MISMATCH",
    label: "Jurisdiction / Compliance Mismatch",
    severity: "high",
    triggers_freeze: true,
    description: "Document was prepared or routed for an incompatible jurisdiction (e.g., non-Hague country sent apostille route).",
    remediation_steps: [
      "Freeze all routing",
      "Pull destination country compliance rules",
      "Re-route with correct authentication chain",
      "Notify client of process change and estimated timeline impact",
    ],
  },
  CLIENT_DATA_DISCREPANCY: {
    type: "CLIENT_DATA_DISCREPANCY",
    label: "Client Data Discrepancy",
    severity: "medium",
    triggers_freeze: false,
    description: "Client-provided information conflicts across documents or with source records.",
    remediation_steps: [
      "Flag for QA review",
      "Request clarifying documentation from client",
      "Do not proceed until source is confirmed",
      "Log discrepancy snapshot",
    ],
  },
  POST_RELEASE_CORRECTION: {
    type: "POST_RELEASE_CORRECTION",
    label: "Post-Release Correction Required",
    severity: "critical",
    triggers_freeze: false,
    description: "An error was discovered after the document package was released to the client or courier.",
    remediation_steps: [
      "Open Make-It-Right workflow",
      "Determine if receiving authority will accept a correction",
      "Prepare correction affidavit or full re-execution packet",
      "Issue Milano Seal courtesy adjustment if warranted",
      "Notify client with calm, factual language — no liability admission",
    ],
  },
  UNAUTHORIZED_DISCLOSURE: {
    type: "UNAUTHORIZED_DISCLOSURE",
    label: "Unauthorized Disclosure",
    severity: "critical",
    triggers_freeze: true,
    description: "Protected client data, signing URLs, or internal pricing was exposed to an unauthorized party.",
    remediation_steps: [
      "Freeze all outbound communication",
      "Identify scope of disclosure",
      "Rotate any exposed credentials or links",
      "Document incident fully",
      "Consult legal counsel before client notification",
    ],
  },
  LEGAL_HOLD_REQUIRED: {
    type: "LEGAL_HOLD_REQUIRED",
    label: "Legal Hold Required",
    severity: "critical",
    triggers_freeze: true,
    description: "Matter must be placed on legal hold due to dispute, litigation, or regulatory inquiry.",
    remediation_steps: [
      "Freeze matter immediately",
      "Preserve all records and communications",
      "Do not delete or modify any documents",
      "Escalate to founder",
    ],
  },
  INTERNAL_PROCESS_BREACH: {
    type: "INTERNAL_PROCESS_BREACH",
    label: "Internal Process Breach",
    severity: "medium",
    triggers_freeze: false,
    description: "An internal SOP, QA gate, or workflow protocol was bypassed or not followed.",
    remediation_steps: [
      "Document the breach",
      "Identify root cause",
      "Review affected matter for downstream risk",
      "Update SOP if gap found",
      "Log for compliance record",
    ],
  },
};

export const MAKE_IT_RIGHT_TYPES = [
  "FULL_REFUND",
  "PARTIAL_REFUND",
  "PRIORITY_RE_EXECUTION",
  "COURTESY_FEE_WAIVER",
  "COURTESY_CODE_ISSUED",
  "EXPEDITED_CORRECTION",
  "REPLACEMENT_COURIER",
  "NO_CHARGE_RE_EXECUTION",
] as const;

export type MakeItRightType = typeof MAKE_IT_RIGHT_TYPES[number];

export const MAKE_IT_RIGHT_LABELS: Record<MakeItRightType, string> = {
  FULL_REFUND: "Full Refund",
  PARTIAL_REFUND: "Partial Refund",
  PRIORITY_RE_EXECUTION: "Priority Re-Execution",
  COURTESY_FEE_WAIVER: "Courtesy Fee Waiver",
  COURTESY_CODE_ISSUED: "Courtesy Code Issued",
  EXPEDITED_CORRECTION: "Expedited Correction",
  REPLACEMENT_COURIER: "Replacement Courier (No Charge)",
  NO_CHARGE_RE_EXECUTION: "No-Charge Re-Execution",
};
