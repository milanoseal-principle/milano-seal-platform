# Architecture Authority Map

This map assigns each production concern to exactly one primary authority layer. Supporting modules may read/project truth but may not become transaction authorities.

| Layer | Primary authority | May not become |
|---|---|---|
| 01 Matter | Canonical Matter identity/lifecycle | second CRM / duplicate Matter engine |
| 02 Business Rules | Governed transition/readiness rules | duplicate state machine |
| 03 Pricing | Canonical quote/scope engine | payment authority |
| 04 Intake | Validated Matter creation/update | execution/release authority |
| 05 RON | Scheduling + BlueNotary readiness/evidence | second scheduler/RON engine |
| 06 Apostille | Authentication route/evidence state | acceptance guarantee |
| 07 Operator | Governed action projection | local/browser authority |
| 08 Wise | Payment observation/reconciliation/paid truth | alternate payment rail |
| 09 Economics | Read-only financial intelligence | transactional state authority |
| 10 Notifications | Message delivery state | Matter state authority |
| 11 Corridor | Read-only corridor intelligence | transaction engine |
| 12 Security | Roles/RLS/audit/release authority | client-side approval authority |
| 13 Config | Deployment/provider configuration | business-truth store |
| 14 Finance | Settlement/accounting evidence | second paid-state authority |
| 15 Validation | Certification evidence | runtime state mutation shortcut |

## Cross-layer invariant

MATTER owns the canonical object.
EXECUTION governs movement and evidence.
CORRIDOR governs routing intelligence.
Everything else supports those three without competing with them.
