# The Milano Seal™ — Vercel Production Environment Variables

**Document Reference:** MS-OPS-ENV-2026-V2  
**Owner:** Platform Operator  
**Location:** Vercel Dashboard → Project → Settings → Environment Variables

Do not commit real values to the repository.
All values listed here are variable names only.

---

## Required for production launch

Set scope to **Production** for all required entries below.

```text
NEXT_PUBLIC_APP_URL=https://themilanoseal.com
NEXT_PUBLIC_SITE_URL=https://themilanoseal.com
NEXT_PUBLIC_ENVIRONMENT=production
LOG_LEVEL=info
PORTAL_SESSION_SECRET=
```

Generate `PORTAL_SESSION_SECRET` with:

```bash
openssl rand -hex 32
```

Never share, commit, or log the resulting value.

---

## Supabase — required

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-side only.

---

## Resend — required when production email is active

```text
RESEND_API_KEY=
RESEND_FROM=The Milano Seal™ <hello@themilanoseal.com>
```

---

## Wise Business — canonical production payment system

```text
WISE_ENV=production
WISE_API_TOKEN=
WISE_PROFILE_ID=
WISE_WEBHOOK_ALLOWED_TEST=false
PAYMENT_BASE_URL=https://themilanoseal.com
```

Canonical webhook:

```text
https://themilanoseal.com/api/webhooks/wise
```

Wise webhook verification uses RSA-SHA256 against the Wise production public key embedded in `lib/wise.ts`.

A shared Wise webhook secret is not the canonical production signature-verification mechanism.

`WISE_WEBHOOK_TEST_BYPASS` must remain **unset** in production.

---

## Operator access

```text
OPERATOR_EMAILS=
ADMIN_EMAILS=
```

Use comma-separated authorized addresses where the current runtime still consumes these allowlists.
Role authorization remains governed by the current authentication implementation.

---

## Twilio — required only when SMS/WhatsApp notification channels are active

```text
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
TWILIO_WHATSAPP_NUMBER=
ADMIN_WHATSAPP=
```

---

## Shipping — required when live carrier execution is active

```text
SHIPPO_API_KEY=
SHIPPO_WEBHOOK_SECRET=
SHIPPO_MODE=live
```

---

## BlueNotary — required when live RON integration is active

```text
BLUENOTARY_API_KEY=
BLUENOTARY_WEBHOOK_SECRET=
BLUENOTARY_MODE=
BLUENOTARY_BASE_URL=
BLUENOTARY_DEFAULT_NOTARY_EMAIL=
BLUENOTARY_FINAL_DOCUMENT_DELIVERY_MODE=
```

Follow `docs/BLUENOTARY_WEBHOOK_SETUP.md` for provider-specific configuration.

---

## AI / model overrides — optional unless a live route explicitly requires them

```text
ANTHROPIC_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_INTAKE_MODEL=
GROQ_INTAKE_MODEL=
OPENAI_CLASSIFIER_MODEL=
```

---

## Internal webhook / cron bus

```text
CRON_SECRET=
WEBHOOK_SECRET=
WEBHOOK_URL=https://themilanoseal.com/api/webhooks
```

Generate secrets with:

```bash
openssl rand -hex 32
```

---

## Founder production QA runner — optional

```text
PRODUCTION_TEST_SECRET=
```

When configured, it is used only by the guarded founder production-test path implemented in code.
It must never be exposed publicly.

---

## Production validation rules

Before production deployment confirm:

- no real secret is committed to Git;
- `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` use `https://themilanoseal.com`;
- `WISE_ENV` is exactly `production`;
- `WISE_WEBHOOK_ALLOWED_TEST` is exactly `false`;
- `WISE_WEBHOOK_TEST_BYPASS` is unset;
- service-role and provider secrets are not exposed through `NEXT_PUBLIC_*` variables;
- the canonical Wise webhook is `/api/webhooks/wise`;
- scheduling is not considered eligible until verified Wise reconciliation satisfies the canonical payment gate.

---

## Rotation policy

Rotate a secret immediately if it is exposed in source, logs, screenshots, chat, or unauthorized activity.

At minimum this applies to:

- `PORTAL_SESSION_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `WISE_API_TOKEN`
- `TWILIO_AUTH_TOKEN`
- `SHIPPO_API_KEY`
- `BLUENOTARY_API_KEY`
- `CRON_SECRET`
- `WEBHOOK_SECRET`
- `PRODUCTION_TEST_SECRET`

Rotating session/auth secrets may invalidate active sessions. Coordinate production rotation accordingly.
