import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SEO_AUTHORITY_NODES } from "@/lib/seo/authority/registry";
import { LOCALIZED_SEO_RECORDS } from "@/lib/seo/localization/registry";
import {
  buildSeoActivationCandidates,
  isFreshVerifiedPlacement,
  isStaleVerifiedPlacement,
  normalizeMilanoPath,
  SEO_AUTHORITY_PLACEMENT_STALE_AFTER_DAYS,
} from "@/lib/seo/activation/scoring";
import type { SeoAuthorityPlacement, SeoAuthorityRelationship } from "@/lib/seo/activation/types";

const relationship: SeoAuthorityRelationship = {
  id: "11111111-1111-4111-8111-111111111111",
  organization_name: "Verified Professional Firm",
  canonical_domain: "example.org",
  relationship_class: "LAW_FIRM",
  country_slug: "italy",
  locale: "it-IT",
  pillar: "international-professionals",
  target_page: SEO_AUTHORITY_NODES[0].path,
  status: "ENGAGED",
  owner_user_id: null,
  created_by: null,
  notes: null,
  last_contacted_at: null,
  next_action_at: null,
  created_at: "2026-08-30T00:00:00.000Z",
  updated_at: "2026-08-30T00:00:00.000Z",
};

function placement(overrides: Partial<SeoAuthorityPlacement> = {}): SeoAuthorityPlacement {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    relationship_id: relationship.id,
    target_page: relationship.target_page,
    source_url: "https://example.org/resources/milano-seal",
    placement_type: "EDITORIAL_CITATION",
    anchor_text: "U.S. document execution",
    status: "VERIFIED",
    verification_method: "MANUAL_REVIEW",
    first_seen_at: "2026-08-30T00:00:00.000Z",
    last_checked_at: "2026-08-30T00:00:00.000Z",
    last_verified_at: "2026-08-30T00:00:00.000Z",
    verified_by: "33333333-3333-4333-8333-333333333333",
    evidence_snapshot: { operatorConfirmedVisible: true },
    created_by: null,
    created_at: "2026-08-30T00:00:00.000Z",
    updated_at: "2026-08-30T00:00:00.000Z",
    ...overrides,
  };
}

test("activation path normalization accepts only Milano-owned search pages", () => {
  assert.equal(normalizeMilanoPath("https://www.themilanoseal.com/apostille/italy/test?x=1"), "/apostille/italy/test");
  assert.equal(normalizeMilanoPath("/professional/italy#review"), "/professional/italy");
  assert.equal(normalizeMilanoPath("https://example.com/apostille/italy"), null);
});

test("external authority only counts as fresh when verification evidence is complete and current", () => {
  const now = new Date("2026-08-31T00:00:00.000Z");
  assert.equal(isFreshVerifiedPlacement(placement(), now), true);
  assert.equal(isFreshVerifiedPlacement(placement({ verified_by: null }), now), false);
  assert.equal(isFreshVerifiedPlacement(placement({ verification_method: null }), now), false);
  const staleDate = new Date(now.getTime() - (SEO_AUTHORITY_PLACEMENT_STALE_AFTER_DAYS + 1) * 86_400_000).toISOString();
  assert.equal(isFreshVerifiedPlacement(placement({ last_verified_at: staleDate }), now), false);
  assert.equal(isStaleVerifiedPlacement(placement({ last_verified_at: staleDate }), now), true);
});

test("activation queue uses verified search demand without claiming query-to-revenue causation", () => {
  const target = SEO_AUTHORITY_NODES[0].path;
  const candidates = buildSeoActivationCandidates({
    searchOpportunities: [{
      query: "apostille document italy",
      page: `https://www.themilanoseal.com${target}`,
      impressions: 800,
      clicks: 8,
      ctr: 0.01,
      position: 7,
      priority: "HIGH",
    }],
    relationships: [],
    placements: [],
    now: new Date("2026-08-31T00:00:00.000Z"),
  });
  assert.ok(candidates.some((candidate) => candidate.actionType === "IMPROVE_SNIPPET"));
  assert.ok(candidates.some((candidate) => candidate.actionType === "REFRESH_CONTENT"));
  assert.ok(candidates.some((candidate) => candidate.actionType === "EARN_AUTHORITY_CITATION"));
  const serializedSignals = JSON.stringify(candidates.map((candidate) => candidate.sourceSignals)).toLowerCase();
  assert.doesNotMatch(serializedSignals, /revenue|paid matter|wise/);
});

