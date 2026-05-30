-- 003_va_tasks.sql: VA Task persistence layer
-- Milano Seal Platform
-- Apply via: supabase db push or psql against your Supabase project
--
-- Prerequisite: 002_rls_storage_policies.sql must be applied first.
--
-- Creates:
--   va_tasks       — one row per assigned task
--   va_task_events — append-only audit log per task action
-- ============================================================


-- ============================================================
-- 1. va_tasks
-- ============================================================

CREATE TABLE IF NOT EXISTS public.va_tasks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id     UUID        REFERENCES public.deals(id) ON DELETE SET NULL,
  assigned_to   UUID        NOT NULL,
  assigned_by   UUID        NOT NULL,
  task_type     TEXT        NOT NULL
    CHECK (task_type IN (
      'verify_upload',
      'request_missing_id',
      'translation_follow_up',
      'courier_confirmation',
      'schedule_reminder',
      'apostille_follow_up',
      'embassy_dependency',
      'client_follow_up',
      'release_coordination',
      'document_correction_required'
    )),
  status        TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'in_progress',
      'review',
      'escalated',
      'completed',
      'cancelled'
    )),
  urgency       TEXT        NOT NULL DEFAULT 'medium'
    CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  due_at        TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  escalated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes_public  TEXT,
  next_action   TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS va_tasks_assigned_to_idx  ON public.va_tasks (assigned_to);
CREATE INDEX IF NOT EXISTS va_tasks_status_idx        ON public.va_tasks (status);
CREATE INDEX IF NOT EXISTS va_tasks_matter_id_idx     ON public.va_tasks (matter_id);


-- ============================================================
-- 2. va_task_events
-- ============================================================

CREATE TABLE IF NOT EXISTS public.va_task_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID        NOT NULL REFERENCES public.va_tasks(id) ON DELETE CASCADE,
  matter_id   UUID        REFERENCES public.deals(id) ON DELETE SET NULL,
  actor_id    UUID        NOT NULL,
  event_type  TEXT        NOT NULL
    CHECK (event_type IN (
      'VA_TASK_CREATED',
      'VA_TASK_ASSIGNED',
      'VA_TASK_COMPLETED',
      'VA_TASK_ESCALATED',
      'VA_TASK_CANCELLED'
    )),
  description TEXT,
  severity    TEXT        NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS va_task_events_task_id_idx  ON public.va_task_events (task_id);
CREATE INDEX IF NOT EXISTS va_task_events_actor_id_idx ON public.va_task_events (actor_id);


-- ============================================================
-- 3. Row-Level Security
-- ============================================================

ALTER TABLE public.va_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.va_task_events ENABLE ROW LEVEL SECURITY;

-- service_role bypasses RLS by default in Supabase (no policy needed).

-- anon: no policy = default deny on both tables.

-- authenticated: VA users may read only their own assigned tasks.
CREATE POLICY "va_own_task_read"
  ON public.va_tasks
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- authenticated: no direct write access to va_tasks or va_task_events.
-- All mutations go through the app layer via createAdminClient().


-- ============================================================
-- SCHEMA NOTE
-- ============================================================
-- assigned_to and assigned_by are UUID columns that reference auth.users
-- conceptually but carry no FK constraint (auth.users is in the auth
-- schema, not public). The app layer validates user existence before insert.
-- ============================================================
