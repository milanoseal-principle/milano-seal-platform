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
  'supabase/migrations/20261109215307_no_auth_execution_proof_all_release_states.sql',
 'supabase/migrations/20261109211027_release_identifier_matter_type_compatibility.sql',
 'scripts/certification/p19-no-auth-release.mjs',
 'lib/ron/evidence.ts','app/api/dashboard/ron/sessions/[id]/evidence/verify/route.ts',
 // Current-main P19 restoration and verified canonical defects (scope record).
 'app/api/deals/[id]/pay/route.ts','lib/payments/instruction.ts',
 'app/api/portal/me/upload/route.ts','app/api/va/uploads/route.ts',
 'scripts/certification/p19-e2e.mjs','scripts/certification/sql-client.mjs','scripts/certification/ron-matter-fixture.mjs',
 'supabase/migrations/20261109193307_canonical_wise_instruction_columns.sql',
 'supabase/migrations/20261109193443_ron_governed_correction_reverification.sql',
 'supabase/migrations/20261109193825_matter_delivery_close_release_evidence.sql',
 // User-authorized P20–P23 simulations and verified canonical evidence defects.
 // Exact boundaries exercised by certify:source; no live/hosted authority.
 'lib/wise.ts','lib/documents/versions.ts',
 'components/dashboard/MatterDetailDrawer.tsx',
 'lib/safety/payment-integrity.ts','lib/payments/paymentGate.ts','lib/payments/complimentary-safety.ts',
 'src/features/payments/paymentGateService.ts','src/features/milano/types.ts',
 'scripts/certification/p20-wise.mjs','scripts/certification/p21-ron.mjs',
 'scripts/certification/p22-authentication.mjs','scripts/certification/p23-recovery.mjs',
 'app/api/dashboard/custody/[matterId]/route.ts',
 'supabase/migrations/20261109110000_ron_statutory_lifecycle_boundary.sql',
 'supabase/migrations/20261109120000_authority_return_release_evidence.sql',
 'supabase/migrations/20261109130000_ron_correction_progression_guard.sql',

 // User-authorized current-truth exception resolution and private operational evidence.
 'supabase/migrations/20261109062000_wise_exception_current_truth.sql',
 'app/api/admin/wise/health/route.ts',
 // Auth-required diagnostics; actual HTTP denial regression covers this route.
 'app/api/health/webhooks/route.ts',
 'docs/production/P24_P30_EXISTING_SOURCE_MAP_2026-11-09.md',

 // User-authorized P7 retention continuation; real SQL claim/hold/role tests.
 'supabase/migrations/20261109061000_retention_claim_and_hold_authority.sql',

 // 2026-11-12 user-authorized API authorization remediation; exact paths only.
 // Adds operator authorization (founder-only manual confirmation) and session-
 // derived audit attribution; no payment rule changes. tests/operator-api-authorization.test.ts.
 'app/api/deals/[id]/payment/manual-confirm/route.ts','app/api/deals/[id]/payment/request-final/route.ts',
 // 2026-11-12 user-authorized RLS policy remediation from the P12 catalog review;
 // exact path only. Regression: tests/public-rls-policy-revocation.test.ts.
 'supabase/migrations/20261112090000_revoke_unrestricted_public_rls_policies.sql','tests/public-rls-policy-revocation.test.ts',
 // 2026-11-12 user-authorized upload write-contract restoration; exact path only.
 'supabase/migrations/20261112100000_files_upload_compatibility_columns.sql',

 'app/api/portal/me/ron/route.ts','scripts/validate-ron-bluenotary-client-journey.mjs',
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
 'scripts/validate-verified-settlement-before-scheduling.mjs','scripts/validate-postpayment-ron-matter-progression.mjs',
 'scripts/validate-payment-release-gates.mjs',
 'scripts/validate-custody-ledger-schema.mjs',
];

// P1 narrow release deadlock repair; only the new forward owner is allowed.
export const NO_AUTH_RELEASE_PROTECTED_CHANGES = [
 'supabase/migrations/20261109200000_no_authentication_release_deadlock.sql',
];

// Explicitly reviewed Nov 9 hosted recovery defects. Both additions are
// forward-only; neither changes a payment authority, Matter row or RLS grant.
export const HOSTED_RECOVERY_PROTECTED_CHANGES = [
 'supabase/migrations/20261109140000_identifier_hash_extension_compatibility.sql',
 'supabase/migrations/20261109150000_private_evidence_table_privileges.sql',
];

// 2026-11-09 founder decision: NO VERIFIED WISE SETTLEMENT -> NO SCHEDULING.
// User-authorized exact paths only; proven by validate-verified-settlement-before-scheduling,
// test:gap-closure-database and test:wise-attempt-database. No other protected path is opened.
export const SETTLEMENT_SCHEDULING_PROTECTED_CHANGES = [
 'supabase/migrations/20261109090000_verified_settlement_before_scheduling.sql',
 'lib/bluenotary/guards.ts',
 'components/payments/SecurePaymentCard.tsx',
 'app/api/portal/me/payment-observation/route.ts',
 'app/dashboard/payments/reconciliation/page.tsx',
 'app/portal/payment/page.tsx',
 'scripts/test-gap-closure-sql.mjs',
 'scripts/validate-wise-reconciliation-exception-orchestrator.mjs',
 'scripts/validate-final-branch-salvage-audit.mjs',
 'scripts/validate-immediate-scheduling-after-wise-submission.mjs',
 'tests/payment-submission-handoff-p0.test.ts',
 'tests/payment-submission-immediate-scheduling-p0.test.ts',
 'tests/portal-payment-truth-projection.test.ts',
 'tests/unit/paymentAuthorityRegression.test.ts',
 'tests/unit/schedulingPaymentGate.test.ts',
 'docs/control-plane/VERIFIED_SETTLEMENT_P0_HOTFIX.md',
 'scripts/validate-complimentary-matter-flow.mjs',
];
