-- Delivery protocol controls.
-- Extends the existing operator-only delivery_logs table without exposing it
-- through client policies.

ALTER TABLE delivery_logs
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS matter_type text,
  ADD COLUMN IF NOT EXISTS execution_lane text,
  ADD COLUMN IF NOT EXISTS version_type text,
  ADD COLUMN IF NOT EXISTS pdf_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_file_url text,
  ADD COLUMN IF NOT EXISTS follow_up_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS final_approval_confirmed boolean NOT NULL DEFAULT false;

UPDATE delivery_logs
SET status = CASE lower(status)
  WHEN 'draft' THEN 'Draft'
  WHEN 'generated' THEN 'Generated'
  WHEN 'sent' THEN 'Sent'
  WHEN 'confirmed' THEN 'Confirmed'
  WHEN 'closed' THEN 'Closed'
  ELSE 'Draft'
END;

ALTER TABLE delivery_logs
  ALTER COLUMN status SET DEFAULT 'Draft';

ALTER TABLE delivery_logs
  DROP CONSTRAINT IF EXISTS delivery_logs_status_check,
  ADD CONSTRAINT delivery_logs_status_check
    CHECK (status IN ('Draft', 'Generated', 'Sent', 'Confirmed', 'Closed')),
  DROP CONSTRAINT IF EXISTS delivery_logs_version_type_check,
  ADD CONSTRAINT delivery_logs_version_type_check
    CHECK (
      version_type IS NULL
      OR version_type IN ('ProForma', 'FinalInvoice', 'PaidReleased')
    );

CREATE INDEX IF NOT EXISTS idx_delivery_logs_status
  ON delivery_logs(status);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_invoice
  ON delivery_logs(invoice_number);
