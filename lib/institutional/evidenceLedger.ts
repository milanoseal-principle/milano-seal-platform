import { readAllKeyset } from "@/lib/data/keyset";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  INSTITUTIONAL_DOCUMENT_ORIGIN, INSTITUTIONAL_EVIDENCE, INSTITUTIONAL_PATHWAYS, INSTITUTIONAL_PATHWAY_EVIDENCE,
  evaluateInstitutionalRoute, type EvidenceItem, type InstitutionalEvidenceKey, type InstitutionalPathway, type InstitutionalRouteResult,
} from "@/lib/institutional/institutionalDocument";
import { resolvePlace } from "@/lib/treaty/apostilleRelationship";

// B09 — persisted institutional evidence and operator review.
//
// Everything is stored as events in the existing canonical ledger (public.matter_evidence_ledger,
// domain "authority"): no new table, Matter store or custody engine. The ledger is append-only at
// the database level, so evidence is immutable and a correction is a new version that supersedes
// the old one. Attachments are existing document_versions rows of the SAME Matter (private
// storage, SHA-256 recorded); nothing here creates a public link.
//
// State is always derived by replaying the Matter's events through the B08 evaluator, so an
// approval can never outlive the evidence it covered: evidence recorded after the approval, an
// expired item or a new review version all void it.

export const INSTITUTIONAL_LEDGER_SOURCE = "institutional-evidence-ledger";
export const INSTITUTIONAL_EVENTS = {
  review: "INSTITUTIONAL_REVIEW_RECORDED",
  evidence: "INSTITUTIONAL_EVIDENCE_RECORDED",
  approved: "INSTITUTIONAL_ROUTE_APPROVED",
  rejected: "INSTITUTIONAL_ROUTE_REJECTED",
} as const;

export class InstitutionalLedgerError extends Error {
  constructor(public code: string, public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
const fail = (code: string, status: number, message: string, details?: unknown) => new InstitutionalLedgerError(code, status, message, details);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
function isRealDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value) || Number.isNaN(Date.parse(value))) return false;
  const day = value.slice(0, 10), parsed = Date.parse(`${day}T00:00:00Z`);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString().slice(0, 10) === day;
}

export type InstitutionalReview = {
  eventId: string; version: number; recordedBy: string | null; recordedAt: string;
  issuingOrganisation: string; issuingOfficial: string; officialCapacity: string;
  hostState: string; destination: string; documentCategory: string; documentForm: "original" | "certified_copy";
  pathway: InstitutionalPathway; documentVersionId: string | null; documentSha256: string | null;
};
export type InstitutionalEvidenceRecord = {
  eventId: string; key: InstitutionalEvidenceKey; version: number; state: "verified" | "rejected";
  source: string | null; verifiedAt: string | null; expiresAt: string | null; note: string | null;
  documentVersionId: string | null; sha256: string | null; recordedBy: string | null; recordedAt: string;
  supersedes: string | null; current: boolean; expired: boolean;
};
export type InstitutionalDecisionRecord = { eventId: string; decision: "approved" | "rejected"; by: string | null; at: string; reason: string | null; reviewEventId: string; coveredEvidence: Record<string, string> };

export type InstitutionalState = {
  matterId: string;
  review: InstitutionalReview | null;
  reviewVersions: number;
  evidence: Partial<Record<InstitutionalEvidenceKey, InstitutionalEvidenceRecord>>;
  required: { key: InstitutionalEvidenceKey; requirement: string }[];
  history: InstitutionalEvidenceRecord[];
  decisions: InstitutionalDecisionRecord[];
  approval: InstitutionalDecisionRecord | null; // only while it still covers the current evidence
  approvalVoided: string | null; // why an earlier approval no longer applies
  rejection: InstitutionalDecisionRecord | null; // blocking until a new review version is recorded
  evaluation: InstitutionalRouteResult | null;
};

type LedgerRow = { id: string; event_type: string; actor_id: string | null; occurred_at: string; new_value: Record<string, unknown> | null; reason: string | null };

