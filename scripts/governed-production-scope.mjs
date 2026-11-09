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
 // User-authorized P7 retention continuation; real SQL claim/hold/role tests.
 'supabase/migrations/20261109061000_retention_claim_and_hold_authority.sql',

 // 2026-11-09 user-authorized Wise cancellation remediation; exact paths only.
 // Positive/negative authority tests run in test:wise-attempt-database and the
 // existing full release gate. All other protected-path restrictions remain.
 'app/api/webhooks/wise/route.ts',
 'lib/wise/attemptEvidence.ts','lib/wise/reconciliation.ts','lib/wise/reconciliation-exceptions.ts',
 'supabase/migrations/20261109060000_wise_attempt_authority.sql',
 'scripts/test-wise-attempt-sql.mjs','tests/wise-attempt-authority.test.ts',
 'tests/wise-acquiring-reconciliation-p0.test.ts',
 'docs/production/WISE_ATTEMPT_SECURITY_2026-11-09.md',
 'app/api/courier/labels/route.ts','app/api/shipping/create-label/[id]/route.ts',
 'app/api/dashboard/shippo/labels/route.ts','app/api/dashboard/shippo/rates/route.ts','lib/shippo/address.ts','app/api/webhooks/resend/route.ts',
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
 'supabase/migrations/20261108212000_canonical_notification_queue.sql',
 'supabase/migrations/20261108213000_document_version_binding.sql',
 'supabase/migrations/20261108214000_canonical_projection_columns.sql',
 // Residual directive #454: restore the canonical authority split, with real SQL negatives.
 'supabase/migrations/20261108220000_wise_authority_separation.sql',
 'tests/bluenotary-production-reconciliation.test.ts','tests/wise-payment-observation-notifications.test.ts',
 'lib/stateMachine.ts','lib/scheduling/complimentarySchedulingGate.ts','lib/pipelineEngine.ts','lib/platform/matterStateAdapters.ts',
 'app/api/deals/[id]/schedule/route.ts','app/api/deals/[id]/execute/route.ts','app/api/admin/matters/[id]/status/route.ts',
 'scripts/validate-postpayment-ron-corridor.mjs','scripts/validate-tiffany-post-test-final-audit.mjs',
 'scripts/validate-immediate-scheduling-after-wise-submission.mjs','scripts/validate-postpayment-ron-matter-progression.mjs',
 'scripts/validate-payment-release-gates.mjs',
 'scripts/validate-custody-ledger-schema.mjs',
];
