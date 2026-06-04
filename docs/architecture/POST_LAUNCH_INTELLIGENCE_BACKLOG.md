# Post-Launch Intelligence Backlog

**Status: ARCHIVED / BUILD ONLY AFTER PRODUCTION PROOF**

## Implementation Gate

Do not build any item below until all of the following are confirmed:

- [ ] Production deploy green on Vercel
- [ ] All 20 migrations applied and verified in Supabase
- [ ] Wise webhook tested live
- [ ] Shippo webhook tested live
- [ ] BlueNotary webhook tested live (if active)
- [ ] First paid matter completed end-to-end

---

## 1. Execution Readiness Engine

Returns one readiness verdict before any matter advances: `READY`, `BLOCKED`, `REVIEW_REQUIRED`, `MISSING_INFO`, `ESCALATE_TO_NICHOLAS`.

Checks: payment confirmed, signer info complete, document uploaded, destination country, receiving authority known, RON eligibility, apostille route, courier address, release rules.

**Priority: P0 post-launch**

---

## 2. Receiving Authority Database

Tracks Comune, consulate, embassy, court, university, bank, registry, immigration office, corporate registry, foreign counsel office. Fields: accepted documents, language rules, apostille required, legalization required, translation required, document age limits, RON accepted, rejection triggers, last successful matter, source confidence, last verified date.

**Priority: P0 post-launch — highest moat value**

---

## 3. Matter Failure Prevention Engine

Converts every past failure (missing codice fiscale, apostille mismatch, Wise error, courier exception, rejected document, missing translation, wrong certificate, incomplete signer info) into a future blocker pattern check.

Output: "Stop. This matter matches a previous failure pattern."

**Priority: P1 post-launch**

---

## 4. Certificate Selection Engine

Operator selects state + act + destination + document type → system recommends correct notarial certificate template. Includes: Florida RON jurat, Florida physical jurat, Florida acknowledgment, representative acknowledgment, oath/affirmation script, copy certification rules, state-specific restrictions.

Rule: System suggests. Operator approves.

**Priority: P1 post-launch**

---

## 5. Private Client / HNWI Matter Room

Premium portal mode for high-value clients: concierge matter header, private client timeline, document custody summary, release readiness, coordinator card, premium intake summary. For yacht sales, luxury property POA, citizenship files, estate docs, family office records, gem/luxury asset affidavits.

**Priority: P2 post-launch**

---

## 6. Partner Tool Belt Certification

Gated alliance partner onboarding: identity, service scope, document handling, client communication, referral routing, security attestation, compliance acknowledgement. Status: `Routing Locked` → `Routing Eligible` → `Active Partner`.

**Priority: P2 post-launch**

---

## 7. Document Packet Builder

Operator selects matter type → system builds required packet checklist. Examples: Italy Citizenship Packet, FBI Background Check Apostille, Florida RON Affidavit to Italy, UAE Corporate Legalization, Mexico POA, Yacht Sale Document Packet, Estate/Probate Foreign Use Packet.

Output: required documents, signer requirements, certificate requirements, apostille/authentication path, translation flag, courier packaging rule, release checklist.

**Priority: P1 post-launch**

---

## 8. Release Certificate + Verify Page

Every completed matter gets a public-safe verification record at `/verify/[hash]`. Shows: valid/revoked/expired, verification hash, release date, document count if safe, custody certificate status. Never shows: client documents, internal notes, label URLs, costs, raw events.

Note: `/verify/[verificationId]` route already exists — this is the data layer and certificate generation behind it.

**Priority: P1 post-launch**

---

## 9. Operator Exception Center

One page for everything stuck: payment mismatch, partial payment, missing document, address review, RON failure, KBA failure, courier exception, delivered-not-released, authority review, translation required, client response overdue.

**Priority: P0 post-launch**

---

## 10. Revenue Close Desk

Tracks: new intake, quote needed, invoice sent, payment pending, follow-up due, closed won, closed lost, referral source, expected revenue, next action.

**Priority: P1 post-launch**

---

## 11. Atlas Source Governance (Extended)

Beyond the data governance schema already documented: build the admin UI for marking sources verified, flagging stale entries, and triggering manual review workflows.

Confidence levels: `VERIFIED_OFFICIAL`, `VERIFIED_OPERATOR`, `PARTNER_CONFIRMED`, `CLIENT_PROVIDED`, `UNVERIFIED_REVIEW_REQUIRED`.

**Priority: P2 post-launch**

---

## 12. Client Education Mini-Pages

SEO + conversion pages: What is an apostille, Apostille vs authentication, Can a RON document be apostilled, FBI background check apostille, Power of attorney for use abroad, Italy citizenship affidavit, International document courier release, Hague vs non-Hague countries.

**Priority: P3 post-launch**

---

## Build Order (post first paid matter)

1. Execution Readiness Engine
2. Matter Failure Prevention Engine
3. Document Packet Builder
4. Certificate Selection Engine
5. Receiving Authority Database
6. Release Certificate + Verify Page (data layer)
7. Operator Exception Center
8. Revenue Close Desk
9. Partner Tool Belt Certification
10. HNWI Matter Room
11. Atlas Source Governance (UI)
12. Client Education Mini-Pages