async function readEvents(db: SupabaseClient, matterId: string): Promise<LedgerRow[]> {
  try {
    return await readAllKeyset<LedgerRow>(async (cursor) => {
      let query = db.from("matter_evidence_ledger")
        .select("id, event_type, actor_id, occurred_at, new_value, reason")
        .eq("matter_id", matterId).eq("source", INSTITUTIONAL_LEDGER_SOURCE)
        .order("id", { ascending: true }).limit(250);
      if (cursor) query = query.gt("id", cursor.id);
      const { data, error } = await query;
      if (error || !Array.isArray(data)) throw Error("LEDGER_READ_FAILED");
      return data as LedgerRow[];
    }, row => row.id);
  } catch {
    throw fail("INSTITUTIONAL_LEDGER_UNAVAILABLE",503,"Institutional evidence is unavailable or incomplete; progression remains blocked.");
  }
}

export function deriveInstitutionalState(matterId: string, events: LedgerRow[], now: Date = new Date()): InstitutionalState {
  const today = now.toISOString().slice(0, 10);
  const revision = (event: LedgerRow): number => {
    const version = event.new_value?.version;
    if (!Number.isSafeInteger(version) || Number(version) < 1) throw fail("INSTITUTIONAL_LEDGER_AMBIGUOUS",409,"Invalid evidence revision; operator review is required.");
    return Number(version);
  };
  const reviews = events.filter((e) => e.event_type === INSTITUTIONAL_EVENTS.review).sort((a,b)=>revision(a)-revision(b));
  if (reviews.length > 1 && revision(reviews.at(-1)!) === revision(reviews.at(-2)!)) throw fail("INSTITUTIONAL_LEDGER_AMBIGUOUS",409,"Concurrent review versions require operator reconciliation.");
  const last = reviews.at(-1);
  const state: InstitutionalState = { matterId, review: null, reviewVersions: reviews.length, evidence: {}, required: [], history: [], decisions: [], approval: null, approvalVoided: null, rejection: null, evaluation: null };
  if (!last) return state;

  const v = (last.new_value ?? {}) as Record<string, unknown>;
  const review: InstitutionalReview = {
    eventId: last.id, version: revision(last), recordedBy: last.actor_id, recordedAt: last.occurred_at,
    issuingOrganisation: String(v.issuingOrganisation ?? ""), issuingOfficial: String(v.issuingOfficial ?? ""), officialCapacity: String(v.officialCapacity ?? ""),
    hostState: String(v.hostState ?? ""), destination: String(v.destination ?? ""), documentCategory: String(v.documentCategory ?? ""),
    documentForm: v.documentForm === "certified_copy" ? "certified_copy" : "original", pathway: v.pathway as InstitutionalPathway,
    documentVersionId: (v.documentVersionId as string | null) ?? null, documentSha256: (v.documentSha256 as string | null) ?? null,
  };
  state.review = review;
  state.required = (INSTITUTIONAL_PATHWAY_EVIDENCE[review.pathway] ?? []).map((key) => ({ key, requirement: INSTITUTIONAL_EVIDENCE[key] }));

  // Evidence and decisions count only for the review version they were recorded against.
  const counts = new Map<string, number>();
  const ordered = [
    ...events.filter(e=>e.event_type===INSTITUTIONAL_EVENTS.evidence).sort((a,b)=>revision(a)-revision(b) || a.id.localeCompare(b.id)),
    ...events.filter(e=>e.event_type!==INSTITUTIONAL_EVENTS.evidence).sort((a,b)=>Date.parse(a.occurred_at)-Date.parse(b.occurred_at) || a.id.localeCompare(b.id)),
  ];
  for (const e of ordered) {
    const n = (e.new_value ?? {}) as Record<string, unknown>;
    if (n.reviewEventId !== review.eventId) continue;
    if (e.event_type === INSTITUTIONAL_EVENTS.evidence) {
      const key = n.key as InstitutionalEvidenceKey;
      const version = revision(e);
      if (!(key in INSTITUTIONAL_EVIDENCE) || !["verified","rejected"].includes(String(n.state)) || version <= (counts.get(key) ?? 0)) throw fail("INSTITUTIONAL_LEDGER_AMBIGUOUS",409,"Concurrent or malformed evidence requires a new institutional review.");
      counts.set(key, version);
      const expiresAt = (n.expiresAt as string | null) ?? null;
      const record: InstitutionalEvidenceRecord = {
        eventId: e.id, key, version, state: n.state === "rejected" ? "rejected" : "verified", source: (n.source as string | null) ?? null,
        verifiedAt: (n.verifiedAt as string | null) ?? null, expiresAt, note: (n.note as string | null) ?? null,
        documentVersionId: (n.documentVersionId as string | null) ?? null, sha256: (n.sha256 as string | null) ?? null,
        recordedBy: e.actor_id, recordedAt: e.occurred_at, supersedes: (n.supersedes as string | null) ?? null, current: true,
        expired: Boolean(expiresAt && expiresAt.slice(0, 10) < today),
      };
      const previous = state.evidence[key];
      if (previous) previous.current = false;
      state.evidence[key] = record;
      state.history.push(record);
    } else if (e.event_type === INSTITUTIONAL_EVENTS.approved || e.event_type === INSTITUTIONAL_EVENTS.rejected) {
      state.decisions.push({ eventId: e.id, decision: e.event_type === INSTITUTIONAL_EVENTS.approved ? "approved" : "rejected", by: e.actor_id, at: e.occurred_at, reason: e.reason, reviewEventId: review.eventId, coveredEvidence: (n.coveredEvidence as Record<string, string> | undefined) ?? {} });
    }
  }

  // Any rejection of this review remains blocking; timestamps cannot resurrect it.
  const rejection = state.decisions.filter(d=>d.decision==='rejected').at(-1);
  const currentIds = Object.fromEntries(Object.values(state.evidence).map(record=>[record!.key,record!.eventId]));
  const matches = (d: InstitutionalDecisionRecord) => Object.keys(d.coveredEvidence).length === Object.keys(currentIds).length && Object.entries(currentIds).every(([key,id])=>d.coveredEvidence[key]===id);
  const lastDecision = rejection ?? [...state.decisions].reverse().find(d=>d.decision==='approved' && matches(d)) ?? state.decisions.at(-1) ?? null;
  if (lastDecision?.decision === "rejected") state.rejection = lastDecision;
  if (lastDecision?.decision === "approved") {
    const current = Object.values(state.evidence).filter(Boolean) as InstitutionalEvidenceRecord[];
    // An approval covers exactly the evidence versions it named. Comparing ids, not only times,
    // closes the race where a correction is saved after the approval read the ledger but carries
    // an earlier timestamp.
    const covered = lastDecision.coveredEvidence;
    const sameEvidence = current.length === Object.keys(covered).length && current.every((r) => covered[r.key] === r.eventId);
    if (!sameEvidence || current.some((r) => Date.parse(r.recordedAt) > Date.parse(lastDecision.at))) state.approvalVoided = "Evidence was recorded after the approval; the pathway must be approved again.";
    else if (current.some((r) => r.expired)) state.approvalVoided = "Evidence covered by the approval has expired and must be re-verified.";
    else state.approval = lastDecision;
  }

  const evidence: Partial<Record<InstitutionalEvidenceKey, EvidenceItem>> = {};
  for (const [key, record] of Object.entries(state.evidence) as [InstitutionalEvidenceKey, InstitutionalEvidenceRecord][]) {
    evidence[key] = record.expired ? { state: "unverified" } : { state: record.state, source: record.source, verifiedAt: record.verifiedAt };
  }
  const evaluation = evaluateInstitutionalRoute({
    documentOrigin: INSTITUTIONAL_DOCUMENT_ORIGIN, issuingOrganisation: review.issuingOrganisation, hostState: review.hostState, destination: review.destination,
    documentCategory: review.documentCategory, documentForm: review.documentForm, pathway: review.pathway, evidence,
    operatorApproval: state.approval ? { approvedBy: state.approval.by ?? "", approvedAt: state.approval.at } : null, evaluationDate: today,
  });
  // An operator rejection blocks the pathway whatever the evidence says.
  state.evaluation = state.rejection
    ? { ...evaluation, decision: "UNSUPPORTED", routeActive: false, reasons: [`An operator rejected this pathway: ${state.rejection.reason ?? "no reason recorded"}. Record a new review version to consider another pathway.`] }
    : evaluation;
  return state;
}

