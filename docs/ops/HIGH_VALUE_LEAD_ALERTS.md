# Real-Time Concierge Webhooks — High-Value Lead Alerts

**Module:** Concierge Lead Alert Engine  
**Status:** Spec ready — wire after DB health passes  
**File target:** `lib/alerts/highValueLead.ts`

---

## Purpose

High-value intent deserves immediate orchestration. The Concierge Trigger acts as a silent sentry, alerting the Operator the moment a priority lead enters the pipeline. No cold lead. No latency. Immediate engagement is the Milano Seal standard.

---

## Trigger Conditions

Any intake that meets one or more of the following:

| Condition | Signal |
|---|---|
| `apostille_required = true` | International legal execution |
| `urgency = urgent` | Rush request |
| Destination in: Italy, Greece, Spain, Portugal, UAE, France, Switzerland | Premium international market |
| Attorney / family office / estate / real estate / medical / corporate keywords | High-value client profile |
| `signer_count > 1` | Complex matter |
| `document_count > 1` | Multi-document package |
| Executive Lane likely | Highest revenue lane |
| Document type: POA, estate, medical, corporate, immigration, adoption | High-stakes use case |

---

## Notification Channels

1. **SMS via Twilio** — primary, immediate
2. **Slack webhook** — optional, operator-configured
3. **Email** — optional fallback

---

## Message Template

```
New high-value Milano Seal matter received.

Client: {client_name}
Destination: {destination_country}
Document: {document_type}
Estimated lane: {estimated_lane}
Urgency: {urgency}
Conversion score: {conversion_score}

Open dashboard:
{dashboard_url}
```

---

## Implementation

```typescript
// lib/alerts/highValueLead.ts

export function isHighValueLead(intake: {
  destination_country?: string;
  apostille_required?: boolean;
  urgency?: string;
  signers?: number;
  docs_count?: number;
  document_type?: string;
  priority_tier?: string;
}): boolean

export async function sendHighValueAlert(intake: {
  deal_id: string;
  client_name: string;
  destination_country: string;
  document_type: string;
  estimated_lane: string;
  urgency: string;
  conversion_score: number;
}): Promise<void>
```

Integrated in `app/api/intake/route.ts` after successful insert.  
Non-blocking — alert failure never prevents matter creation.

---

## Required Env Vars

```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
FOUNDER_ALERT_SMS_TO
SLACK_WEBHOOK_URL    (optional)
```

---

## Security Rules

- Never include client passport, SSN, payment data in alert
- Never send `internal_notes` or `discount_note` in alert
- Alert fires only after deal is successfully saved to DB
- Log `HIGH_VALUE_LEAD_CREATED` event to `activity_logs`
