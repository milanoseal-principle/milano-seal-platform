# Real Device Production Acceptance

Automated checks protect the interface contract; they do not certify physical-device behavior or a live transaction.

For every critical route record: **Device · Browser · Timestamp · Matter ID · PASS/FAIL · Screenshot ID**.

Verify: route loads; no clipping or horizontal scroll; primary CTA works; disabled actions explain the blocker; loading and failure states are visible; success follows server confirmation; back navigation is safe; canonical Matter ID persists; displayed status matches the authoritative backend.

## Client test

Test the Matter Control Portal, Wise state, Controlled Records, RON readiness, Courier Release Tracking, and release. Use nonsensitive production-QA data and preserve one canonical Matter ID.

## Tiffany / Nicholas operator test

Test Matter search, RON / BlueNotary, apostille, courier, Operational Ledger, review queue, authority verification, SEO, and release. Never place real client PII in fixtures.

## Supabase Auth operator action

Supabase Dashboard → Authentication → Security / Password Security → **Enable leaked-password protection**. Record the timestamp and screenshot after the real project setting is confirmed; this document does not claim it is currently enabled.