export async function loadInstitutionalState(db: SupabaseClient, matterId: string, now: Date = new Date()): Promise<InstitutionalState> {
  if (!UUID.test(matterId)) throw fail("INVALID_MATTER_ID", 400, "Invalid Matter.");
  const state = deriveInstitutionalState(matterId, await readEvents(db, matterId), now);
  if (state.approval) {
    const proof = await db.rpc('institutional_route_is_verified', {p_matter:matterId});
    if (proof.error || typeof proof.data !== 'boolean') throw fail('INSTITUTIONAL_PROOF_UNAVAILABLE',503,'Current document and approval integrity could not be verified.');
    if (!proof.data) {
      state.approval = null;
      state.approvalVoided = 'The document-bound approval is no longer valid. Review the document, evidence and current operator authorization.';
      if (state.evaluation) state.evaluation = {...state.evaluation,decision:'CONDITIONAL_REVIEW',routeActive:false,reasons:[...state.evaluation.reasons,state.approvalVoided]};
    }
  }
  return state;
}

async function requireMatter(db: SupabaseClient, matterId: string) {
  if (!UUID.test(matterId)) throw fail("INVALID_MATTER_ID", 400, "Invalid Matter.");
  const { data, error } = await db.from("deals").select("id").eq("id", matterId).maybeSingle();
  if (error) throw fail("INSTITUTIONAL_LEDGER_UNAVAILABLE", 503, "Institutional evidence is unavailable right now.");
  if (!data) throw fail("MATTER_NOT_FOUND", 404, "Matter not found.");
}

