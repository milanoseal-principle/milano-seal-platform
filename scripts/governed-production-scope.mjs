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
