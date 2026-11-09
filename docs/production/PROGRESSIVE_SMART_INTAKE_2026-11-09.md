# Progressive Smart Intake and verified scheduling — implementation handoff

Starting main: `f18a49c2b515c6e1007b64c21736bfd256c92774`.
Branch: `codex/milano-progressive-smart-intake`.

This source implements the progressive service-router directive supplied twice on 2026-11-09. The later explicit founder clarification supersedes the previous submission-authorizes-scheduling behavior: **NO VERIFIED WISE PAYMENT → NO SCHEDULING**. No hosted deployment or database mutation is authorized by this implementation.

## Customer journey

The existing `PersonaRouting` now presents Online Notary/RON, Witness Support, Apostille, International Document Execution, In-person/Domestic Notary, Professional/Counsel and Not Sure. It remains the single service router, used immediately after the existing homepage hero and on Execution Options. Existing portal and alliance doors remain available. Existing contextual service-page CTAs carry the same intent to `/intake`; specialized authority pages use the existing commercial CTA helper. No new SEO pages, separate forms or parallel service backend were added.

The existing `CONCIERGE_SERVICE_INTENTS` vocabulary is reused: `ron`, **`witness`** (the only added vocabulary value), `apostille`, `international_execution`, `domestic_execution`, `foreign_counsel`, `unsure`. Existing `authentication` remains supported. Common aliases normalize in the existing commercial CTA helper. Unknown, repeated, non-string and prototype-property values safely become broad discovery. The same normalized values feed Get Pricing and Speak with Nicholas.

`getSmartIntakeQuestionPlan` is a visibility policy, not a legal or pricing decision engine. Domestic requests see document/upload, signer/location/witness context, timing/contact and review, without destination, issuing authority, translation, apostille or international courier sections. A foreign-use answer, known destination, relevant existing classification or country hint can expand visibility, without assigning those hints to execution truth. Existing text parsing is reused only to reveal document-use questions.

Apostille/authentication requests begin with document-use details and skip signer questions unless a new notarization is requested. International discovery retains document use, relevant authority/origin, signing context, delivery and review. Professionals get the shorter use/instructions/contact path with firm and country fields and the boundary: “You remain counsel. Milano handles the U.S. execution workflow.” Unknown requirements remain review items.

One wizard/form/draft is retained. Back/next and intent switching keep selected files in the active wizard. Existing tab-scoped, versioned, bounded 24-hour draft persistence keeps scalar context and the current detail. Restored drafts take precedence over stale intent query parameters; query intent is deliberately excluded from the draft binding. Different existing document/referral/courtesy context still uses the existing binding checks. File contents and consent are not serialized; after reload the customer must reattach files, as the UI states. There is no new browser document store.

Progress reflects the active detail plan. Sections have labels, focus management, live progress, keyboard-accessible controls, reduced-motion-safe progress and associated contact errors. The intake header uses a neutral review strip in place of the international corridor ticker; other routes retain the existing ticker. The premium shell is retained.

## Canonical backend and privacy

Public intake no longer imports the internal pricing engine or renders a calculated quote from private browser rules. The existing authenticated review/quote/server pricing architecture continues to issue private quotes after sufficient review. This intentionally removes the misleading public pro forma calculation; it does not invent instant prices or replace pricing.

The canonical `/api/intake` persists normalized customer service context using the existing private `internal_notes`/intake metadata. The existing operator handoff module captures bounded original instructions, witness wording, requested location, receiving authority, deadline, timing/delivery preferences and professional country. Firm remains in the existing company field. These are customer statements only. The server continues to use `provisionalExecutionTruth` for non-operators; service intent is never passed as confirmed route, legal eligibility, witness completion, tier, price or payment authority.

The existing Matter drawer displays **Client request** separately from **Confirmed execution route**. Only canonical operator review stamps allow the latter label; derived workflow suggestions do not become confirmed routes. The same drawer exposes bounded human-readable request context, while its API withholds raw internal notes. Existing lead conversions already retain service intent in their metadata; the projection supports that existing form too. No new schema/CRM is needed for intent.

Upload validation, private storage, MIME/magic checks, Matter association and existing capability authorization are unchanged. A confirmed Matter plus a failed upload enters same-Matter retry. An uncertain creation response now persists an unknown outcome and blocks another submission across refresh until an operator checks for an existing request. Browser storage failure after successful creation cannot turn that saved Matter into a failed submission. This is conservative client retry handling, not a claim that an arbitrary direct caller has gained a new server idempotency protocol.

## Pricing catalog audit

The existing engine remains `lib/pricing.ts`, with the existing canonical quote/review modules. No price values or formulas are added to public UI.

| Existing controlled component | Customer entry/context | Confirmation and price authority |
|---|---|---|
| Signature/Priority/Executive execution scope | Any service request | Operator review and existing private quote; intent cannot choose a canonical tier |
| Online execution/RON coordination | Online Notary | Existing eligibility/review and quote; external provider notarial charges stay excluded |
| Domestic/mobile/in-person execution | Domestic Notary | Requested location/date, reviewed availability and existing quote |
| Witness support | Witness Support or document wording | Existing P4B review determines need/count and approved coordination charges |
| Additional documents/signers, international signers | Document count, signer context, review | Existing quote builder and canonical pricing |
| Apostille, additional apostille documents, FBI coordination | Apostille/Authentication/International | Issuing/destination/document review before existing authority-specific quote |
| Multi-jurisdiction and executive state handling | International/professional context | Existing governed review and quote builder |
| Timeline premium/priority/urgency | Preferred timing and deadline | Existing quote rules; no availability or completion guarantee |
| Domestic/international dispatch/courier | Existing delivery preference | Existing quote and courier authority; no label purchase from intake |
| Manual adjustment, institutional/government/professional scope | Professional or broad reviewed request; existing institutional pages | Existing privileged quote approval; no public manual adjustment control |

