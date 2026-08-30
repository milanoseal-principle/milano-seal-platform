import { PRODUCTION_CERTIFICATION_CHECKS } from "./checks";
import type { CertificationEvidence, CertificationResult } from "./types";

export function validateMatterContinuity(evidence: CertificationEvidence[]) {
  const ids = new Set(evidence.filter((item) => PRODUCTION_CERTIFICATION_CHECKS.find((check) => check.key === item.step_key)?.matterContinuity && item.matter_id).map((item) => item.matter_id));
  return ids.size <= 1 ? { valid: true, code: null } : { valid: false, code: "MATTER_CONTINUITY_BROKEN" as const };
}

export function initialEvidenceRows() {
  return PRODUCTION_CERTIFICATION_CHECKS.map((check) => ({ phase: check.phase, step_key: check.key, result: "PENDING" as CertificationResult }));
}

export function sanitizeObservedValue(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const blocked = /password|secret|token|private|credential|passport|kba|document_bytes/i;
  return Object.fromEntries(Object.entries(value).filter(([key, item]) => !blocked.test(key) && ["string", "number", "boolean"].includes(typeof item)).slice(0, 20));
}
