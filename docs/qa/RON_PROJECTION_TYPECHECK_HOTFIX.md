# RON Projection Typecheck Hotfix

Production build regression fixed after PR #334.

The portal RON projection now exposes canonical scheduling authority only. It does not derive or expose Wise settlement truth from `ron_sessions.payment_gate_status`.

Validation target:
- typecheck green
- full merge gate green
- no duplicate `scheduling_authorized` property
- no undefined `paymentConfirmed`
- no second payment authority