P6 remains unchanged: provider-controlled notarial fees are absent from Milano subtotal, quote, invoice, Wise amount, discount, revenue and receipt. Existing provider-fee validators/tests remain required. No new pricing table, public calculator or checkout was added.

## Analytics and attribution

The existing intake UX event pipeline now records `service_intent_selected` and adds normalized service intent to subsequent wizard events. Free-text instructions, witness text and documents are excluded from analytics metadata. Existing source/referral capture remains in place; this change does not reset attribution.

| Requested observation | Existing canonical evidence reused |
|---|---|
| Selection/start/upload/completion | Existing intake analytics and Matter-bound upload/submission events, now segmented by service context |
| Pricing request/lead persisted | Existing pricing-request/lead pipeline with the same `product_interest` vocabulary |
| Matter created/quote/payment/scheduling/execution/close | Existing canonical Matter/state/evidence/payment records joined by Matter ID to retained service context |
| Repeat Matter | Existing client/Matter relationship and intelligence; no fabricated repeat count or new client matcher |

These are source lineage and event integration, not proof of hosted event ingestion or real conversions. No client event can declare verified payment, scheduling or execution. No second event store or analytics system was introduced.

## Founder-confirmed payment rule

Sequence: **Private Quote → Wise Submission → Settlement Verification → Payment Verified → Scheduling Unlocked**.

`evaluateSchedulingGate` delegates to the existing exact cleared-payment gate. Submission timestamps, matched amount/currency/reference snapshots, provider IN_PROGRESS evidence, complimentary authority, stale flags, partial/overpayment, nonfinite values and operational blockers cannot unlock it. `evaluateExecutionGate` uses the same settlement prerequisite. RON operational/document readiness remains independently required.

Forward migration `20261109063000_verified_settlement_scheduling.sql` replaces the canonical SQL transition/payment/execution predicates. It removes the awaiting-payment → scheduled structural shortcut and requires exact cleared/confirmed payment before scheduling or execution. Existing attempt binding, invalidation, immutable evidence, official recovery and final-release safeguards are retained. Financial failure/refund updates remain recordable without rewriting historical stages. Current RON projections recheck authority, so cached link flags cannot substitute for current settlement. No existing customer stage was bulk rewritten and no provider session was canceled.

Customer/operator payment, RON, invoice, notification and status copy now distinguishes submission from verification and keeps scheduling locked during processing. Former regression expectations that intentionally allowed submission-only scheduling have been replaced under the founder's explicit instruction, with runtime deny/allow and actual SQL checks. Historical entry-point names are retained so release wiring still runs them. Scope guards permit only the exact authorized paths; they remain active.

## Requirement traceability

| Directive sections | Integration |
|---|---|
| 1–4, 12–14, 18–20 | Existing router/CTA vocabulary + one wizard + central visibility policy + draft binding |
| 5–11 | RON, witness, domestic, apostille, international, professional and broad-discovery plans |
| 15–16, 25 | Existing server pricing/catalog, private reviewed quotes, unchanged provider-fee boundary |
| 17, 23–24 | Existing lead fallback/private upload/canonical Matter persistence; safe navigation/retry |
| 21–22, 29–30 | Plain relevant sections, active progress, labels/focus/errors, six-width browser checks |
| 26, 33 | Shared JS/SQL settlement-only scheduling/execution gates, existing policy/RON/custody authorization |
| 27–28 | Existing analytics/attribution lineage and separate operator requested/confirmed projections |
| 31, 34–35 | Existing contextual service routes; no thin pages, duplicate engines, calculators or automatic legal conclusions |
| 32, 36–38 | New behavioral/browser coverage plus complete committed-tree release gate and PR handoff |

## Validation and release boundary

Focused source checks, runtime unit tests and local PostgreSQL suites are in `tests/progressive-smart-intake.test.ts`, `scripts/test-progressive-intake-rendered.mjs`, the strengthened Wise-attempt SQL suite and existing gap/release/security suites. Browser transports are intercepted synthetic fixtures. The browser suite tests 320, 390, 430, 768, 1280 and 1440 widths, current entry links, conditional domestic fields, international expansion, short professional route, active progress, contact validation/focus, retained uploads, same-Matter upload retry, stale-query draft precedence and unknown-outcome no retry across reload.

Final committed-tree aggregate results will be recorded alongside this document after the full run. No live customer, real provider, commercial code or production action is part of local proof.

Production remains subject to the previously identified app/schema mismatch and hosted migration provenance reconciliation. PR #458 separately contains retention/operational hardening and a production schema preflight; this intake branch started from actual main. While work was running, #458 was externally merged as `f635c985`; that main was then merged into this branch before final validation. The combined tree includes its retention, operational and schema-preflight protections. Do not assume all hosted prerequisites are present because the app is READY. Review and explicitly authorize a schema-aware rollout before releasing dependent source. Existing hosted Actions jobs were blocked before startup by account billing/spending limits; no local result substitutes for those checks.

No production deployment, hosted migration, real Wise payment, scheduling/provider execution, RON session, courier purchase, filing, customer contact or agent activation was performed.
