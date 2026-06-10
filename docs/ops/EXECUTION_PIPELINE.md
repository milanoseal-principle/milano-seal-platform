# Scalable Execution Pipeline

**Module:** Execution Job Queue  
**Status:** Spec ready — wire after DB health passes  
**Target table:** `execution_jobs`

---

## Purpose

Performance is the silent partner of competence. By decoupling document generation from the main UI thread, the Milano Seal OS remains responsive under global load. High-volume document processing runs in the background, invisible to the client, until the final output is delivered with absolute precision.

---

## Schema

```sql
CREATE TABLE IF NOT EXISTS execution_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id       TEXT NOT NULL,
  job_type        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','processing','completed','failed','retrying')),
  attempt_count   INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  payload         JSONB NULL,
  result          JSONB NULL,
  error_message   TEXT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ NULL,
  completed_at    TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_execjobs_matter_id ON execution_jobs(matter_id);
CREATE INDEX IF NOT EXISTS idx_execjobs_status    ON execution_jobs(status);
CREATE INDEX IF NOT EXISTS idx_execjobs_job_type  ON execution_jobs(job_type);
```

---

## Job Types

| Job Type | Description |
|---|---|
| `DOCUMENT_PARSE` | Parse uploaded document for metadata/QA |
| `PACKET_QA` | Validate execution packet completeness |
| `APOSTILLE_ROUTING` | Determine SOS routing for apostille |
| `COVER_LETTER_GENERATION` | Generate SOS cover letter |
| `COURIER_LABEL_PREP` | Stage Shippo label creation |
| `RELEASE_PACKET` | Prepare final document release |
| `REVIEW_REQUEST` | Trigger review prompt after completion |

---

## Status Flow

```
queued → processing → completed
                    ↓
              failed (if attempt_count >= max_attempts)
                    ↓
              retrying (if attempt_count < max_attempts)
```

---

## Rules

- No frontend timeout — jobs are dequeued async
- No duplicate jobs — check for existing queued/processing job before inserting
- Retry safe — idempotent job handlers
- Audit log on status changes: `JOB_STARTED`, `JOB_COMPLETED`, `JOB_FAILED`
- No client access to `execution_jobs` table
- Dashboard: `/dashboard/execution-jobs` (founder_admin only)
