# Architecture Gap Register

This register captures verified architecture debt without creating duplicate systems.

## P0 — release evidence authority

Status: active hardening work exists outside this documentation branch.

Required end state:
- browser-local checklist cannot author release truth
- canonical server release authority consumes durable review evidence
- settlement, RON, apostille, translation, identifier, final-PDF, recipient, compliance and founder gates remain fail-closed
- immutable decision receipts exist

## P1 — historical documentation drift

Older reports contain superseded statements about payment gating and demo behavior. Current source code, current production, and the newest locked architecture control these conflicts. Historical audit files must be clearly marked superseded rather than used as production authority.

## P1 — Matter continuity proof

The platform has canonical Matter identifiers and linked subsystems. Final 10/10 certification still requires one real same-Matter transaction proving intake → Wise → scheduling → RON → apostille → custody → courier → settlement-dependent release → close with zero duplicate authority.

## P1 — notification delivery proof

Notification orchestration exists. Final certification requires real provider/mailbox delivery evidence for required lifecycle events and duplicate-event suppression.

## P1 — runtime transaction proof

Build/test gates are strong. Final certification still requires transaction-window production log review with zero unexplained 5xx/fatal failures.

## P1 — mobile operator/client proof

Responsive validators exist. Final certification requires real-device or production-browser walkthroughs of client and operator critical paths.

## Rule

A gap closes only when current code + evidence + tests prove it. Documentation may describe a gap but may not mark it complete.
