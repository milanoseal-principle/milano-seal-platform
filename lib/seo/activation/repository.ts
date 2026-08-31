import { createAdminClient } from "@/lib/supabase/admin";
import type { SeoOpportunity as SearchConsoleOpportunity } from "@/lib/seo/search-console/reporting";
import { LOCALIZED_SEO_RECORDS } from "@/lib/seo/localization/registry";
import { isLocalizedSeoRecordPublishable } from "@/lib/seo/localization/runtime";
import { buildSeoActivationCandidates, isFreshVerifiedPlacement, isStaleVerifiedPlacement, summarizeAuthorityEvidence } from "./scoring";
import type {
  AuthorityPlacementStatus,
  AuthorityRelationshipStatus,
  SeoActivationAction,
  SeoAuthorityActivationSnapshot,
  SeoAuthorityPlacement,
  SeoAuthorityRelationship,
} from "./types";

const MISSING_RELATION_CODES = new Set(["42P01", "PGRST205", "PGRST204"]);

function isMissingControlPlaneTable(error: { code?: string | null; message?: string | null } | null) {
  if (!error) return false;
  if (error.code && MISSING_RELATION_CODES.has(error.code)) return true;
  const message = (error.message ?? "").toLowerCase();
  return message.includes("seo_authority_relationships") || message.includes("seo_authority_placements") || message.includes("seo_activation_actions");
}

function provisioningSnapshot(searchOpportunities: SearchConsoleOpportunity[], message: string): SeoAuthorityActivationSnapshot {
  const pendingLocalizedRoutes = LOCALIZED_SEO_RECORDS.filter((record) => !isLocalizedSeoRecordPublishable(record)).map((record) => ({
    locale: record.locale,
    path: record.path,
    englishEquivalent: record.englishEquivalent,
    translationStatus: record.translationStatus,
    indexStatus: record.indexStatus,
  }));
  const derivedCandidates = buildSeoActivationCandidates({ searchOpportunities, relationships: [], placements: [] });
  return {
    provisioned: false,
    provisioningMessage: message,
    relationships: [],
    placements: [],
    actions: [],
    derivedCandidates,
    pendingLocalizedRoutes,
    evidenceSummary: [],
    stalePlacementCount: 0,
    verifiedPlacementCount: 0,
    attributionBoundary: "Search Console demand, localized editorial approval, external authority evidence, and paid Matter revenue remain separate governed signals. No causal query-to-revenue attribution or unevidenced authority claim is created by this control plane.",
  };
}

