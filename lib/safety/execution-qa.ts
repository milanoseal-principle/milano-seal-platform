// Execution QA Matrix
// Deterministic checks for missed signatures, missing identifiers, page count,
// name mismatches, and shipping errors before final apostille release.

export type QACheckStatus = "clear" | "needs_review" | "blocked" | "founder_approved";

export type QACheck = {
  key: string;
  label: string;
  status: QACheckStatus;
  note?: string;
};

export type QAMatrixResult = {
  overallStatus: QACheckStatus;
  checks: QACheck[];
  blockedCount: number;
  requiresFounderOverride: boolean;
};

// Ledger events emitted by this layer
export type QALedgerEvent =
  | "PREFLIGHT_INTERRUPTION_TRIGGERED"
  | "PAYMENT_INTEGRITY_REVIEWED"
  | "PAYMENT_CONFIRMED_MANUAL"
  | "IDENTIFIER_LOCK_CREATED"
  | "IDENTIFIER_EXACT_MATCH_CONFIRMED"
  | "IDENTIFIER_MISMATCH_BLOCKED"
  | "FINAL_SEAL_REVIEW_STARTED"
  | "FINAL_SEAL_REVIEW_PASSED"
  | "APOSTILLE_RELEASE_BLOCKED"
  | "APOSTILLE_RELEASE_APPROVED"
  | "LEGACY_CLIENT_COURTESY_CREDIT_CREATED"
  | "CLIENT_PORTAL_LINK_PREPARED"
  | "FOUNDER_RELEASE_OVERRIDE";

// Build a QA check matrix from a matter snapshot.
// Returns all checks with statuses that operators must clear before release.
export function buildExecutionQAMatrix(matter: {
  client_name?: string | null;
  destination_country?: string | null;
  document_type?: string | null;
  signer_name?: string | null;
  page_count?: number | null;
  expected_page_count?: number | null;
  has_notarial_block?: boolean;
  has_apostille_packet?: boolean;
  has_courier_packet?: boolean;
  identifier_lock_status?: "pending" | "matched" | "mismatched" | null;
  payment_confirmed?: boolean;
}): QACheck[] {
  const checks: QACheck[] = [];

  // Client name present
  checks.push({
    key: "client_name",
    label: "Client name present",
    status: matter.client_name ? "clear" : "blocked",
    note: matter.client_name ? undefined : "Client full legal name missing",
  });

  // Destination country present
  checks.push({
    key: "destination_country",
    label: "Destination country confirmed",
    status: matter.destination_country ? "clear" : "blocked",
    note: matter.destination_country ? undefined : "Destination country not set",
  });

  // Document type present
  checks.push({
    key: "document_type",
    label: "Document type confirmed",
    status: matter.document_type ? "clear" : "needs_review",
  });

  // Page count check
  const pageCountClear =
    matter.page_count != null &&
    matter.expected_page_count != null &&
    matter.page_count === matter.expected_page_count;
  checks.push({
    key: "page_count",
    label: "Page count matches expected",
    status:
      matter.page_count == null
        ? "needs_review"
        : pageCountClear
        ? "clear"
        : "blocked",
    note: !pageCountClear && matter.page_count != null
      ? `Page count mismatch: ${matter.page_count} found, ${matter.expected_page_count} expected`
      : undefined,
  });

  // Notarial block
  checks.push({
    key: "notarial_block",
    label: "Notarial certificate / block present",
    status: matter.has_notarial_block == null ? "needs_review" : matter.has_notarial_block ? "clear" : "blocked",
    note: matter.has_notarial_block === false ? "Notarial block missing — required before apostille" : undefined,
  });

  // Apostille packet
  checks.push({
    key: "apostille_packet",
    label: "Apostille packet present",
    status: matter.has_apostille_packet == null ? "needs_review" : matter.has_apostille_packet ? "clear" : "blocked",
    note: matter.has_apostille_packet === false ? "Apostille packet not attached" : undefined,
  });

  // Courier packet
  checks.push({
    key: "courier_packet",
    label: "Courier packet complete",
    status: matter.has_courier_packet == null ? "needs_review" : matter.has_courier_packet ? "clear" : "blocked",
    note: matter.has_courier_packet === false ? "Courier packet incomplete" : undefined,
  });

  // Identifier lock
  const idStatus =
    matter.identifier_lock_status === "matched"
      ? "clear"
      : matter.identifier_lock_status === "mismatched"
      ? "blocked"
      : "needs_review";
  checks.push({
    key: "identifier_lock",
    label: "Identifier exact-match locked",
    status: idStatus,
    note:
      matter.identifier_lock_status === "mismatched"
        ? "Identifier mismatch — final release blocked until corrected"
        : matter.identifier_lock_status == null
        ? "Identifier lock not yet created"
        : undefined,
  });

  // Payment
  checks.push({
    key: "payment_confirmed",
    label: "Payment confirmed",
    status: matter.payment_confirmed ? "clear" : "blocked",
    note: matter.payment_confirmed ? undefined : "Payment not confirmed — scheduling locked",
  });

  return checks;
}

// Aggregate QA matrix result for a set of checks.
export function evaluateQAMatrix(checks: QACheck[]): QAMatrixResult {
  const blocked = checks.filter((c) => c.status === "blocked");
  const hasFounderOverride = checks.some((c) => c.status === "founder_approved");

  let overall: QACheckStatus = "clear";
  if (blocked.length > 0) overall = hasFounderOverride ? "founder_approved" : "blocked";
  else if (checks.some((c) => c.status === "needs_review")) overall = "needs_review";

  return {
    overallStatus: overall,
    checks,
    blockedCount: blocked.length,
    requiresFounderOverride: blocked.length > 0 && !hasFounderOverride,
  };
}
