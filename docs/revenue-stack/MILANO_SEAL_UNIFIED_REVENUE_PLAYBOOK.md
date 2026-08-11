# Milano Seal — Unified Revenue Stack (Foundation)

Ten connected revenue channels on one architecture. Every channel reuses canonical
Matter/Organization/Contact/Pricing/Revenue and existing verticals — no duplicate
engines.

## Channels (`lib/revenue-stack/channelRegistry.ts`)
1. Consumer International · 2. Law Firms & Attorneys · 3. Corporate International ·
4. Government Procurement (reuses `lib/procurement`) · 5. Maritime & Logistics
(reuses maritime + high-value-assets) · 6. Universities & Education · 7. Healthcare ·
8. Enterprise Retainers · 9. Strategic Referral (reuses `lib/referrals`) ·
10. Executive Concierge (reuses high-value-assets private client).

## Revenue integrity
- **Actual revenue = verified `payment_confirmed` only** (`revenueOpportunity.realPaidRevenue`, `revenueSafety.actualRevenue`). Quotes are never paid revenue.
- Planning scenarios are always labelled *"Internal planning scenario · Not actual revenue · Not guaranteed."*
- Sample records excluded from real KPIs. Internal margins never public.

## Surface
`UnifiedRevenueCommandCenter` wired **additively** into the existing
`/dashboard/revenue` page (the live Supabase deal pipeline is untouched).

## Follow-ups (noted, not in this foundation)
Per-channel public service pages, outreach playbooks (10), 30-day revenue plan,
account/retainer/expansion engines deep-wiring, Founder Command revenue actions.

## Safety
No fake revenue/clients/contracts/retainers. No guaranteed acceptance/savings, no
government endorsement, no public internal margins. Wise, payment confirmation,
scheduling/release gates, custody, Supabase RLS/auth, Shippo, BlueNotary untouched.