// An attachment must be a document version of this same Matter; its recorded hash is copied in.
async function attachment(db: SupabaseClient, matterId: string, documentVersionId: unknown): Promise<{ id: string; sha256: string } | null> {
  if (documentVersionId === null || documentVersionId === undefined || documentVersionId === "") return null;
  if (typeof documentVersionId !== "string" || !UUID.test(documentVersionId)) throw fail("INVALID_DOCUMENT_VERSION", 400, "Invalid document version.");
  const { data, error } = await db.from("document_versions").select("id, matter_id, file_hash").eq("id", documentVersionId).maybeSingle();
  if (error) throw fail("INSTITUTIONAL_LEDGER_UNAVAILABLE", 503, "Institutional evidence is unavailable right now.");
  // A version of another Matter is reported exactly like a missing one.
  if (!data || data.matter_id !== matterId) throw fail("DOCUMENT_VERSION_NOT_IN_MATTER", 404, "That document version does not belong to this Matter.");
  if (!/^[0-9a-f]{64}$/i.test(String(data.file_hash ?? ""))) throw fail("DOCUMENT_VERSION_UNHASHED", 409, "That document version has no SHA-256 on record.");
  return { id: data.id as string, sha256: String(data.file_hash).toLowerCase() };
}

async function append(db: SupabaseClient, matterId: string, actorId: string, eventType: string, newValue: Record<string, unknown>, extra: { reason?: string | null; priorValue?: unknown; evidenceReference?: string | null; sourceReference?: string | null; at?: Date } = {}) {
  const { data, error } = await db.from("matter_evidence_ledger").insert({
    matter_id: matterId, event_type: eventType, domain: "authority", actor_type: "operator", actor_id: actorId,
    occurred_at: (extra.at ?? new Date()).toISOString(), source: INSTITUTIONAL_LEDGER_SOURCE, source_reference: extra.sourceReference ?? null,
    evidence_reference: extra.evidenceReference ?? null, prior_value: extra.priorValue ?? null, new_value: newValue, reason: extra.reason ?? null, metadata: {},
  }).select("id").single();
  if (error || !data) throw fail("INSTITUTIONAL_EVIDENCE_NOT_STORED", 503, "The record was not saved.");
  return data.id as string;
}

export type ReviewInput = { issuingOrganisation?: unknown; issuingOfficial?: unknown; officialCapacity?: unknown; hostState?: unknown; destination?: unknown; documentCategory?: unknown; documentForm?: unknown; pathway?: unknown; documentVersionId?: unknown };

