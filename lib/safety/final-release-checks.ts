// Final Seal Review — release checklist for apostille/international matters.
// All checks must pass before final release is permitted.
// Only founder/admin can override a blocked release.

import { requiresCodiceFiscaleLock } from "./identifier-lock";

export type CheckStatus = "clear" | "needs_review" | "blocked" | "founder_approved";

export type ReleaseCheck = {
  key: string;
  label: string;             // Operator label
  clientSafeLabel: string;   // Client-safe label (never exposes internals)
  severity: "critical" | "standard";
  status: CheckStatus;
};

export type FinalReleaseResult = {
  released: boolean;
  blockedChecks: ReleaseCheck[];
  passedChecks: ReleaseCheck[];
  requiresFounderApproval: boolean;
};

// Base checklist for all international matters.
// Italian matters get an additional codice fiscale lock check.
export function buildFinalReleaseChecklist(matter: {
  destination_country?: string | null;
}): ReleaseCheck[] {
  const base: ReleaseCheck[] = [
    { key: "client_name_confirmed",       label: "Client full legal name exact-match confirmed",     clientSafeLabel: "Identity confirmed",                     severity: "critical",  status: "needs_review" },
    { key: "destination_confirmed",       label: "Destination country confirmed",                    clientSafeLabel: "Destination confirmed",                  severity: "critical",  status: "needs_review" },
    { key: "document_type_confirmed",     label: "Document type confirmed",                          clientSafeLabel: "Document type confirmed",                severity: "critical",  status: "needs_review" },
    { key: "origin_jurisdiction",         label: "Document origin jurisdiction confirmed",           clientSafeLabel: "Origin jurisdiction confirmed",          severity: "critical",  status: "needs_review" },
    { key: "signer_location",             label: "Signer location confirmed",                        clientSafeLabel: "Signer location confirmed",              severity: "critical",  status: "needs_review" },
    { key: "apostille_pathway",           label: "Apostille / legalization pathway confirmed",       clientSafeLabel: "International pathway confirmed",        severity: "critical",  status: "needs_review" },
    { key: "notarial_cert_present",       label: "Notarial certificate present if required",        clientSafeLabel: "Notarization review complete",           severity: "critical",  status: "needs_review" },
    { key: "signature_blocks",            label: "Signature blocks complete",                        clientSafeLabel: "Signature review complete",              severity: "critical",  status: "needs_review" },
    { key: "initial_blocks",              label: "Initial blocks complete if applicable",            clientSafeLabel: "Initial review complete",                severity: "standard",  status: "needs_review" },
    { key: "witness_blocks",              label: "Witness blocks complete if applicable",            clientSafeLabel: "Witness review complete",                severity: "standard",  status: "needs_review" },
    { key: "page_count_checked",          label: "All page counts checked",                          clientSafeLabel: "Document completeness reviewed",         severity: "critical",  status: "needs_review" },
    { key: "exhibits_present",            label: "All exhibits / attachments present",               clientSafeLabel: "Attachments reviewed",                   severity: "standard",  status: "needs_review" },
    { key: "identifier_exact_match",      label: "Foreign tax ID / identifier exact-match confirmed", clientSafeLabel: "Document identifier verified",          severity: "critical",  status: "needs_review" },
    { key: "shipping_recipient",          label: "Shipping recipient / address confirmed",           clientSafeLabel: "Delivery address confirmed",             severity: "critical",  status: "needs_review" },
    { key: "final_pdf_locked",            label: "Final PDF locked",                                 clientSafeLabel: "Document finalized",                     severity: "critical",  status: "needs_review" },
    { key: "client_release_summary",      label: "Client-safe release summary prepared",            clientSafeLabel: "Release summary ready",                  severity: "standard",  status: "needs_review" },
    { key: "founder_final_approval",      label: "Founder final approval completed",                clientSafeLabel: "Final review complete",                  severity: "critical",  status: "needs_review" },
  ];

  // Italian matters require explicit Codice Fiscale Lock
  if (requiresCodiceFiscaleLock(matter.destination_country ?? null)) {
    base.splice(13, 0, {
      key: "codice_fiscale_lock",
      label: "Codice Fiscale exact-match locked (16-character Italian tax code)",
      clientSafeLabel: "Document identifier verified",
      severity: "critical",
      status: "needs_review",
    });
  }

  return base;
}

// Evaluate whether a final release can proceed.
// All critical checks must be "clear" or "founder_approved".
export function evaluateFinalRelease(checks: ReleaseCheck[]): FinalReleaseResult {
  const blocked = checks.filter(
    (c) => c.status === "needs_review" || c.status === "blocked"
  );
  const passed = checks.filter(
    (c) => c.status === "clear" || c.status === "founder_approved"
  );
  const hasFounderOverride = checks.some((c) => c.status === "founder_approved");
  const criticalBlocked = blocked.filter((c) => c.severity === "critical");

  return {
    released: criticalBlocked.length === 0,
    blockedChecks: blocked,
    passedChecks: passed,
    requiresFounderApproval: criticalBlocked.length > 0 && !hasFounderOverride,
  };
}

// Client-safe copy for blocked release.
export const RELEASE_BLOCKED_CLIENT_COPY =
  "Your document is undergoing final review before international release. No action is required from you right now.";

// Operator copy
export const RELEASE_BLOCKED_OPERATOR_COPY =
  "Final Seal Review has not passed. Release is blocked until all critical checks are cleared.";
