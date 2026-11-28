import { createHash, randomBytes } from "node:crypto";

export const INTAKE_SUBMISSION_COOKIE = "ms_intake_submission_v1";
export const INTAKE_SUBMISSION_COOKIE_PATH = "/api/intake";
export const INTAKE_SUBMISSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface StoredIntakeResponse {
  status: number;
  body: Record<string, unknown>;
  dealId: string | null;
}

export type IntakeSubmissionDecision =
  | { decision: "missing" }
  | { decision: "owner" }
  | { decision: "processing" }
  | { decision: "conflict"; dealId?: string | null }
  | { decision: "expired"; dealId?: string | null }
  | { decision: "replay"; response: StoredIntakeResponse };

export interface DurableIntakeSubmissionStore {
  lookup(tokenHash: string, payloadHash: string): Promise<IntakeSubmissionDecision>;
  claim(tokenHash: string, payloadHash: string): Promise<IntakeSubmissionDecision>;
  complete(tokenHash: string, payloadHash: string, response: StoredIntakeResponse): Promise<void>;
}

export function createIntakeSubmissionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isIntakeSubmissionToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function hashIntakeSubmissionToken(token: string): string {
  if (!isIntakeSubmissionToken(token)) throw new Error("INTAKE_IDEMPOTENCY_KEY_INVALID");
  return createHash("sha256").update(token).digest("hex");
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`);
  return `{${entries.join(",")}}`;
}

export function hashIntakeSubmissionPayload(payload: unknown): string {
  return createHash("sha256").update(stableJson(payload)).digest("hex");
}

export async function inspectIntakeSubmission(
  store: DurableIntakeSubmissionStore,
  token: string,
  payload: unknown,
  options: { waitMs?: number; pollMs?: number } = {},
): Promise<IntakeSubmissionDecision> {
  const tokenHash = hashIntakeSubmissionToken(token);
  const payloadHash = hashIntakeSubmissionPayload(payload);
  const waitMs = Math.max(0, options.waitMs ?? 0);
  const pollMs = Math.max(25, options.pollMs ?? 100);
  const deadline = Date.now() + waitMs;

  while (true) {
    const result = await store.lookup(tokenHash, payloadHash);
    if (result.decision !== "processing" || Date.now() >= deadline) return result;
    await new Promise((resolve) => setTimeout(resolve, Math.min(pollMs, deadline - Date.now())));
  }
}

export async function runDurableIntakeSubmission(
  store: DurableIntakeSubmissionStore,
  token: string,
  payload: unknown,
  execute: () => Promise<StoredIntakeResponse>,
  options: { waitMs?: number; pollMs?: number; recoverProcessing?: boolean } = {},
): Promise<IntakeSubmissionDecision> {
  const tokenHash = hashIntakeSubmissionToken(token);
  const payloadHash = hashIntakeSubmissionPayload(payload);
  const existing = await inspectIntakeSubmission(store, token, payload, options);
  if (existing.decision !== "missing" && !(options.recoverProcessing && existing.decision === "processing")) return existing;

  const claim = await store.claim(tokenHash, payloadHash);
  if (claim.decision !== "owner") {
    if (claim.decision !== "processing") return claim;
    return inspectIntakeSubmission(store, token, payload, options);
  }

  let response: StoredIntakeResponse;
  try {
    response = await execute();
  } catch {
    response = {
      status: 503,
      body: {
        success: false,
        error: "We could not confirm the saved request. Retry this same submission; do not start another request.",
        code: "INTAKE_OUTCOME_UNKNOWN",
        retryable: true,
      },
      dealId: null,
    };
  }

  await store.complete(tokenHash, payloadHash, response);
  return { decision: "replay", response };
}
