begin;
-- One in-flight sender per existing delivery evidence row. A crashed/unknown
-- attempt stays claimed for operator review; it is never blindly retried.
alter table public.notifications add column if not exists send_claim uuid,
 add column if not exists send_claimed_at timestamptz,add column if not exists next_send_at timestamptz not null default now();
create index if not exists notifications_matter_delivery_page on public.notifications(deal_id,created_at,id);
create index if not exists notifications_retry_queue on public.notifications(delivery_status,next_send_at) where send_claim is null;
commit;
