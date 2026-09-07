# Wise Exception Schema Drift Hotfix

Production schema verification confirmed `public.deals` does not contain `is_platform_fee_only`.

The Wise reconciliation exception scanner must project only columns present in the canonical production `deals` table.

This hotfix removes the stale `is_platform_fee_only` field from the scanner type and Supabase select list. It does not change payment, scheduling, RON, apostille, custody, or release authority.
