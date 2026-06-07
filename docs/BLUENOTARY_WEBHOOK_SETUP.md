# BlueNotary Webhook Setup

## Webhook URL

```
https://www.themilanoseal.com/api/webhooks/bluenotary
```

## Auth Method

Bearer token. BlueNotary must send the following header on every webhook delivery:

```
Authorization: Bearer <BLUENOTARY_WEBHOOK_SECRET>
```

## Required Environment Variables

Set these in Vercel → Settings → Environment Variables (Production + Preview):

| Variable | Description |
|---|---|
| `BLUENOTARY_API_KEY` | API key from BlueNotary dashboard |
| `BLUENOTARY_WEBHOOK_SECRET` | Shared secret for Bearer auth on incoming webhooks |
| `BLUENOTARY_MODE` | `test` until smoke tests pass, then `production` |
| `BLUENOTARY_BASE_URL` | `https://app.bluenotary.us/api/integrationsv2` |
| `BLUENOTARY_DEFAULT_NOTARY_EMAIL` | Email of the assigned notary |

## Registration Steps

1. Log in to the BlueNotary operator dashboard
2. Navigate to Integrations → Webhooks
3. Add a new webhook endpoint:
   - URL: `https://www.themilanoseal.com/api/webhooks/bluenotary`
   - Auth: Bearer token
   - Token: value of `BLUENOTARY_WEBHOOK_SECRET`
4. Enable all event types (the handler maps all known events)
5. Send a test ping — expect `{"ok":true}` response

## Security Behavior

| Condition | HTTP Response |
|---|---|
| `BLUENOTARY_WEBHOOK_SECRET` not set in env | 500 Server Configuration Error |
| Wrong or missing `Authorization` header | 401 Unauthorized |
| Valid Bearer token | Proceed to processing |

The token is never logged, never returned in responses, and never included in error messages.

## Event Mapping

| BlueNotary Event | Milano RON Status |
|---|---|
| `session_started` | `RON_SESSION_ACTIVE` |
| `session_completed` | `RON_COMPLETED` → auto-retrieves docs → `SIGNED_DOCS_RETRIEVED` |
| `session_expired` | `RON_EXPIRED` |
| `photo_id_passed` | (signer identity update) |
| `photo_id_failed` | (signer identity update) |
| `kba_succeeded` | (signer KBA update) |
| `kba_failed` | (signer KBA update) |
| `biometrics_passed` | (signer biometric update) |

## Post-session_completed Behavior

On `session_completed`:
1. Signed documents are auto-retrieved from BlueNotary API
2. Stored in private Supabase storage bucket (`documents/ron/{matter_id}/{session_id}/`)
3. Status advances to `SIGNED_DOCS_RETRIEVED`
4. Audit event logged: next action = Apostille QA Review
5. **Signing URL is NOT released** — operator must explicitly approve
6. **Deal does NOT advance to courier** — operator must explicitly advance

## Smoke Test

See `docs/qa/BLUENOTARY_RON_SMOKE_TEST.md` for the full 17-case test matrix.
