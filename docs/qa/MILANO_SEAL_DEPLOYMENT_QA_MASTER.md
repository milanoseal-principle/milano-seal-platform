# Milano Seal Deployment QA Master

**Classification:** Canonical deployment gate  
**Scope:** Webpage, dashboard, Matter Control Portal, Alliance, mobile, and operational safety

## Critical Routing Tests

- UAE displays `VERIFICATION_REQUIRED` until the receiving-authority pathway is
  confirmed.
- Mexico remains a Hague Convention member.
- FBI, IRS, FDA, USPTO, federal court, naturalization, and Social Security
  records never route through Florida Department of State.
- Brazil copy says translation review may be required; it does not promise an
  absolute translation requirement.
- Florida copy distinguishes Florida and federal authority pathways.

## Critical Safety Tests

- Payment gating cannot be bypassed.
- Final release requires identifier, QA, custody, and founder gates where
  applicable.
- Founder images and locked orb assets are unchanged.
- `/portal/trackingNow` redirects to `/portal/tracking`.
- Wise references use the canonical production format.
- Stripe references do not appear in active Milano Seal flows.

## Data Provenance Tests

- Truth Engine scores reconcile to queried production records.
- Memory Engine incidents include database or event-log provenance.
- Execution DNA uses completed matter history only.
- Empty data produces an explicit unavailable/pending state, never a fabricated
  score.
- Any demonstration surface is labeled `Demo Preview - Not Live Data`.

## Delivery Tests

- Final file follows
  `MS-[INVOICE#]_[DOCUMENT_TYPE]_[STATUS]_[LASTNAME_OR_ENTITY]_[YYYYMMDD].pdf`.
- Paid & Released delivery is blocked until payment, final approval, and PDF
  lock are confirmed.
- Sent versions are retained and never overwritten.
- Only the PaidReleased PDF is attached to final completion email.
- Delivery log records sender, date, file name, lock state, status, receipt, and
  follow-up requirement.

## Shippo Tests

- Address validation precedes rates.
- Operator selects and purchases the label.
- Tracking updates are idempotent.
- Portal receives only sanitized carrier, tracking display, URL, status, and
  safe events.
- Delivered status triggers review and does not auto-release.
- No fake GPS, ETA, label URL, raw rate, cost, or carrier-account data appears
  in client surfaces.

## Experience Tests

- No horizontal scrolling on mobile Safari.
- Tap targets are at least 44px.
- Reduced-motion preferences are respected.
- No broken orb, checkerboard, or asset crossover.
- Public copy avoids legal determinations and guaranteed acceptance.

## Severity

- **Critical:** security, payment, authority routing, release, client projection,
  asset integrity, or tracking compatibility failure.
- **Major:** mobile overflow, reduced-motion failure, inaccessible tap targets,
  or material route failure.
- **Minor:** styling inconsistency or non-material copy drift.

Target: 95% or higher with no unresolved critical failures.
