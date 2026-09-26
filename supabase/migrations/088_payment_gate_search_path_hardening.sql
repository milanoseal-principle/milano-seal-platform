-- Security hardening: pin the trigger function search_path so object resolution
-- cannot be influenced by caller/session search_path state.
alter function public.check_payment_gate()
  set search_path = public, pg_temp;
