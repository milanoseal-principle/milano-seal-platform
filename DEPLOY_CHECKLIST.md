# The Milano Seal™ — Production Deploy Checklist

## 1. Supabase
- [ ] Run `scripts/001_create_deals_table.sql`
- [ ] Run `scripts/002_os_migration.sql`
- [ ] Verify deals table has all columns
- [ ] Enable Row Level Security → service role key has full access

## 2. Vercel — Required Environment Variables
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] NEXT_PUBLIC_SITE_URL=https://themilanoseal.com
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] ANTHROPIC_API_KEY

## 3. Stripe
- [ ] Create webhook endpoint: https://themilanoseal.com/api/webhook/stripe
- [ ] Listen for: checkout.session.completed
- [ ] Copy signing secret → STRIPE_WEBHOOK_SECRET

## 4. DNS (Namecheap)
- [ ] A record: @ → 76.76.21.21
- [ ] CNAME: www → cname.vercel-dns.com

## 5. API Routes (all live after deploy)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | /api/intake | Full OS pipeline — NLP + pricing + invoice + Stripe |
| GET | /api/deals | Dashboard deal feed |
| GET | /api/deals/:id | Deal detail |
| PATCH | /api/deals/:id | Status updates |
| POST | /api/deals/:id/payment | Manual payment confirmation |
| POST | /api/deals/:id/schedule | Payment-gated scheduling |
| POST | /api/deals/:id/execute | Payment-gated execution |
| POST | /api/deals/:id/apostille | Payment-gated apostille dispatch |
| POST | /api/webhook/stripe | Auto payment webhook |
| POST | /api/ai/generate | AI — DM Builder, Content, Intake classification |

## 6. Pages
| Route | Page |
|-------|------|
| / | Landing — full 7-section luxury homepage |
| /intake | 5-step luxury intake wizard |
| /intake/confirmation | Post-submit confirmation + payment options |
| /about | Company doctrine + trust architecture |
| /founder | Nicholas Milano authority positioning |
| /apostille/[country] | 50+ country SEO pages |
| /services/[service] | Service SEO pages |
| /documents/[doc]/[country] | Document × country pages |
| /dashboard | Operator command center |
| /operator/login | Operator auth |

## 7. Post-Deploy Validation
- [ ] / renders with real logo + founder photo
- [ ] /intake form submits → deal created in Supabase
- [ ] /intake response includes invoice + payment_link
- [ ] /dashboard loads deals from Supabase
- [ ] /api/deals/:id/schedule returns 402 without payment
- [ ] Stripe webhook test → deal flips to scheduled
- [ ] /about and /founder pages render
- [ ] /apostille/italy renders with full content
- [ ] AI route responds (check ANTHROPIC_API_KEY)

## 8. System Laws (Permanent)
1. Payment gate enforced at API level — 402 if unpaid
2. All pricing is server-side only
3. No payment handles ever shown publicly
4. Public site says only: "Additional payment methods available upon request."
5. Supabase is the single source of truth
6. Service role key never in browser code
