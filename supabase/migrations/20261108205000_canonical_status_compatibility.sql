begin;
-- The old 001 compatibility check rejected 089's legitimate payment_confirmed
-- projection. Expand only the legacy projection; the canonical status trigger
-- continues to enforce the locked canonical transition graph.
alter table public.deals drop constraint if exists deals_deal_status_check;
alter table public.deals add constraint deals_deal_status_check check(deal_status in (
 'intake_received','under_review','quoted','awaiting_payment','payment_confirmed','scheduled',
 'in_execution','apostille_processing','in_transit','delivered','completed','dormant',
 'new','reviewing','apostille','shipped','lost'
)) not valid;
alter table public.deals alter column status set default 'intake_received';
alter table public.deals alter column deal_status set default 'intake_received';
commit;
