# Concierge P0 release repair

Starting main: `63a98474b735c29bc89b6a9e1cdfa5aade3158cc` (#426).

The concierge retry error and receipt used passive focus effects. The error could be visible before its focus effect executed. Both transitions now use layout effects so focus is established before paint. Field values and the stable retry request ID remain intact; successful persistence still controls receipt.

Rendered acceptance now targets `#concierge-form-error[role=alert]`, avoiding Next.js's separate route-announcer alert. It checks two explicit synthetic 503 failures followed by a synthetic persisted receipt, verifies repeated error focus, retained fields, stable retry ID, attribution and receipt focus. All ten requested widths are included. The 503 exception applies only to that mock window and endpoint. Unrelated HTTP, console, page and request failures are fatal. Only positively identified, intentionally cancelled Next RSC prefetches are excluded from transport failures. Local Vercel analytics is supplied by a labeled no-op fixture; deployed analytics is not bypassed.

The attempted main deployment `dpl_56DRY7mMbFjtqgb7fuTodzKKv1jC` failed before Next build: the global-corridor validator required the old Framer Motion hook name. After that check, the Trust Core validator had the same stale assumption. Both now verify imported/invoked supported hooks; the shared hook must retain its media-query subscription and stable SSR snapshot. Regression tests reject missing invocation, incorrect import, unstable server snapshot and missing preference subscription. No motion accessibility check was removed.

Initial deployment provenance read through Vercel:

- Attempted main SHA `63a9847`: ERROR, merge gate exit 36, global-corridor motion contract.
- Production alias `www.themilanoseal.com`: READY deployment `dpl_2GrsvjMTYEucNmnajttV52PchYB4`, SHA `80eea3f2db3ddc896aca5a8551fcf672999f3057`.
- #426 final PR head standard CI passed, rendered acceptance failed. Its preview was CANCELED by ignored-build configuration; GitHub's Vercel status alone was not deployment evidence.

This is a bounded P0 correction. Get Pricing and subsequent completion work remain dependent on green required CI and an exact-SHA READY production deployment. No schema migration or production data write is required by this correction. Local rendered success uses declared synthetic concierge responses and does not prove hosted inquiry persistence or email delivery. Final checks and deployment provenance must be recorded after the exact release commit is known.
