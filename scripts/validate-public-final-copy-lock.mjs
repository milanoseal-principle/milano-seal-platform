import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const publicTargets = [
  "app/page.tsx",
  "app/pricing/page.tsx",
  "app/secure-portal",
  "app/intake",
  "app/map",
  "app/apostille",
  "app/countries",
  "app/services",
  "app/guides",
  "app/learn",
  "app/professionals",
  "app/verticals",
  "app/partners",
  "app/founder",
  "app/about",
  "app/alliance",
  "components/landing",
  "components/conversion",
  "components/countries",
  "components/seo",
  "app/layout.tsx",
  "app/opengraph-image.tsx",
  "app/twitter-image.tsx",
];
const ignored = ["app/api", "app/dashboard", "components/dashboard", "components/portal", "components/payment"];
const banned = [
  "Compliance Map",
  "Mission Control",
  "Sovereign Command",
  "RON Certified",
  "RON Specialist",
  "Hague Convention Compliant",
  "Hague Convention · 120+ Nations",
  "AES-256",
  "Stripe",
  "TIFFANYTEST",
  "TIFFANY100",
  "100% off",
  "free coupon",
  "payment bypass",
  "cheap",
  "fast notary",
  "notary near me",
  "guaranteed acceptance",
  "government approved",
  "accepted domestically and internationally",
  "Begin Execution",
  "Submit Matter",
];

for (const file of collectFiles(publicTargets)) {
  const rel = path.relative(root, file);
  if (ignored.some((prefix) => rel.startsWith(prefix))) continue;
  const content = fs.readFileSync(file, "utf8");
  for (const phrase of banned) {
    if (content.toLowerCase().includes(phrase.toLowerCase())) failures.push(`${rel} contains banned public phrase: ${phrase}`);
  }
}

const pricing = read("app/pricing/page.tsx");
if (/\$\s?(750|975|1850|150|250|400|500)\b|priceLabel/i.test(pricing)) failures.push("/pricing exposes exact internal price menu");
if (!/href="\/intake(?:\?[^"<>]*)?"/.test(pricing)) failures.push("/pricing does not link to /intake");
if (!pricing.includes('href="/secure-portal"')) failures.push("/pricing does not link to /secure-portal");

const shareCard = `${read("app/opengraph-image.tsx")}\n${read("app/twitter-image.tsx")}`;
for (const phrase of ["Gold M Orb share card", "#16130B", "THE MILANO SEAL™", "U.S. Document Execution for International Use", "THEMILANOSEAL.COM"]) {
  if (!shareCard.includes(phrase)) failures.push(`Share card missing: ${phrase}`);
}

const changed = getChangedFiles();
const blocked = [/^supabase\//, /^lib\/wise/, /^app\/api\/webhooks\/wise/, /^app\/api\/webhook\/wise/, /^app\/api\/deals\/.*payment/, /^app\/api\/deals\/.*release/, /^src\/features\/payments\//, /^src\/features\/release\//, /^src\/features\/ledger\//, /custody/i];
for (const file of changed) {
  if (blocked.some((pattern) => pattern.test(file))) failures.push(`Blocked scope file changed: ${file}`);
}

if (failures.length) {
  console.error("Public final copy lock validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Public final copy lock validation passed.");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}
function collectFiles(targets) {
  const files = [];
  for (const target of targets) {
    const abs = path.join(root, target);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) files.push(...walk(abs));
    else files.push(abs);
  }
  return files.filter((file) => /\.(tsx|ts|jsx|js|mdx|md)$/.test(file));
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full;
  });
}
function getChangedFiles() {
  const env = process.env.VALIDATE_CHANGED_FILES;
  if (env) return env.split("\n").filter(Boolean);
  return [];
}
