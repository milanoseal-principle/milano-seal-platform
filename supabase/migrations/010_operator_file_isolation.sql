-- 010_operator_file_isolation.sql
-- Adds assignee_user_id to deals to support operator-level file and deal isolation
-- at the database layer. This migration is required by SECURITY-06 / resource-guards.ts.
-- Without this column, operator file isolation is enforced at application layer only.

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_assignee_user_id ON deals(assignee_user_id);

-- Allow operators to read only deals assigned to them (when assignee_user_id is set)
-- Admins retain full access via existing policies.
-- This policy is additive — existing service_role and admin policies are unchanged.
COMMENT ON COLUMN deals.assignee_user_id IS
  'UUID of the auth.users row for the operator assigned to this deal. '
  'Used for operator-level row isolation in resource-guards.ts.';
