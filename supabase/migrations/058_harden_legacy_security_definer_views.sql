begin;

-- Supabase security-linter closeout: legacy views must execute with the
-- querying role's permissions/RLS, never the view owner's elevated rights.
alter view public.client_safe_invoice_view set (security_invoker = true);
alter view public.client_safe_timeline_view set (security_invoker = true);
alter view public.pipeline_summary set (security_invoker = true);
alter view public.daily_leads set (security_invoker = true);
alter view public.operator_current_availability set (security_invoker = true);
alter view public.matter_identifier_lock_status set (security_invoker = true);

-- Client-safe projections are signed-in read-only surfaces.
revoke all on public.client_safe_invoice_view from anon, authenticated;
revoke all on public.client_safe_timeline_view from anon, authenticated;
grant select on public.client_safe_invoice_view to authenticated;
grant select on public.client_safe_timeline_view to authenticated;

-- Internal aggregate/operator projections are server-only.
revoke all on public.pipeline_summary from anon, authenticated;
revoke all on public.daily_leads from anon, authenticated;
revoke all on public.operator_current_availability from anon, authenticated;
revoke all on public.matter_identifier_lock_status from anon, authenticated;

commit;
