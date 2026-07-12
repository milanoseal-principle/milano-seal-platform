# Milano Seal — Maritime & Global Logistics Execution (Foundation)

Time-sensitive U.S. document execution for maritime, customs, shipping, freight-
forwarding, port, and international trade operations. The notarial act is one
step; the value is coordination of the full execution pathway.

## What this foundation adds (reuse-first)

- **`lib/maritime/types.ts`** — maritime overlay that references the **canonical
  Matter** by id (not a second matter object).
- **`maritimeSafety.ts`** — banned-claim guard (no customs/port/CBP/Coast
  Guard/TSA approval; no guaranteed clearance/sailing), safety notice, deadline
  framing (requested / operational / third-party — never guaranteed).
- **`urgency/maritimeUrgency.ts`** — deadline/urgency engine that honors
  **payment-before-scheduling** and forces manual review on uncertain receiving
  authority.
- **`documents/maritimeDocumentRegistry.ts`** — maritime + high-value-asset
  document families (USCG bill of sale, preferred ship mortgage, certificate of
  incumbency, foreign-registry packet, …), all review-dependent.
- **`pricing/maritimePricingAdapter.ts`** — delegates to the **canonical pricing
  gateway** (`quoteNonConsumer`); operator-prepared, margins internal, no new
  calculator.
- **`accounts/commercialAccount.ts`** — recurring commercial account model;
  active status requires real paid evidence (honest empty state until then).
- **`operatorActions.ts`** — maritime actions in the shared shape + dedup.
- **`lib/trust-chain/maritimeTrustEvents.ts`** — additive maritime Trust Chain
  event types (chain-of-custody **visibility**, not a legal guarantee).
- Dashboard: **Maritime Command Center** at `/dashboard/maritime` (honest empty
  states, responsive). Public: `/services/maritime-global-logistics-document-execution`
  and `/ports/port-tampa-bay-document-execution`.

## Follow-up increments (noted, not in this foundation)

Additional port landing pages (PortMiami, Port Everglades, JAXPORT, Savannah,
Houston, New Orleans), maritime CRM / lead scoring, partner-target engine, SEO
registry, outreach scripts, 30-day go-live plan, and the High-Value Asset
intelligence expansion (aviation / exotic auto / energy / private-client) that
extends this vertical.

## Safety

Coordination and administrative support only. No customs-clearance, shipment-
release, port, carrier, CBP, Coast Guard, or TSA authority claimed. No guaranteed
deadlines or acceptance. Wise, payment confirmation, scheduling/release gates,
custody ledger, Supabase RLS/auth, Shippo, and BlueNotary are untouched.
