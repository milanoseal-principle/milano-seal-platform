# Wise Reconciliation Exception Orchestrator

## Operating rule

A governed Wise submission may satisfy scheduling authority immediately while Wise settlement continues separately.

## Automated primary path

1. Client submits Wise payment.
2. Milano records governed payment observation.
3. Scheduling authority evaluates immediately.
4. BlueNotary readiness may continue if non-payment execution facts are complete.
5. Wise reconciliation runs every minute.
6. Verified Wise settlement alone can author paid truth.

## Automated exception path

If an observed submission remains unresolved beyond the configured exception threshold:

- `provider_correlation_missing` → ACTION REQUIRED
- `settlement_pending_with_provider_evidence` → WATCH
- `payment_mismatch_review` → ACTION REQUIRED

The exception is persisted in `wise_reconciliation_exceptions` and refreshed by the same minute reconciliation cron.

## Recovery command

Operator surface:

`/dashboard/payments/reconciliation`

Exact official Wise provider evidence can be submitted through the authenticated operator recovery endpoint. The endpoint delegates to `confirm_wise_payment_from_provider_notification(...)`, which in turn delegates paid-state mutation to the canonical `confirm_wise_payment_for_deal(...)` authority.

## Hard safety boundary

The system never auto-confirms a payment from amount, currency, timing, client assertion, or a unique-looking transaction alone. Ambiguous or missing provider correlation remains an exception requiring exact official Wise evidence.

Final settlement-dependent release remains locked until canonical paid truth exists.

## Build gate

The orchestration projection is type-aligned with the canonical scheduling gate and must pass the full Vercel merge gate before merge.
