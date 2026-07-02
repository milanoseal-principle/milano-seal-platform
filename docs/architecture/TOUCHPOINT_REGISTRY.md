# Touchpoint Registry

The touchpoint registry documents public visitor, client, alliance member, virtual assistant, operator, and founder/admin surfaces. Status values are injected, partial, missing, staged_only, and blocked. Risk values include low, medium, high, payment_sensitive, identity_sensitive, custody_sensitive, and compliance_sensitive.

Public visitor touchpoints: `/`, `/pricing`, `/secure-portal`, `/map`.

Client touchpoints: `/intake`, `/intake/confirmation`, `/portal`, `/portal/matter-room`, PortalCourierCustody, invoice/payment view.

Alliance touchpoints: `/alliance`, `/alliance/dashboard`, `lib/modules/allianceDashboardModules.ts`; dispatch is staged_only.

VA touchpoints: intake review, document checklist, follow-up queue. VA cannot touch payment release or custody release.

Operator touchpoints: `/dashboard`, `/dashboard/command-center`, `/dashboard/discounts`, `/dashboard/referrals`, `/dashboard/seo-authority`, `/dashboard/compliance-atlas`, `/dashboard/operator-terminal`, `/dashboard/invoices`, `/dashboard/shipping`.

Founder/admin touchpoints: payment gate overrides, paid comp/discount approval, release approval, BlueNotary webhook review, Wise reconciliation.
