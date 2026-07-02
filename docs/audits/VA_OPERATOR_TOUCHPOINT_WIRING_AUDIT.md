# VA / Operator Touchpoint Wiring Audit

Status: PARTIAL. This audit creates policy constants and documents operating boundaries without rewriting auth, Supabase policies, payment logic, Wise reconciliation, release gates, or custody controls.

## VA allowed actions

- intake completeness review
- document checklist prep
- client follow-up draft
- scheduling coordination draft
- shipping label prep draft if operator-approved
- review queue organization
- referral list organization
- SEO/content staging

## VA blocked actions

- confirm_payment
- mark_paid
- comp_clear
- approve_discount
- schedule_execution_without_payment_clearance
- approve_bluenotary_completion
- approve_release
- release_packet
- override_custody
- view_unrelated_client_sensitive_data
- wise_reconciliation
- edit_payment_webhook
- edit_supabase_policies

## Founder/admin only actions

- approve_release
- reconcile_wise
- approve_comp_clear
- approve_alliance_dispatch
- manage_environment_variables
- approve_high_risk_compliance_route
- manage_bluenotary_webhook_setup

## Enforcement note

The current pass is governance-only. If runtime authorization is missing for a touchpoint, it remains PARTIAL and must be enforced in a dedicated auth/RLS branch.
