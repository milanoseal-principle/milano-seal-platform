# The Milano Seal™ — Email Infrastructure Setup
**Document Reference:** MS-OPS-EMAIL-2026-V1  
**Owner:** Platform Operator  
**Architecture:**

| Address | System | Purpose |
|---|---|---|
| `nicholas@themilanoseal.com` | Zoho Mail | Human inbox — read, reply, send |
| `notifications@themilanoseal.com` | Resend | Automated website sender — intake, confirmations, alerts |

`ADMIN_EMAILS` and `OPERATOR_EMAILS` in Vercel point to `nicholas@themilanoseal.com`.

---

## Step 1 — Create Zoho Mail Account

Go to [zoho.com/mail](https://zoho.com/mail) and select **Business Email**.

When prompted, choose **Add existing domain** and enter:

```
themilanoseal.com
```

Create your first mailbox:

```
nicholas@themilanoseal.com
```

Do not close the Zoho setup wizard until Step 2 is complete.

---

## Step 2 — Verify Domain Ownership (TXT Record)

Zoho will display a verification TXT record. Use TXT (not CNAME) if both options are offered.

In Namecheap:

```
Domain List → themilanoseal.com → Manage → Advanced DNS → Add New Record
```

| Field | Value |
|---|---|
| Type | TXT Record |
| Host | `@` |
| Value | `zoho-verification=zb********.zmverify.zoho.com` (use exact value from Zoho) |
| TTL | Automatic |

Return to Zoho and click **Verify TXT Record**.

DNS propagation can take up to 2 hours. If Zoho does not verify immediately, wait and retry.

- [ ] TXT verification record added in Namecheap
- [ ] Zoho domain verification confirmed

---

## Step 3 — Add Zoho MX Records

In Namecheap Advanced DNS, remove any existing MX records for `@` first.

Then add all three:

| Type | Host | Value | Priority | TTL |
|---|---|---|---|---|
| MX Record | `@` | `mx.zoho.com` | 10 | Automatic |
| MX Record | `@` | `mx2.zoho.com` | 20 | Automatic |
| MX Record | `@` | `mx3.zoho.com` | 50 | Automatic |

> If your Zoho Admin Console shows different MX values (data center specific), use those instead of the generic values above. Check: **Zoho Admin Console → Domains → Email Delivery → MX Records**.

- [ ] Old MX records removed
- [ ] Three Zoho MX records added

---

## Step 4 — Add SPF Record

SPF must be a single TXT record. Do not create two `v=spf1` records — only one is allowed.

**Check first:** In Namecheap Advanced DNS, look for an existing TXT record starting with `v=spf1`.

**If no SPF exists**, add:

| Field | Value |
|---|---|
| Type | TXT Record |
| Host | `@` |
| Value | `v=spf1 include:zoho.com include:amazonses.com ~all` |
| TTL | Automatic |

**If an SPF record already exists**, edit it to include both `include:zoho.com` and the Resend include. Do not add a second `v=spf1` line.

> Confirm the exact Resend SPF include in your Resend Dashboard → Domains → SPF. If Resend specifies a different include than `amazonses.com`, use Resend's value.

- [ ] Single SPF record present with both Zoho and Resend includes

---

## Step 5 — Add Zoho DKIM

In Zoho Admin Console:

```
Admin Console → Domains → themilanoseal.com → Email Authentication → DKIM → Add Selector
```

Zoho will generate a TXT record. Add it in Namecheap:

| Field | Value |
|---|---|
| Type | TXT Record |
| Host | `zoho._domainkey` (or the exact selector Zoho provides) |
| Value | (paste the full DKIM value from Zoho) |
| TTL | Automatic |

- [ ] Zoho DKIM TXT record added in Namecheap
- [ ] DKIM verified in Zoho Admin Console

---

## Step 6 — Add DMARC Record

| Field | Value |
|---|---|
| Type | TXT Record |
| Host | `_dmarc` |
| Value | `v=DMARC1; p=none; rua=mailto:nicholas@themilanoseal.com` |
| TTL | Automatic |

`p=none` is the safe starting policy — it monitors without rejecting mail.  
After testing confirms clean delivery, harden to `p=quarantine` or `p=reject`.

- [ ] DMARC TXT record added

---

## Step 7 — Verify Zoho Inbox Is Receiving Mail

Go to [mail.zoho.com](https://mail.zoho.com) and log in as `nicholas@themilanoseal.com`.

Send a test email from a personal Gmail or iCloud address to `nicholas@themilanoseal.com`.

Confirm:

- [ ] Test email arrives in Zoho inbox
- [ ] Reply from Zoho sends successfully and arrives at the sender

---

## Step 8 — Set Vercel Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, set or update:

| Variable | Value |
|---|---|
| `ADMIN_EMAILS` | `nicholas@themilanoseal.com` |
| `OPERATOR_EMAILS` | `nicholas@themilanoseal.com` |
| `RESEND_FROM` | `The Milano Seal <notifications@themilanoseal.com>` |

Confirm `RESEND_API_KEY` is already present. Do not paste the API key value into chat or this document.

Trigger a Vercel redeploy after saving.

- [ ] `ADMIN_EMAILS` set
- [ ] `OPERATOR_EMAILS` set
- [ ] `RESEND_FROM` set to `notifications@` address
- [ ] Vercel redeployed

---

## Step 9 — End-to-End Intake Test

After DNS has propagated and Vercel is redeployed:

1. Submit a test intake at `https://themilanoseal.com/intake`
2. Check Supabase → `deals` table — confirm deal was created
3. Check Supabase → `notifications` table — confirm notification row was inserted
4. Check Zoho inbox at `nicholas@themilanoseal.com` — confirm intake alert arrived
5. Check the test email address used in the intake form — confirm client confirmation email arrived from `notifications@themilanoseal.com`

- [ ] Deal created in Supabase
- [ ] Notification row inserted
- [ ] Operator intake alert received at `nicholas@themilanoseal.com` (Zoho)
- [ ] Client confirmation email received from `notifications@themilanoseal.com` (Resend)

---

## DNS Record Summary

When complete, Namecheap Advanced DNS for `themilanoseal.com` should contain at minimum:

| Type | Host | Value / Purpose |
|---|---|---|
| TXT | `@` | `zoho-verification=...` — Zoho domain ownership |
| MX | `@` | `mx.zoho.com` priority 10 |
| MX | `@` | `mx2.zoho.com` priority 20 |
| MX | `@` | `mx3.zoho.com` priority 50 |
| TXT | `@` | `v=spf1 include:zoho.com include:amazonses.com ~all` |
| TXT | `zoho._domainkey` | Zoho DKIM value |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:nicholas@themilanoseal.com` |

Resend will also require its own DKIM record — check Resend Dashboard → Domains for the exact host and value to add.

---

## Operating Rule

```
Zoho Mail     → nicholas@themilanoseal.com  → human inbox, read/reply/send
Resend        → notifications@themilanoseal.com → automated intake/system emails
ADMIN_EMAILS  → nicholas@themilanoseal.com  → operator intake alerts
OPERATOR_EMAILS → nicholas@themilanoseal.com → dashboard and matter alerts
```

These two systems are independent. Zoho handles all human correspondence.  
Resend handles all automated transactional mail. Neither replaces the other.
