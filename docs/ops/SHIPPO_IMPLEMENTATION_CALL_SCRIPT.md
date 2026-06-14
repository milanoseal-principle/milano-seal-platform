# Shippo Implementation Call Script

**Classification:** Internal operations  
**Workflow:** Custody-controlled international document shipping

Milano Seal ships its own document packets. Clients and partners do not buy
labels, and delivered status never bypasses final release review.

## Confirm with Shippo

1. Direct API under one Milano Seal account is appropriate; Shipping Elements,
   OAuth, and Platform Accounts are not needed for the current model.
2. Test and live token handling, without printing or sharing token values.
3. Recommended production `Shippo-API-Version` behavior.
4. Webhook verification method for `/api/webhooks/shippo`.
5. Tracking status and substatus mapping for `PRE_TRANSIT`, `TRANSIT`,
   `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILURE`, `RETURNED`, and `UNKNOWN`.
6. Address validation, rate preview, operator selection, label purchase, and
   automatic tracking registration.
7. Whether incorrect Shippo objects must be replaced instead of edited.
8. Document-only customs defaults:
   - `contents_type: DOCUMENTS`
   - explanation: documents for international document execution
   - `non_delivery_option: RETURN`
   - declared value: 1 USD
9. Whether an HS code is needed for document-only shipments.
10. Tracking reliability for DHL Express, FedEx International, UPS Worldwide,
    and appropriate USPS services.
11. Bring-your-own-account setup for DHL, FedEx, or UPS.
12. Confirmation that client surfaces should never receive label URLs, carrier
    account IDs, costs, or raw rates.

## Required Outcome

- Direct API model confirmed
- Test/live handling confirmed
- API version recommendation recorded
- Webhook security method recorded
- Tracking map confirmed
- Customs guidance recorded
- Carrier and BYOA guidance recorded
- Sandbox label steps recorded

Operational sequence remains:

`payment confirmed → execution complete → apostille complete when required → release approved → operator buys label → tracking registered → custody ledger updated → client-safe tracking projected → delivery enters release review`
