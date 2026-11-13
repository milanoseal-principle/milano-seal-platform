import { readAllKeyset } from "@/lib/data/keyset";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALL_DOCUMENT_CATEGORIES,
  RECEIVING_REQUIREMENTS,
  RECEIVING_SOURCE_TYPES,
  RECEIVING_STATUSES,
  evaluateReceivingRequirements,
  isHttpsUrl,
  normalizeCategory,
  type ReceivingAuthorityStanding,
  type ReceivingRequirementRule,
  type ReceivingRequirementsEvaluation,
} from "@/lib/receiving-authority/requirements";

// Server-side reads and writes for receiving-authority requirement statements (B10). Statements
// are append-only: recording adds a row, superseding closes one row once. Nothing here edits a
// statement, and nothing here writes to receiving_authorities.

const TABLE = "receiving_authority_requirements";
const RULE_FIELDS =
  "id,authority_id,document_category,requirement,status,detail,source_url,source_type,source_title,verified_at,verified_by,review_due_at,superseded_at,created_at";
const MAX_REVIEW_DAYS = 365;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ReceivingRequirementError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

type DbError = { code?: string; message?: string } | null;

// The table ships in a migration that may not be applied yet. Say so; never answer as if empty.
function storageError(error: DbError): ReceivingRequirementError {
  const missing = error?.code === "42P01" || error?.code === "PGRST205" || /does not exist|schema cache/i.test(error?.message ?? "");
  return missing
    ? new ReceivingRequirementError("REQUIREMENTS_STORAGE_NOT_DEPLOYED", 503, "Receiving-authority requirement storage is not deployed in this environment.")
    : new ReceivingRequirementError("REQUIREMENTS_UNAVAILABLE", 503, "Receiving-authority requirements could not be read or written.");
}

async function loadAuthority(db: SupabaseClient, authorityId: string): Promise<ReceivingAuthorityStanding & { name: string | null; country: string | null }> {
  if (!UUID.test(authorityId)) throw new ReceivingRequirementError("AUTHORITY_NOT_FOUND", 404, "Receiving authority not found.");
  const { data, error } = await db
    .from("receiving_authorities")
    .select("id,name,country,routing_status,manual_review_required")
    .eq("id", authorityId)
    .maybeSingle();
  if (error) throw storageError(error);
  if (!data) throw new ReceivingRequirementError("AUTHORITY_NOT_FOUND", 404, "Receiving authority not found.");
  return data as ReceivingAuthorityStanding & { name: string | null; country: string | null };
}

export async function loadReceivingRequirements(
  db: SupabaseClient,
  authorityId: string,
  documentCategory?: string | null,
  now: Date = new Date(),
): Promise<{ authority: Awaited<ReturnType<typeof loadAuthority>>; rules: ReceivingRequirementRule[]; evaluation: ReceivingRequirementsEvaluation }> {
  const authority = await loadAuthority(db, authorityId);
  let rules: ReceivingRequirementRule[];
  try {
    rules = await readAllKeyset<ReceivingRequirementRule>(async (cursor) => {
      let query = db.from(TABLE).select(RULE_FIELDS).eq("authority_id", authorityId)
        .is("superseded_at", null).order("id", { ascending: true }).limit(250);
      if (cursor) query = query.gt("id", cursor.id);
      const {data,error} = await query;
      if (error) throw storageError(error);
      if (!Array.isArray(data)) throw storageError(null);
      return data as ReceivingRequirementRule[];
    }, row => row.id);
  } catch(error) {
    if (error instanceof ReceivingRequirementError) throw error;
    throw storageError(null);
  }
  return { authority, rules, evaluation: evaluateReceivingRequirements({ authority, rules, documentCategory, now }) };
}

export interface RecordRequirementInput {
  requirement?: unknown;
  status?: unknown;
  documentCategory?: unknown;
  detail?: unknown;
  sourceUrl?: unknown;
  sourceType?: unknown;
  sourceTitle?: unknown;
  reviewDueAt?: unknown;
}