export async function getSeoAuthorityActivationSnapshot(searchOpportunities: SearchConsoleOpportunity[] = []): Promise<SeoAuthorityActivationSnapshot> {
  const admin = createAdminClient();
  const [{ data: relationships, error: relationshipError }, { data: placements, error: placementError }, { data: actions, error: actionError }] = await Promise.all([
    admin.from("seo_authority_relationships").select("*").order("next_action_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }).limit(500),
    admin.from("seo_authority_placements").select("*").order("last_verified_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(1000),
    admin.from("seo_activation_actions").select("*").in("status", ["OPEN", "IN_PROGRESS"]).order("score", { ascending: false }).order("created_at", { ascending: true }).limit(500),
  ]);

  const firstError = relationshipError ?? placementError ?? actionError;
  if (firstError) {
    if (isMissingControlPlaneTable(firstError)) {
      return provisioningSnapshot(searchOpportunities, "Authority Activation database tables are not provisioned in this environment. The public SEO and Matter systems remain unaffected; apply the governed 072 migration to the Milano production database before using relationship/placement writes.");
    }
    throw new Error(`SEO authority activation read failed: ${firstError.message}`);
  }

  const relationshipRows = (relationships ?? []) as SeoAuthorityRelationship[];
  const placementRows = (placements ?? []) as SeoAuthorityPlacement[];
  const actionRows = (actions ?? []) as SeoActivationAction[];
  const now = new Date();
  const derivedCandidates = buildSeoActivationCandidates({
    searchOpportunities,
    relationships: relationshipRows,
    placements: placementRows,
    now,
  });

  return {
    provisioned: true,
    relationships: relationshipRows,
    placements: placementRows,
    actions: actionRows,
    derivedCandidates,
    pendingLocalizedRoutes: LOCALIZED_SEO_RECORDS.filter((record) => !isLocalizedSeoRecordPublishable(record)).map((record) => ({
      locale: record.locale,
      path: record.path,
      englishEquivalent: record.englishEquivalent,
      translationStatus: record.translationStatus,
      indexStatus: record.indexStatus,
    })),
    evidenceSummary: summarizeAuthorityEvidence(placementRows, relationshipRows, now),
    stalePlacementCount: placementRows.filter((placement) => isStaleVerifiedPlacement(placement, now)).length,
    verifiedPlacementCount: placementRows.filter((placement) => isFreshVerifiedPlacement(placement, now)).length,
    attributionBoundary: "Search Console demand, localized editorial approval, external authority evidence, and paid Matter revenue remain separate governed signals. No causal query-to-revenue attribution or unevidenced authority claim is created by this control plane.",
  };
}

export async function createAuthorityRelationship(input: {
  organizationName: string;
  canonicalDomain?: string | null;
  relationshipClass: string;
  countrySlug?: string | null;
  locale?: string | null;
  pillar?: string | null;
  targetPage: string;
  status: AuthorityRelationshipStatus;
  notes?: string | null;
  nextActionAt?: string | null;
}, actorUserId: string) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin.from("seo_authority_relationships").insert({
    organization_name: input.organizationName,
    canonical_domain: input.canonicalDomain ?? null,
    relationship_class: input.relationshipClass,
    country_slug: input.countrySlug ?? null,
    locale: input.locale ?? null,
    pillar: input.pillar ?? null,
    target_page: input.targetPage,
    status: input.status,
    notes: input.notes ?? null,
    next_action_at: input.nextActionAt ?? null,
    owner_user_id: actorUserId,
    created_by: actorUserId,
    updated_at: now,
  }).select("*").single();
  if (error) throw new Error(`Authority relationship create failed: ${error.message}`);
  return data as SeoAuthorityRelationship;
}

export async function updateAuthorityRelationship(id: string, patch: Record<string, unknown>, actorUserId: string) {
  const admin = createAdminClient();
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const mapping: Record<string, string> = {
    canonicalDomain: "canonical_domain",
    relationshipClass: "relationship_class",
    countrySlug: "country_slug",
    locale: "locale",
    pillar: "pillar",
    targetPage: "target_page",
    status: "status",
    ownerUserId: "owner_user_id",
    notes: "notes",
    lastContactedAt: "last_contacted_at",
    nextActionAt: "next_action_at",
  };
  for (const [key, value] of Object.entries(patch)) if (key in mapping) dbPatch[mapping[key]] = value;
  if (patch.status === "CONTACTED" && !patch.lastContactedAt) dbPatch.last_contacted_at = new Date().toISOString();
  if (!dbPatch.owner_user_id) dbPatch.owner_user_id = actorUserId;
  const { data, error } = await admin.from("seo_authority_relationships").update(dbPatch).eq("id", id).select("*").single();
  if (error) throw new Error(`Authority relationship update failed: ${error.message}`);
  return data as SeoAuthorityRelationship;
}

export async function createAuthorityPlacement(input: {
  relationshipId: string;
  targetPage: string;
  sourceUrl: string;
  placementType: string;
  anchorText?: string | null;
  status: AuthorityPlacementStatus;
  verificationMethod?: string | null;
  evidenceSnapshot?: Record<string, unknown>;
}, actorUserId: string) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const verified = input.status === "VERIFIED";
  const { data, error } = await admin.from("seo_authority_placements").insert({
    relationship_id: input.relationshipId,
    target_page: input.targetPage,
    source_url: input.sourceUrl,
    placement_type: input.placementType,
    anchor_text: input.anchorText ?? null,
    status: input.status,
    verification_method: input.verificationMethod ?? null,
    first_seen_at: verified ? now : null,
    last_checked_at: verified ? now : null,
    last_verified_at: verified ? now : null,
    verified_by: verified ? actorUserId : null,
    evidence_snapshot: input.evidenceSnapshot ?? {},
    created_by: actorUserId,
    updated_at: now,
  }).select("*").single();
  if (error) throw new Error(`Authority placement create failed: ${error.message}`);
  if (verified) {
    await admin.from("seo_authority_relationships").update({ status: "VERIFIED", updated_at: now }).eq("id", input.relationshipId);
  }
  return data as SeoAuthorityPlacement;
}