// Records (or revises) what is under review. A revision is a new version: evidence and decisions
// recorded against the previous version no longer count.
export async function recordInstitutionalReview(db: SupabaseClient, matterId: string, actorId: string, input: ReviewInput, now: Date = new Date()) {
  await requireMatter(db, matterId);
  const issuingOrganisation = text(input.issuingOrganisation, 300), hostRaw = text(input.hostState, 100), destination = text(input.destination, 100);
  const documentCategory = text(input.documentCategory, 200);
  const missing = [!issuingOrganisation && "issuingOrganisation", !hostRaw && "hostState", !destination && "destination", !documentCategory && "documentCategory"].filter(Boolean);
  if (missing.length) throw fail("REVIEW_INCOMPLETE", 400, "Identify the issuing organisation, host State, destination and document category.", missing);
  const hostState = resolvePlace(hostRaw);
  if (!hostState) throw fail("HOST_STATE_UNKNOWN", 400, "The host State could not be identified.");
  if (!resolvePlace(destination)) throw fail("DESTINATION_UNKNOWN", 400, "The destination could not be identified.");
  if (input.documentForm !== "original" && input.documentForm !== "certified_copy") throw fail("REVIEW_INCOMPLETE", 400, "State whether the original or a certified copy is to be authenticated.", ["documentForm"]);
  if (typeof input.pathway !== "string" || !(input.pathway in INSTITUTIONAL_PATHWAYS)) throw fail("PATHWAY_UNKNOWN", 400, "Select one of the candidate pathways.");
  const file = await attachment(db, matterId, input.documentVersionId);
  const previousReviews = (await readEvents(db,matterId)).filter(event=>event.event_type===INSTITUTIONAL_EVENTS.review);
  const maxVersion = Math.max(0,...previousReviews.map(event=>Number(event.new_value?.version)||0));
  const previousId = previousReviews.find(event=>Number(event.new_value?.version)===maxVersion)?.id;
  const eventId = await append(db, matterId, actorId, INSTITUTIONAL_EVENTS.review, {
    issuingOrganisation, issuingOfficial: text(input.issuingOfficial, 200), officialCapacity: text(input.officialCapacity, 200), hostState,
    destination: resolvePlace(destination), documentCategory, documentForm: input.documentForm, pathway: input.pathway,
    documentVersionId: file?.id ?? null, documentSha256: file?.sha256 ?? null, version: maxVersion + 1,
  }, { priorValue: previousId ? { supersedesReview: previousId } : null, evidenceReference: file?.id ?? null, at: now });
  return { eventId };
}

export type EvidenceInput = { key?: unknown; state?: unknown; source?: unknown; verifiedAt?: unknown; expiresAt?: unknown; note?: unknown; documentVersionId?: unknown };

// Records one evidence item for the current review. A later record for the same key supersedes it;
// the earlier record stays in the ledger.
export async function recordInstitutionalEvidence(db: SupabaseClient, matterId: string, actorId: string, input: EvidenceInput, now: Date = new Date()) {
  await requireMatter(db, matterId);
  const state = await loadInstitutionalState(db, matterId, now);
  if (!state.review) throw fail("REVIEW_REQUIRED", 409, "Record what is under review before adding evidence.");
  if (state.rejection) throw fail("PATHWAY_REJECTED", 409, "This pathway was rejected. Record a new review version before adding evidence.");
  const key = input.key as InstitutionalEvidenceKey;
  if (!state.required.some((r) => r.key === key)) throw fail("EVIDENCE_KEY_NOT_REQUIRED", 400, "That evidence is not part of the selected pathway.");
  if (input.state !== "verified" && input.state !== "rejected") throw fail("EVIDENCE_STATE_INVALID", 400, "Evidence is recorded as verified or rejected.");
  const source = text(input.source, 1000), note = text(input.note, 2000);
  const today = now.toISOString().slice(0, 10);
  let verifiedAt: string | null = null, expiresAt: string | null = null;
  if (input.state === "verified") {
    // The name of an organisation or authority is not a source: a reference is mandatory.
    if (!source) throw fail("SOURCE_REQUIRED", 400, "Verified evidence needs its official source: a URL or a document reference.");
    if (!isRealDate(input.verifiedAt) || input.verifiedAt.slice(0, 10) > today) throw fail("VERIFIED_DATE_INVALID", 400, "Give the date the source was verified; it cannot be in the future.");
    verifiedAt = input.verifiedAt;
    if (input.expiresAt !== null && input.expiresAt !== undefined && input.expiresAt !== "") {
      if (!isRealDate(input.expiresAt) || input.expiresAt.slice(0, 10) <= verifiedAt.slice(0, 10)) throw fail("EXPIRY_DATE_INVALID", 400, "The expiry date must be a real date after the verification date.");
      expiresAt = input.expiresAt;
    }
  } else if (!note) {
    throw fail("REJECTION_REASON_REQUIRED", 400, "Say what the authority or source declined.");
  }
  const file = await attachment(db, matterId, input.documentVersionId);
  const previous = state.evidence[key] ?? null;
  const eventId = await append(db, matterId, actorId, INSTITUTIONAL_EVENTS.evidence, {
    reviewEventId: state.review.eventId, key, state: input.state, source: source || null, verifiedAt, expiresAt, note: note || null,
    documentVersionId: file?.id ?? null, sha256: file?.sha256 ?? null, version: (previous?.version ?? 0) + 1, supersedes: previous?.eventId ?? null,
  }, { priorValue: previous ? { supersedes: previous.eventId, version: previous.version } : null, evidenceReference: file?.id ?? null, sourceReference: source || null, reason: input.state === "rejected" ? note : null, at: now });
  return { eventId };
}

