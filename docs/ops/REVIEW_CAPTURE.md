# Systematic Review Capture

**Module:** GBP Review Capture Automation  
**Status:** Partially built — `SealImpressionReview` + `/review` route live (commit `56b9a8a`)  
**Remaining:** Automated trigger on deal completion + NEXT_PUBLIC_GBP_REVIEW_URL env var

---

## Purpose

Excellence is a habit that deserves recognition. By requesting a review at the moment of client relief, The Milano Seal captures trust when it is strongest. This does not just strengthen the Google profile; it builds the market-wide reputation that keeps The Milano Seal at the top of international document execution.

---

## Trigger Events

Review prompt unlocks when any of these occur:

| Event | Status |
|---|---|
| `DOCUMENT_RETURNED` | Portal shows review prompt |
| `DELIVERY_CONFIRMED` | Portal shows review prompt |
| `PAID_AND_RELEASED` | Portal shows review prompt |
| `deal_status = completed` | Portal shows review prompt |

Review prompt is **locked** for all other statuses.

---

## Client Message

> "Thank you for trusting The Milano Seal with your document matter. If the process felt clear and professionally handled, your Google review helps future clients choose a secure path."

---

## Events Logged

| Event | When |
|---|---|
| `review_requested` | Review prompt displayed to client |
| `review_link_opened` | Client clicks Google review link |
| `review_reminder_sent` | One follow-up reminder sent (max 1) |
| `review_capture_skipped` | Client dismissed without action |

---

## Rules (Non-Negotiable)

- No fake reviews
- No fake `AggregateRating` with fabricated `reviewCount`
- No employee or vendor review requests
- No review request before `deal_status = completed` or equivalent
- One reminder maximum per matter
- `buildProfessionalServiceSchema()` only adds `aggregateRating` when real data present and `reviewCount > 0`

---

## Required Env Var

```
NEXT_PUBLIC_GBP_REVIEW_URL=https://g.page/r/YOUR_REAL_GBP_LINK/review
```

Add in Vercel → Settings → Environment Variables → Production.  
Trigger redeploy after adding.

---

## Built Files

- `lib/reviews/googleBusinessProfile.ts` — `shouldShowReviewPrompt()`, `buildReviewCopy()`
- `components/reviews/SealImpressionReview.tsx` — client-facing review UI
- `lib/schema/reviewSchema.ts` — `buildProfessionalServiceSchema()`
- `app/api/reviews/request/route.ts` — logs `review_requested` event
- `app/review/page.tsx` — standalone `/review` route (noindex)
