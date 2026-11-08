// Exact paths authorized by the P4B statutory-evidence directive. This extends
// existing phase allowlists; it does not exempt any other protected path.
// Regression coverage: test:p4-database, p4RonEvidenceIntegrity.test.ts,
// p4RONStatutoryEvidence.test.ts. The rollout/evidence limits are documented in
// docs/P4B_IMPLEMENTATION_EVIDENCE.md.
export const P4B_PROTECTED_CHANGES = [
  'app/api/webhooks/bluenotary/route.ts',
  'lib/bluenotary/guards.ts',
  'lib/bluenotary/evidenceFailures.ts',
  'lib/bluenotary/projection.ts',
  'lib/bluenotary/signedDocumentStorage.ts',
  'lib/bluenotary/statutoryEvidence.ts',
  'lib/bluenotary/types.ts',
  'lib/bluenotary/webhook.ts',
  'supabase/migrations/20261108042000_p4_ron_statutory_evidence.sql',
];

// Exact P5 incident delta authorized by the continuation directive. Guards and
// behavior remain exercised by test:p5-database and the role/incident unit tests.
export const P5_PROTECTED_CHANGES = [
  'app/api/dashboard/ron/security-incidents/route.ts',
  'lib/bluenotary/securityIncidents.ts',
  'supabase/migrations/20261108090916_ron_incident_evidence_controls.sql',
];

// Exact corporate-governance delta authorized by G1–G5. New roles cannot author
// client Matter/payment/execution truth; actual SQL/RLS tests enforce the boundary.
export const AI_GOVERNANCE_PROTECTED_CHANGES = [
  'supabase/migrations/20261108180000_operator_authority_prerequisite.sql',
  'supabase/migrations/20261108190000_ai_corporate_governance.sql',
  'supabase/migration-replay-plan.json',
];

// Final gap-closure directive: stricter payment/release, private exports, immutable
// evidence and bounded sends. Exercised by test:gap-closure-database, test:upgrade-restore,
// test:ai-governance-database and gapClosureSecurity.test.ts.
export const GAP_CLOSURE_PROTECTED_CHANGES = [
 'app/api/courier/labels/route.ts','app/api/shipping/create-label/[id]/route.ts',
 'app/api/dashboard/shippo/labels/route.ts','app/api/webhooks/resend/route.ts',
 'app/api/dashboard/custody/[matterId]/route.ts','app/api/deals/[id]/custody/route.ts',
 'app/api/deals/[id]/release/route.ts','lib/release/performFinalRelease.ts','lib/custodyLedger.ts',
 'supabase/migrations/20261108200000_governance_execution_revalidation.sql',
 'supabase/migrations/20261108201000_custody_atomic_content_evidence.sql',
 'supabase/migrations/20261108202000_financial_artifact_snapshots.sql',
 'supabase/migrations/20261108203000_notification_send_claim.sql',
 'supabase/migrations/20261108204000_document_release_lineage.sql',
 'supabase/migrations/20261108205000_canonical_status_compatibility.sql',
 'supabase/migrations/20261108210000_certification_review_history.sql',
 'supabase/migrations/20261108211000_governance_health_observation.sql',
];
