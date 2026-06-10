# GBP Authority and Review Engine

## Module Status (GBP Review Capture + Seal Impression)

| Item | Status |
|------|--------|
| Review capture route (`/api/reviews/request`) | Implemented |
| Portal review prompt (`SealImpressionReview`) | Implemented |
| Standalone review page (`/review`) | Implemented |
| ReviewProofCards component | Implemented |
| Schema utility (`buildProfessionalServiceSchema`) | Implemented |
| Fake reviews | **Prohibited** — zero fake reviews in codebase |
| AggregateRating | Gated behind real review data (`includeAggregateRating` + `reviewCount > 0`) |
| Review prompt timing | After completed/released deals only (`shouldShowReviewPrompt`) |
| Incentivized reviews | **Prohibited** |
| Google review URL env | `NEXT_PUBLIC_GBP_REVIEW_URL=https://g.page/r/YOUR_REAL_REVIEW_LINK/review` (do not use placeholder — replace with real link before launch) |

---

## GBP Buildout Checklist

### Profile Completeness
- [ ] Business name: The Milano Seal (exact match, no keyword stuffing)
- [ ] Primary category: Notary Public
- [ ] Secondary categories: Document Authentication Service, Apostille Service
- [ ] Service area: Tampa Bay, Florida — primary geo anchor
- [ ] Phone: verified and active
- [ ] Website: https://themilanoseal.com
- [ ] Hours: accurate and current
- [ ] Description: uses primary service language without guaranteed-outcome claims
- [ ] Photos: minimum 10 high-quality images (office, seal imagery, execution imagery)
- [ ] Logo: uploaded and verified
- [ ] Services section: fully populated with service names and descriptions

### Duplicate GBP Resolution
- [ ] Identify all duplicate GBP listings
- [ ] Submit merge request via Google Business Profile support
- [ ] Confirm primary listing retains all reviews
- [ ] Verify merged listing shows correct address and phone

### Tampa Bay Geo Anchor Lock
- [ ] Confirm address matches service area
- [ ] Confirm service area radius is correctly set for Tampa Bay
- [ ] Verify Florida as the primary state in service area
- [ ] Confirm listing is not appearing in wrong metro due to address mismatch

---

## Review Acquisition Loop

### Trigger Points for Review Requests
- Matter closed and courier confirmed delivered
- Client confirms receipt of apostilled documents
- Law firm confirms matter complete
- Family office confirms document release

### Review Request Method
- Direct link to GBP review page sent via email
- Text message follow-up if email not opened within 48 hours
- One reminder maximum — do not over-prompt

### Review Request Language
"Thank you for trusting The Milano Seal with your document matter. If you found our coordination helpful, a Google review would mean a great deal to us. [GBP review link]"

### Review Response Protocol
- Respond within 48 hours
- Acknowledge the specific service or corridor referenced
- Thank reviewer by first name if available
- Do not disclose matter details
- Flag any negative reviews for operator review before responding

### Review Volume Targets
- Month 1: 10 reviews
- Month 3: 25 reviews
- Month 6: 50 reviews
- Ongoing: minimum 2 new reviews per month

### Prohibited Review Tactics
- Do not offer incentives for reviews
- Do not ask for reviews before matter is complete
- Do not post fake reviews
- Do not ask employees or vendors to post reviews
