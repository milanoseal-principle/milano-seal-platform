# Milano Seal — Third-Party Control Register

| Vendor | Purpose | Data Touched | Risk Level | Client-Facing Exposure | Fallback | Owner |
|--------|---------|--------------|-----------|----------------------|---------|-------|
| **Supabase** | Database, auth, storage, RLS | All matter data, client PII, payment status, documents | Critical | Portal auth, matter data via safe projection | Manual CSV export, contact support | Founder |
| **Vercel** | Hosting, edge functions, deployments | Built application code, env vars, request logs | High | All public routes | Rollback to previous deployment | Founder |
| **Wise** | International payment processing | Payment amount, reference, webhook payload | High | Payment status only (never raw webhook) | Manual founder payment confirmation | Founder |
| **BlueNotary** | Remote Online Notarization (RON) | Signing session, signer identity, document | High | Signing room link (expires after session) | Mobile notary alternative | Founder |
| **Shippo** | Courier label generation, tracking | Shipping address, label_url, actual cost | Medium | Tracking number only (never label_url, never cost) | Manual courier + delivery log entry | Founder |
| **Twilio** | SMS notifications (if active) | Client phone number, notification text | Medium | Notification content only | Email notification fallback | Founder |
| **Email provider** | Client/operator email | Client email, matter status, release notifications | Medium | Client-safe content only | Manual email via founder | Founder |
| **Anthropic / Claude** | AI intake parsing, pathway suggestions | Intake form text (no PII required) | Low | Advisory text only — not compliance decisions | Disable AI assist, manual intake | Founder |

## Control Rules

- **No vendor receives**: service role key, internal operator notes, margin data, raw payment webhook beyond what is required for the integration.
- **Wise**: raw webhook payload stored in Supabase only, never sent to portal. `wise_payload` is in CLIENT_FORBIDDEN_FIELDS.
- **Shippo**: `label_url` and `actual_shippo_cost` are in CLIENT_FORBIDDEN_FIELDS. Client sees tracking number only.
- **BlueNotary**: `signing_url`, `full_signing_url`, `bn_signing_url` are in CLIENT_FORBIDDEN_FIELDS. Link expires after session.
- **Anthropic/Claude**: AI output is advisory only. AI cannot confirm compliance, alter identifiers, or release documents.
- **Supabase service role key**: server-only. Never in client bundle. Never in environment variables prefixed `NEXT_PUBLIC_`.

## Periodic Review

Review this register when:
- Adding a new vendor integration
- Changing what data a vendor receives
- A vendor has a reported security incident
- Annual review (minimum)