test("fresh verified authority evidence suppresses the earn-citation gap for the same page", () => {
  const target = SEO_AUTHORITY_NODES[0].path;
  const rel = { ...relationship, target_page: target, status: "VERIFIED" as const };
  const verifiedPlacement = placement({ target_page: target, relationship_id: rel.id });
  const candidates = buildSeoActivationCandidates({
    searchOpportunities: [{ query: "apostille italy", page: target, impressions: 600, clicks: 12, ctr: 0.02, position: 8, priority: "HIGH" }],
    relationships: [rel],
    placements: [verifiedPlacement],
    now: new Date("2026-08-31T00:00:00.000Z"),
  });
  assert.equal(candidates.some((candidate) => candidate.actionKey === `authority:${target}`), false);
});

test("professional relationships produce outreach work until real placement evidence is verified", () => {
  const candidates = buildSeoActivationCandidates({ searchOpportunities: [], relationships: [relationship], placements: [] });
  const outreach = candidates.find((candidate) => candidate.actionType === "PROFESSIONAL_OUTREACH");
  assert.ok(outreach);
  assert.equal(outreach?.sourceSignals.relationshipStatus, "ENGAGED");
  assert.ok((outreach?.score ?? 0) >= 70);
});

test("all unreviewed localized routes stay in the human-review activation queue", () => {
  const candidates = buildSeoActivationCandidates({ searchOpportunities: [], relationships: [], placements: [] });
  const localization = candidates.filter((candidate) => candidate.actionType === "LOCALIZE_AFTER_REVIEW");
  assert.equal(localization.length, LOCALIZED_SEO_RECORDS.length);
  for (const candidate of localization) {
    assert.equal(candidate.sourceSignals.indexStatus, "NOINDEX");
    assert.equal(candidate.sourceSignals.translationStatus, "HUMAN_REVIEW_REQUIRED");
  }
});

test("migration keeps authority control plane private and evidence-gated", () => {
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/072_seo_authority_activation_control_plane.sql"), "utf8");
  assert.match(sql, /revoke all on public\.seo_authority_relationships from public, anon, authenticated;/i);
  assert.match(sql, /revoke all on public\.seo_authority_placements from public, anon, authenticated;/i);
  assert.match(sql, /revoke all on public\.seo_activation_actions from public, anon, authenticated;/i);
  assert.match(sql, /status <> 'VERIFIED' or[\s\S]*last_verified_at is not null[\s\S]*verified_by is not null[\s\S]*verification_method is not null/i);
  assert.doesNotMatch(sql, /stripe/i);
});

test("fresh Supabase replay adds delivery projection columns before client-safe view creation", () => {
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/008_missing_views_and_tables.sql"), "utf8");
  const addColumns = sql.indexOf("ADD COLUMN IF NOT EXISTS delivery_status");
  const createView = sql.indexOf("CREATE OR REPLACE VIEW public.client_safe_matter_view");
  assert.ok(addColumns >= 0, "delivery_status compatibility column must be declared");
  assert.ok(createView >= 0, "client-safe Matter view must be declared");
  assert.ok(addColumns < createView, "compatibility columns must exist before view replay");
});

test("legacy RON migration never requires a phantom va_assignments table during fresh replay", () => {
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/018_bluenotary_ron.sql"), "utf8");
  const guardMatches = sql.match(/to_regclass\('public\.va_assignments'\) IS NOT NULL/g) ?? [];
  assert.equal(guardMatches.length, 3, "every legacy VA RON policy must be conditional");
  assert.doesNotMatch(sql, /CREATE POLICY "ron_(sessions|signers|documents)_va_read"[\s\S]{0,300}SELECT deal_id FROM va_assignments(?![\s\S]{0,120}\$policy\$)/);
});
