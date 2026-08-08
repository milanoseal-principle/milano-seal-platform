# Verify Migration 044 (Production, read-only)

After applying `044_production_deals_payment_gate_compatibility.sql`, run these
SAFE, read-only queries. Do NOT modify existing deals to populate new fields —
additive defaults are acceptable only as created by the schema operation.

```sql
-- Baseline unchanged (expected: 19)
SELECT COUNT(*) AS total_deals FROM public.deals;

-- Complimentary authorizations (record actual)
SELECT COUNT(*) AS complimentary_authorization_count
FROM public.complimentary_authorizations;

-- Disposition distribution (defaults acceptable; do not backfill manually)
SELECT payment_disposition, COUNT(*)
FROM public.deals
GROUP BY payment_disposition
ORDER BY payment_disposition;

-- Confirm the status-based triggers exist
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.deals'::regclass
  AND tgname IN ('enforce_payment_gate_on_status_insert','enforce_payment_gate_on_status_update');
```

Expected:
- `total_deals` = 19 (unchanged)
- both `enforce_payment_gate_on_status_*` triggers present
- `currency` column present (nullable)
- no existing row rewritten
