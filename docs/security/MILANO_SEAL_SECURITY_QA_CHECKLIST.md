# Milano Seal — Security QA Checklist

Run before every production deploy and after any change to portal, dashboard, or API routes.

## Portal Projection

- [ ] Portal API response passes `projectMatterForClient()` before returning
- [ ] `findForbiddenClientFields()` returns empty array for all portal responses
- [ ] `operator_notes`, `internal_notes`, `margin`, `raw_webhook`, `label_url` not present in portal bundle
- [ ] `discount_reason`, `internal_reason`, `operator_summary` not rendered client-side

## Access Control

- [ ] `assertClientOwnsMatter()` enforced on every `/api/portal/*` route
- [ ] `assertFounderAdmin()` enforced on every founder-only action
- [ ] `assertVAAllowed()` enforced on all VA-accessible routes
- [ ] Role read from `user.app_metadata.role` or `user.user_metadata.role` — never from request body
- [ ] VA cannot confirm payment
- [ ] VA cannot release final documents
- [ ] VA cannot view operator notes or margin

## Payment Gate

- [ ] `evaluatePaymentIntegrity()` called before scheduling unlock
- [ ] Scheduling blocked when `payment_confirmed = false`
- [ ] Execution blocked when `payment_confirmed = false`
- [ ] Wise link hidden for `is_platform_fee_only = true` matters
- [ ] `PAYMENT_CONFIRMED_MANUAL` only writable by `founder_admin`
- [ ] Duplicate payment confirmation is idempotent (no duplicate ledger events)

## Final Release Gate

- [ ] `evaluateReleaseGate()` called before any apostille/international release
- [ ] Italian matters require codice fiscale lock (`requiresCodiceFiscaleLock()` = true)
- [ ] `validateIdentifierExactMatch()` runs before release on any matter with identifiers
- [ ] Final PDF lock check present in Final Seal Review checklist
- [ ] Founder approval check present in Final Seal Review checklist
- [ ] Release blocked when any critical check is `needs_review` or `blocked`

## Atlas / Public API

- [ ] `/api/atlas/*` returns client-safe fields only
- [ ] `operatorSummary` never rendered in public map or portal
- [ ] Country registry `getClientSafeCountrySummaryBySlug()` used for portal display
- [ ] `getOperatorAtlasSignals()` used for dashboard only

## Application Security

- [ ] `safeText()` used for all free-text intake display
- [ ] `safeSlug()` used for all URL param processing
- [ ] `safeDestinationParam()` used before any country/destination param is trusted
- [ ] No `dangerouslySetInnerHTML` with user-provided text
- [ ] No `eval()` or `Function()` calls in application code

## Infrastructure

- [ ] `SUPABASE_SERVICE_ROLE_KEY` not in any `NEXT_PUBLIC_*` env var
- [ ] `SUPABASE_SERVICE_ROLE_KEY` not in any client-side component
- [ ] No secrets committed to git (run `rg "service_role" app components lib`)
- [ ] No AI-generated test files or mock data in production
- [ ] No screenshots or reference images committed to production repo

## Verify Route

- [ ] `/verify` route exposes no private matter data
- [ ] Verify lookup does not expose client PII beyond what is safe for public confirmation

## Security Scan Commands

```bash
# Forbidden fields in client/public code
rg -n "service_role|SUPABASE_SERVICE_ROLE|raw_webhook|raw_payload|operator_notes|internal_notes|discount_reason|margin|net_margin|shipping_cost|label_url|operatorSummary|internal_reason" app components lib

# Dangerous patterns
rg -n "dangerouslySetInnerHTML|eval\(|Function\(|document\.cookie" app components lib
```

Expected: zero results in public/client/portal surfaces.
Allowed: server-only route files, migration SQL, comments documenting forbidden fields, operator-only dashboard components.