export async function updateAuthorityPlacement(id: string, patch: Record<string, unknown>, actorUserId: string) {
  const admin = createAdminClient();
  const currentResult = await admin.from("seo_authority_placements").select("*").eq("id", id).single();
  if (currentResult.error) throw new Error(`Authority placement lookup failed: ${currentResult.error.message}`);
  const current = currentResult.data as SeoAuthorityPlacement;
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const mapping: Record<string, string> = {
    targetPage: "target_page",
    sourceUrl: "source_url",
    placementType: "placement_type",
    anchorText: "anchor_text",
    status: "status",
    verificationMethod: "verification_method",
    evidenceSnapshot: "evidence_snapshot",
  };
  for (const [key, value] of Object.entries(patch)) if (key in mapping) dbPatch[mapping[key]] = value;

  const nextStatus = (patch.status ?? current.status) as AuthorityPlacementStatus;
  const nextMethod = (patch.verificationMethod ?? current.verification_method) as string | null;
  if (nextStatus === "VERIFIED") {
    if (!nextMethod) throw new Error("Verified placement requires a verification method.");
    const now = new Date().toISOString();
    dbPatch.verification_method = nextMethod;
    dbPatch.last_checked_at = now;
    dbPatch.last_verified_at = now;
    dbPatch.verified_by = actorUserId;
    if (!current.first_seen_at) dbPatch.first_seen_at = now;
  } else if (patch.status) {
    dbPatch.last_checked_at = new Date().toISOString();
  }

  const { data, error } = await admin.from("seo_authority_placements").update(dbPatch).eq("id", id).select("*").single();
  if (error) throw new Error(`Authority placement update failed: ${error.message}`);
  if (nextStatus === "VERIFIED") {
    await admin.from("seo_authority_relationships").update({ status: "VERIFIED", updated_at: new Date().toISOString() }).eq("id", current.relationship_id);
  }
  return data as SeoAuthorityPlacement;
}

export async function syncSeoActivationActions(searchOpportunities: SearchConsoleOpportunity[], actorUserId: string) {
  const admin = createAdminClient();
  const snapshot = await getSeoAuthorityActivationSnapshot(searchOpportunities);
  if (!snapshot.provisioned) throw new Error(snapshot.provisioningMessage ?? "Authority Activation database is not provisioned.");

  const { data: existing, error: existingError } = await admin.from("seo_activation_actions").select("*").limit(2000);
  if (existingError) throw new Error(`Activation action sync lookup failed: ${existingError.message}`);
  const existingRows = (existing ?? []) as SeoActivationAction[];
  const existingByKey = new Map(existingRows.map((row) => [row.action_key, row]));
  const candidateKeys = new Set(snapshot.derivedCandidates.map((candidate) => candidate.actionKey));
  const now = new Date().toISOString();

  const upserts = snapshot.derivedCandidates.map((candidate) => {
    const prior = existingByKey.get(candidate.actionKey);
    const terminal = prior && ["COMPLETED", "DISMISSED"].includes(prior.status);
    return {
      action_key: candidate.actionKey,
      target_page: candidate.targetPage,
      action_type: candidate.actionType,
      priority: candidate.priority,
      score: candidate.score,
      rationale: candidate.rationale,
      source_signals: candidate.sourceSignals,
      status: terminal ? prior.status : prior?.status === "IN_PROGRESS" ? "IN_PROGRESS" : "OPEN",
      owner_user_id: prior?.owner_user_id ?? null,
      created_by: prior?.created_by ?? actorUserId,
      resolution_notes: prior?.resolution_notes ?? null,
      completed_at: prior?.completed_at ?? null,
      completed_by: prior?.completed_by ?? null,
      updated_at: now,
    };
  });

  if (upserts.length > 0) {
    const { error } = await admin.from("seo_activation_actions").upsert(upserts, { onConflict: "action_key" });
    if (error) throw new Error(`Activation action sync failed: ${error.message}`);
  }

  const supersededIds = existingRows
    .filter((row) => ["OPEN", "IN_PROGRESS"].includes(row.status) && !candidateKeys.has(row.action_key))
    .map((row) => row.id);
  if (supersededIds.length > 0) {
    const { error } = await admin.from("seo_activation_actions").update({ status: "SUPERSEDED", updated_at: now }).in("id", supersededIds);
    if (error) throw new Error(`Activation supersede failed: ${error.message}`);
  }

  return getSeoAuthorityActivationSnapshot(searchOpportunities);
}

export async function updateSeoActivationAction(id: string, patch: Record<string, unknown>, actorUserId: string) {
  const admin = createAdminClient();
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("status" in patch) dbPatch.status = patch.status;
  if ("ownerUserId" in patch) dbPatch.owner_user_id = patch.ownerUserId;
  if ("resolutionNotes" in patch) dbPatch.resolution_notes = patch.resolutionNotes;
  if (patch.status === "COMPLETED") {
    dbPatch.completed_at = new Date().toISOString();
    dbPatch.completed_by = actorUserId;
  } else if (patch.status && patch.status !== "COMPLETED") {
    dbPatch.completed_at = null;
    dbPatch.completed_by = null;
  }
  const { data, error } = await admin.from("seo_activation_actions").update(dbPatch).eq("id", id).select("*").single();
  if (error) throw new Error(`Activation action update failed: ${error.message}`);
  return data as SeoActivationAction;
}
