-- Restore the discount_codes audit contract expected by the canonical discount service.
-- The portal discount lookup selects updated_by as governed audit metadata.
-- Additive only: no existing discount, Matter, pricing, payment, or redemption data is rewritten.

alter table public.discount_codes
  add column if not exists updated_by uuid null;

comment on column public.discount_codes.updated_by is
  'Optional user UUID recording the last governed update to the discount definition.';
