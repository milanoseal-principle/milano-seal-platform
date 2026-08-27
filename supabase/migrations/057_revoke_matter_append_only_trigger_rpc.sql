begin;

-- Trigger-only functions for Matter evidence/snapshot append-only enforcement
-- must not be callable through PostgREST RPC by public client roles.
revoke execute on function public.prevent_matter_evidence_ledger_mutation() from public;
revoke execute on function public.prevent_matter_evidence_ledger_mutation() from anon;
revoke execute on function public.prevent_matter_evidence_ledger_mutation() from authenticated;

revoke execute on function public.prevent_matter_truth_snapshot_mutation() from public;
revoke execute on function public.prevent_matter_truth_snapshot_mutation() from anon;
revoke execute on function public.prevent_matter_truth_snapshot_mutation() from authenticated;

commit;