// Approves or rejects the pathway. Approval is refused unless, with this approval, the B08
// evaluator would return VERIFIED_ROUTE: complete, sourced, current evidence and a settled treaty
// relationship. The caller has already established that the actor may decide.
export async function decideInstitutionalRoute(db: SupabaseClient, matterId: string, actorId: string, decision: "approve" | "reject", reason: unknown, now: Date = new Date()) {
  await requireMatter(db, matterId);
  const state = await loadInstitutionalState(db, matterId, now);
  if (!state.review) throw fail("REVIEW_REQUIRED", 409, "There is nothing under review.");
  if (state.rejection) throw fail("PATHWAY_REJECTED", 409, "This pathway was already rejected. Record a new review version to consider another pathway.");
  const why = text(reason, 2000);
  if (decision === "reject") {
    if (!why) throw fail("REJECTION_REASON_REQUIRED", 400, "A reason is required to reject a pathway.");
    return { eventId: await append(db, matterId, actorId, INSTITUTIONAL_EVENTS.rejected, { reviewEventId: state.review.eventId }, { reason: why, at: now }) };
  }
  if (!state.review.documentVersionId || !state.review.documentSha256) throw fail('REVIEW_DOCUMENT_REQUIRED',409,'Select the exact Matter document version before approving the institutional route.');
  if (state.approval) throw fail("ALREADY_APPROVED", 409, "This pathway is already approved for the current evidence.");
  const evidence: Partial<Record<InstitutionalEvidenceKey, EvidenceItem>> = {};
  for (const [key, r] of Object.entries(state.evidence) as [InstitutionalEvidenceKey, InstitutionalEvidenceRecord][]) evidence[key] = r.expired ? { state: "unverified" } : { state: r.state, source: r.source, verifiedAt: r.verifiedAt };
  const preview = evaluateInstitutionalRoute({
    documentOrigin: INSTITUTIONAL_DOCUMENT_ORIGIN, issuingOrganisation: state.review.issuingOrganisation, hostState: state.review.hostState, destination: state.review.destination,
    documentCategory: state.review.documentCategory, documentForm: state.review.documentForm, pathway: state.review.pathway, evidence,
    operatorApproval: { approvedBy: actorId, approvedAt: now.toISOString() }, evaluationDate: now.toISOString().slice(0, 10),
  });
  if (preview.decision !== "VERIFIED_ROUTE") {
    throw fail("APPROVAL_NOT_SUPPORTED", 409, "The pathway cannot be approved yet.", { decision: preview.decision, reasons: preview.reasons, outstanding: preview.outstanding.filter((o) => o.key !== "operatorApproval") });
  }
  const covered = Object.fromEntries((Object.values(state.evidence) as InstitutionalEvidenceRecord[]).map((r) => [r.key, r.eventId]));
  return { eventId: await append(db, matterId, actorId, INSTITUTIONAL_EVENTS.approved, { reviewEventId: state.review.eventId, coveredEvidence: covered }, { reason: why || null, at: now }) };
}
