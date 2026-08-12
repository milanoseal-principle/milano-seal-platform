# THE MILANO SEAL™ — LEGAL COMPLIANCE ENGINE → PRODUCTION INJECTION

Source workbook: `Milano Seal Legal Compliance Engine (3).xlsx`

## Canonical runtime policy

- Preserve all workbook rows, columns, values, blanks, and formulas as source evidence.
- Do not overwrite newer production routes or modules.
- Mount source-preserved modules under `/dashboard/workbook`.
- Supabase remains operational source of truth for live matters.
- Canonical Matter schema, state machine, event naming, and execution order remain authoritative.
- Wise is the only runtime payment provider.
- Any Stripe references inside workbook source are legacy evidence only and must be visibly classified as prohibited at runtime.
- Payment before scheduling remains enforced by the production payment gate.
- Credentials content is private and redacted in the workbook viewer.

## Production architecture

`Workbook source → generatedWorkbookSource.ts → moduleRegistry.ts → MilanoWorkbookModule.tsx → authenticated /dashboard/workbook routes`

## Module inventory

38 source modules are preserved and exposed through the authenticated internal workbook intelligence layer:

COVER, MASTER_INDEX, START_HERE, LEGAL_STRUCTURE, CREDENTIALS_INDEX, COMPLIANCE_TRACKER, SYSTEM_DASHBOARD, OPERATOR_DASHBOARD, COMMAND_CENTER, KPI_DASHBOARD, CLIENT_REGISTRY, DEAL_FINANCIALS, PRICING_ENGINE, DEAL_LOGIC, APOSTILLE_TRACKER, OPS_RUNBOOK, INBOUND_SCRIPTS, EMAIL_TEMPLATES, REFERRAL_ENGINE, GOOGLE_EXTRACTION_ENGINE, LEADS_PIPELINE, ADS_TRACKING, CONTENT_COMMAND, KG_SEO_MAP, COUNTRY_REQUIREMENTS, DOCUMENT_TAXONOMY, KG_SCHEMA, SEO_SOCIAL, WEBSITE_ALIGNMENT, REVIEW_FLOW, AUTOMATION_ENGINE, PIPELINE_FORECAST, STAGE_PROBABILITY, COUNTRY_LANES, IDEA_VAULT, ADVANCED_DASHBOARD, ASSETS_LINKS, DROPDOWNS.

## Route collision policy

Workbook source originally maps several sheets to routes already occupied by newer live production modules, including `/dashboard`, `/dashboard/pricing`, `/dashboard/apostille`, `/dashboard/financials`, `/dashboard/clients`, and other active surfaces.

Those live routes are not replaced. Workbook modules are mounted at:

`/dashboard/workbook/<SHEET_NAME>`

The index is:

`/dashboard/workbook`

This preserves every source module while preventing regression of current Milano Seal OS behavior.

## Validation state

Static integration checks completed:

- 38 module records present.
- Source-preserved generated workbook data present.
- Wise-only runtime policy present.
- Stripe legacy references remain only in source evidence/runtime prohibition logic.
- No original uploaded repo files deleted in the local integration copy.

Full dependency-based typecheck/build could not run in the execution environment because the configured package mirror returned HTTP 404 for the locked `zod` tarball. Do not treat that environment failure as an application build result.
