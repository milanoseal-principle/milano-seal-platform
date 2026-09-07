import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "supabase", "migrations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const required = [
  "001_initial_schema.sql",
  "002_rls_storage_policies.sql",
  "044_production_deals_payment_gate_compatibility.sql",
  "049_dashboard_intake_payment_status_reconciliation.sql",
  "050_live_intake_execution_truth_reconciliation.sql",
  "055_matter_evidence_ledger.sql",
  "056_matter_truth_snapshot_archive.sql",
  "078_shippo_prepayment_rate_continuity.sql",
  "079_wise_observed_scheduling_gate.sql",
];
const missing = required.filter((f) => !files.includes(f));
if (missing.length) throw new Error(`Missing required migrations: ${missing.join(", ")}`);

const duplicates = new Map();
for (const file of files) {
  const prefix = file.match(/^(\d+)_/)?.[1];
  if (!prefix) throw new Error(`Migration lacks numeric prefix: ${file}`);
  duplicates.set(prefix, [...(duplicates.get(prefix) ?? []), file]);
}
const duplicatePrefixes = [...duplicates.entries()].filter(([, names]) => names.length > 1);
if (duplicatePrefixes.length) {
  const detail = duplicatePrefixes
    .map(([prefix, names]) => `${prefix}: ${names.join(", ")}`)
    .join(" | ");
  throw new Error(`Migration chain contains duplicate numeric prefixes: ${detail}`);
}

const baseline = fs.readFileSync(path.join(dir, "001_initial_schema.sql"), "utf8");
for (const table of [
  "deals",
  "payments",
  "messages",
  "custody_ledger",
  "portal_otps",
  "files",
  "activity_logs",
  "compliance_rules",
]) {
  const pattern = new RegExp(`CREATE TABLE IF NOT EXISTS\\s+(?:public\\.)?${table}\\b`, "i");
  if (!pattern.test(baseline)) throw new Error(`001 baseline does not create required table: ${table}`);
}

const rls = fs.readFileSync(path.join(dir, "002_rls_storage_policies.sql"), "utf8");
if (!rls.includes("to_regclass('storage.objects')")) throw new Error("002 must guard storage.objects for clean shadow databases");
if (!rls.includes('DROP POLICY IF EXISTS "client_own_deal_files"')) throw new Error("002 policies must be idempotent");

const gate = fs.readFileSync(path.join(dir, "044_production_deals_payment_gate_compatibility.sql"), "utf8");
for (const column of ["status", "payment_status", "payment_confirmed", "currency"]) {
  if (!gate.includes(`add column if not exists ${column}`)) throw new Error(`044 missing additive guard for deals.${column}`);
}

const intakeRepair = fs.readFileSync(path.join(dir, "049_dashboard_intake_payment_status_reconciliation.sql"), "utf8");
for (const invariant of [
  "add column if not exists discount_amount",
  "alter column payment_status set default 'unpaid'",
  "'unpaid'",
  "'pending'",
  "drop constraint if exists deals_payment_status_check",
]) {
  if (!intakeRepair.includes(invariant)) throw new Error(`049 intake persistence repair missing invariant: ${invariant}`);
}
if (/update\s+public\.deals[\s\S]*payment_status\s*=\s*'unpaid'/i.test(intakeRepair)) {
  throw new Error("049 must not bulk-rewrite legacy pending payment state during the intake repair increment");
}

const executionRepair = fs.readFileSync(
  path.join(dir, "050_live_intake_execution_truth_reconciliation.sql"),
  "utf8",
);
for (const invariant of [
  "add column if not exists discount_amount",
  "add column if not exists execution_truth jsonb",
  "add column if not exists due_at timestamptz",
  "generated always as (sla_deadline) stored",
  "drop constraint if exists deals_payment_status_check",
  "alter column payment_status set default 'unpaid'",
  "'unpaid'",
  "'pending'",
  "jsonb_typeof(execution_truth) = 'object'",
]) {
  if (!executionRepair.includes(invariant)) {
    throw new Error(`050 live reconciliation missing invariant: ${invariant}`);
  }
}
if (/update\s+public\.deals[\s\S]*payment_status\s*=\s*'unpaid'/i.test(executionRepair)) {
  throw new Error("050 must preserve legacy pending rows; no bulk payment-state rewrite");
}

