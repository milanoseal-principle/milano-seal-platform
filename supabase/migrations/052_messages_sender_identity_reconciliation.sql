-- Reconcile production messages schema with the canonical notification/portal contract.
-- Additive and idempotent: existing message rows remain valid.

alter table public.messages
  add column if not exists sender_role text,
  add column if not exists sender_name text;

comment on column public.messages.sender_role is
  'Canonical sender role used by portal and notification projections.';

comment on column public.messages.sender_name is
  'Canonical display sender used by portal and notification projections.';
