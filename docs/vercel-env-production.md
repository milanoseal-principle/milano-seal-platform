# The Milano Seal™ — Vercel Production Environment Variables
**Document Reference:** MS-OPS-ENV-2026-V1  
**Owner:** Platform Operator  
**Location:** Vercel Dashboard → Project → Settings → Environment Variables

Do not commit real values to the repository.  
All values listed here are variable names only.

---

## Required for P0 Launch

Set scope to **Production** for all entries below.  
Also set to **Preview** if the portal auth flow is tested in preview deployments.

```
PORTAL_SESSION_SECRET=
```
Generate with:
```bash
openssl rand -hex 32
```
Paste the output as the value. This must be a 64-character hex string.  
Never share this value. Never commit this value. Never log this value.

```
NEXT_PUBLIC_APP_URL=https://themilanoseal.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_VERSION=1.0.0
LOG_LEVEL=info
```

---

## Supabase (required — must already exist)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Find these in: Supabase Dashboard → Project Settings → API

---

## Resend (required — must already exist)

```
RESEND_API_KEY=
RESEND_FROM=
```

`RESEND_FROM` format: `The Milano Seal™ <hello@themilanoseal.com>`

---

## Wise Payment (required if payment flows are live)

```
WISE_API_TOKEN=
WISE_PROFILE_ID=
PAYMENT_BASE_URL=https://themilanoseal.com
WISE_WEBHOOK_SECRET=
```

---

## Twilio SMS/WhatsApp (required if SMS notifications are active)

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_WHATSAPP_NUMBER=
ADMIN_WHATSAPP=
```

---

## Shipping (required when live carrier is configured — P1)

```
SHIPPO_API_KEY=
SHIPPO_WEBHOOK_SECRET=
```

Not required for P0 launch. The shipping route returns 501 until this is configured.

---

## AI / Model Overrides (optional — defaults apply if unset)

```
ANTHROPIC_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_INTAKE_MODEL=
GROQ_INTAKE_MODEL=
OPENAI_CLASSIFIER_MODEL=
```

---

## Operator Access (required)

```
OPERATOR_EMAILS=
ADMIN_EMAILS=
```

Comma-separated list of authorized email addresses.  
Example: `nick@themilanoseal.com,operator@themilanoseal.com`

---

## Internal Webhook Bus (optional)

```
CRON_SECRET=
WEBHOOK_SECRET=
WEBHOOK_URL=https://themilanoseal.com/api/webhooks
```

Generate `CRON_SECRET` and `WEBHOOK_SECRET` with `openssl rand -hex 32`.

---

## Validation Rules

Before saving any variable in Vercel, confirm:

- No value contains `xxx`, `example.com`, `generate-a-`, or other placeholder text
- `PORTAL_SESSION_SECRET` is exactly 64 hexadecimal characters
- `NEXT_PUBLIC_APP_URL` does not end with a trailing slash
- `NEXT_PUBLIC_ENVIRONMENT` is exactly `production` (lowercase)
- `RESEND_FROM` is a valid RFC 5322 formatted address string

---

## Rotation Policy

| Variable | Rotate when |
|---|---|
| `PORTAL_SESSION_SECRET` | If exposed in logs, code, or chat |
| `SUPABASE_SERVICE_ROLE_KEY` | If exposed or if project access is compromised |
| `RESEND_API_KEY` | If Resend dashboard shows unauthorized sends |
| `WISE_API_TOKEN` | If any unauthorized payment activity detected |
| `CRON_SECRET` / `WEBHOOK_SECRET` | If exposed in any public surface |

Rotating `PORTAL_SESSION_SECRET` invalidates all active portal sessions immediately.  
Notify active clients before rotating in production.
