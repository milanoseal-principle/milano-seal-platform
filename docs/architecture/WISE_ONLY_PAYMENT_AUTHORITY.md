# Wise-only payment authority

Wise is the sole payment authority in the current Milano Seal architecture.

## Canonical rules

- Normal paid matters require verified Wise payment evidence.
- Complimentary matters use the separately governed and audited complimentary authorization path.
- Complimentary authorization does not create a payment, set `payment_confirmed`, or create verified revenue.
- There is no alternate processor, private backup rail, checkout fallback, or production dependency.
- The retired webhook path returns HTTP 410 and performs no mutation. It is a tombstone, not an integration.

Historical pull-request descriptions and archived audit notes do not define current production doctrine.
