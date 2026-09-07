# Governed RON / BlueNotary Client Journey

Safe-port of the client RON journey onto current production main.

## Authority boundaries
- Canonical Matter remains the only Matter authority.
- Governed Wise submission may authorize scheduling immediately; settlement remains separate.
- BlueNotary remains the regulated signing environment.
- Unknown/review-required notarial act remains operator review; the client never chooses jurat vs acknowledgment.
- Browser return never authors RON completion.
- Provider evidence is required before verified RON completion language.
- Apostille and release remain downstream governed authorities.
- No Stripe. No second payment engine. No second scheduler. No duplicate RON authority.

The stale Codex branch is not merged wholesale; only current-main-compatible RON client journey changes are ported.