import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "supabase", "migrations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const required = ["001_initial_schema.sql", "002_rls_storage_policies.sql", "044_production_deals_payment_gate_compatibility.sql", "049_dashboard_intake_payment_status_reconciliation.sql"];
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
  console.warn("Migration chain contains duplicate numeric prefixes:");
  for (const [prefix, names] of duplicatePrefixes) console.warn(`  ${prefix}: ${names.join(", ")}`);
}

const baseline = fs.readFileSync(path.join(dir, "001_initial_schema.sql"), "utf8");
for (const table of ["deals", "payments", "messages", "custody_ledger", "portal_otps", "files", "activity_logs", "compliance_rules"]) {
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
  "set payment_status = 'unpaid'",
  "alter column payment_status set default 'unpaid'",
  "'unpaid'",
  "drop constraint if exists deals_payment_status_check",
]) {
  if (!intakeRepair.includes(invariant)) throw new Error(`049 intake persistence repair missing invariant: ${invariant}`);
}

console.log(`Migration contract validated across ${files.length} SQL files.`);