const text = (value: unknown, max: number): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

export async function recordReceivingRequirement(
  db: SupabaseClient,
  authorityId: string,
  actorId: string,
  input: RecordRequirementInput,
  now: Date = new Date(),
): Promise<ReceivingRequirementRule> {
  await loadAuthority(db, authorityId);
  const invalid = (message: string) => new ReceivingRequirementError("INVALID_REQUIREMENT", 422, message);

  if (!(RECEIVING_REQUIREMENTS as readonly string[]).includes(String(input.requirement))) throw invalid("Unknown requirement.");
  if (!(RECEIVING_STATUSES as readonly string[]).includes(String(input.status))) throw invalid("Unknown status.");
  const status = String(input.status);
  const detail = text(input.detail, 2000);
  const row: Record<string, unknown> = {
    authority_id: authorityId,
    document_category: input.documentCategory == null ? ALL_DOCUMENT_CATEGORIES : normalizeCategory(input.documentCategory),
    requirement: String(input.requirement),
    status,
    detail,
  };

  if (status === "UNKNOWN") {
    // An unknown may cite where the operator looked, but it carries no verification.
    row.source_url = isHttpsUrl(input.sourceUrl) ? input.sourceUrl : null;
    row.source_type = null;
    row.source_title = text(input.sourceTitle, 300);
  } else {
    if (!isHttpsUrl(input.sourceUrl)) throw invalid("An https source published by the receiving authority or official guidance is required.");
    if (!(RECEIVING_SOURCE_TYPES as readonly string[]).includes(String(input.sourceType))) throw invalid("The source must be the receiving authority or official guidance.");
    if (status === "CONDITIONAL" && !detail) throw invalid("Describe the condition.");
    const due = typeof input.reviewDueAt === "string" ? new Date(input.reviewDueAt) : null;
    if (!due || Number.isNaN(due.getTime()) || typeof input.reviewDueAt !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(input.reviewDueAt) || new Date(input.reviewDueAt.slice(0,10) + "T00:00:00Z").toISOString().slice(0,10) !== input.reviewDueAt.slice(0,10)) throw invalid("A review date is required.");
    if (due.getTime() <= now.getTime()) throw invalid("The review date must be in the future.");
    if (due.getTime() - now.getTime() > MAX_REVIEW_DAYS * 86_400_000) throw invalid(`The review date must be within ${MAX_REVIEW_DAYS} days.`);
    row.source_url = input.sourceUrl;
    row.source_type = String(input.sourceType);
    row.source_title = text(input.sourceTitle, 300);
    row.verified_at = now.toISOString();
    row.verified_by = actorId;
    row.review_due_at = due.toISOString();
  }

  const { data, error } = await db.from(TABLE).insert(row).select(RULE_FIELDS).single();
  if (error || !data) throw storageError(error);
  return data as ReceivingRequirementRule;
}

export async function supersedeReceivingRequirement(
  db: SupabaseClient,
  authorityId: string,
  ruleId: unknown,
  actorId: string,
  reason: unknown,
  now: Date = new Date(),
): Promise<{ id: string }> {
  const why = text(reason, 1000);
  if (typeof ruleId !== "string" || !UUID.test(ruleId)) throw new ReceivingRequirementError("REQUIREMENT_NOT_FOUND", 404, "Requirement statement not found.");
  if (!why) throw new ReceivingRequirementError("INVALID_REQUIREMENT", 422, "A reason is required to supersede a statement.");
  const { data, error } = await db
    .from(TABLE)
    .update({ superseded_at: now.toISOString(), superseded_by: actorId, supersede_reason: why })
    .eq("id", ruleId)
    .eq("authority_id", authorityId)
    .is("superseded_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw storageError(error);
  if (!data) throw new ReceivingRequirementError("REQUIREMENT_NOT_FOUND", 404, "Requirement statement not found or already superseded.");
  return data as { id: string };
}
