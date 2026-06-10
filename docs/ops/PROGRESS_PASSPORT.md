# Client-Facing Progress Passport

**Module:** Progress Passport / Global Transit View  
**Status:** Spec ready — wire after DB health passes  
**Component target:** `components/portal/ProgressPassport.tsx`

---

## Purpose

Transparency is the ultimate form of reassurance. The Progress Passport gives the client a visual, world-scale view of the document journey. It transforms international processing from an abstract waiting period into a concrete, visible, and orderly path toward completion.

---

## Visual Design

- Uses `WorldMapCanvas` / route visualization
- Origin jurisdiction marked
- Destination country marked
- Current stage highlighted
- No fake movement — real tracking overrides planned route
- Planned route labeled as "planned route" if actual tracking not yet active

---

## Stages

| # | Stage | Trigger |
|---|---|---|
| 1 | Matter received | `deal_status = awaiting_payment` |
| 2 | Review underway | `deal_status = reviewing` |
| 3 | Payment required | `payment_status = unpaid` and reviewed |
| 4 | Scheduling unlocked | `payment_status = paid` |
| 5 | Execution scheduled | `deal_status = scheduled` |
| 6 | Notarization complete | `deal_status = in_execution` → complete |
| 7 | Apostille processing | `deal_status = apostille` |
| 8 | Courier released | `deal_status = shipped` |
| 9 | In transit | Tracking active, not yet delivered |
| 10 | Delivered | `delivery_status = delivered` |
| 11 | Paid & released | `is_paid_and_released = true` |
| 12 | Completed | `deal_status = completed` |

---

## Portal Safety Rules

Show:
- Origin jurisdiction (state, not full address)
- Destination country
- Current stage (from above)
- Apostille stage (if applicable)
- Courier stage (if applicable)
- Carrier name + last 6 digits of tracking number only

Never show:
- Full tracking number
- `label_url`
- `shipping_cost`
- `storage_path`
- Internal notes
- Operator notes
- Signer's full address

---

## Component Props

```typescript
interface ProgressPassportProps {
  stage: number;           // 1–12
  originState: string | null;
  destinationCountry: string | null;
  apostilleRequired: boolean;
  courierActive: boolean;
  carrierName: string | null;
  trackingDisplay: string | null;  // last 6 chars only
  deliveredAt: string | null;
}
```
