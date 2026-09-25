// Pure execution-document readiness over persisted preflight evidence.
// Kept separate from documentPreflight.ts so guards and UI do not load pdf-lib.

/** File MIME types that can carry a document to be executed. */
export const EXECUTION_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export interface PreflightFileRow {
  id: string;
  name?: string | null;
  filename?: string | null;
  mime_type?: string | null;
  file_type?: string | null;
  structural_status?: string | null;
  structural_review_reason?: string | null;
}

export interface ExecutionDocumentReadiness {
  ready: boolean;
  candidates: PreflightFileRow[];
  unresolved: Array<{ id: string; label: string; status: string; reason: string | null }>;
}

/**
 * Execution readiness fails closed: every execution document (either files
 * column dialect: mime_type / file_type) must have a READY preflight result.
 * A document that was never scanned is NOT_RUN and blocks readiness.
 */
export function evaluateExecutionDocumentReadiness(
  files: readonly PreflightFileRow[] | null | undefined,
): ExecutionDocumentReadiness {
  const candidates = (files ?? []).filter((file) =>
    EXECUTION_DOCUMENT_MIME_TYPES.has(String(file.mime_type ?? file.file_type ?? "").trim().toLowerCase()),
  );
  const unresolved = candidates
    .filter((file) => file.structural_status !== "READY")
    .map((file) => ({
      id: file.id,
      label: file.name ?? file.filename ?? "Execution document",
      status: file.structural_status ?? "NOT_RUN",
      reason: file.structural_review_reason ?? null,
    }));
  return { ready: candidates.length > 0 && unresolved.length === 0, candidates, unresolved };
}