const evidenceLedger = fs.readFileSync(path.join(dir, "055_matter_evidence_ledger.sql"), "utf8");
if (!evidenceLedger.includes("prevent_matter_evidence_ledger_mutation")) throw new Error("055 must preserve append-only Matter evidence history");
if (!evidenceLedger.includes("auth.jwt() -> 'app_metadata'")) throw new Error("055 RLS must use app_metadata role authority");

const truthArchive = fs.readFileSync(path.join(dir, "056_matter_truth_snapshot_archive.sql"), "utf8");
for (const invariant of [
  "prevent_matter_truth_snapshot_mutation",
  "status in ('ACCEPTED','PENDING_REVIEW','REJECTED')",
  "length(btrim(build_version)) > 0",
  "jsonb_typeof(authority_versions) = 'object'",
  "jsonb_typeof(domains) = 'object'",
  "array_position(source_evidence_ids, null) is null",
  "status = 'ACCEPTED' and accepted_at is not null and accepted_by is not null and accepted_at >= captured_at",
  "status <> 'ACCEPTED' and accepted_at is null and accepted_by is null",
  "auth.jwt() -> 'app_metadata'",
]) {
  if (!truthArchive.includes(invariant)) throw new Error(`056 Matter Truth snapshot archive missing invariant: ${invariant}`);
}
if (/auth\.jwt\(\)\s*->\s*'user_metadata'/.test(truthArchive)) {
  throw new Error("056 must never authorize snapshot access from user_metadata");
}

const shippoContinuity = fs.readFileSync(path.join(dir, "078_shippo_prepayment_rate_continuity.sql"), "utf8");
for (const invariant of [
  "provider_rate_amount",
  "tier_courier_credit",
  "client_courier_charge",
  "pricing_snapshot_hash",
  "rate_status",
  "idx_shippo_shipments_matter_provider_shipment",
]) {
  if (!shippoContinuity.includes(invariant)) {
    throw new Error(`078 Shippo continuity migration missing invariant: ${invariant}`);
  }
}

const observedWiseGate = fs.readFileSync(path.join(dir, "079_wise_observed_scheduling_gate.sql"), "utf8");
for (const invariant of [
  "TG_OP = 'UPDATE'",
  "NEW.status = 'scheduled'",
  "NEW.payment_observed_at is not null",
  "observed_pending",
  "NEW.payment_observed_amount",
  "NEW.payment_observed_currency",
  "NEW.payment_observed_reference",
  "NEW.amount_due",
  "NEW.currency",
  "NEW.wise_reference",
  "wise_transaction_reference",
  "payment_funding_method",
  "wise_acquiring_payment",
  "provider_payment_valid",
]) {
  if (!observedWiseGate.includes(invariant)) {
    throw new Error(`079 Wise authority gate missing invariant: ${invariant}`);
  }
}
if (!/NEW\.status\s*=\s*'scheduled'[\s\S]*observed_submission_valid/i.test(observedWiseGate)) {
  throw new Error("079 must authorize scheduling from integrity-matched observed Wise submission");
}
if (!/NEW\.status\s*<>\s*'scheduled'[\s\S]*provider_payment_valid/i.test(observedWiseGate)) {
  throw new Error("079 later execution progression must require stronger Wise provider evidence");
}
if (/payment_status\s*=\s*'paid'[\s\S]*payment_observed_at/i.test(observedWiseGate)) {
  throw new Error("079 must never author paid state from observed or provider-processing Wise evidence");
}

console.log(`Migration contract validated across ${files.length} SQL files.`);
