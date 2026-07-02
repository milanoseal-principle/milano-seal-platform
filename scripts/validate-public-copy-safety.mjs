import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const failures = [];
const blocked = ["guaranteed acceptance", "accepted internationally", "Hague compliant", "government approved", "cheap notary", "payment bypass", "TIFFANYTEST", "TIFFANY100", "100% off", "fake live data", "fake dashboard metric"];
const publicFiles = files("app", /\.(tsx?|md)$/).filter((file) => !file.startsWith("app/dashboard/") && !file.startsWith("app/api/") && !file.startsWith("app/portal/") && !file.startsWith("app/va/")).concat(files("components", /\.(tsx?|md)$/).filter((file) => !file.startsWith("components/dashboard/") && !file.startsWith("components/operator-spine/") && !file.startsWith("components/packaging-delivery/")));
for (const file of publicFiles) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const term of blocked) if (text.toLowerCase().includes(term.toLowerCase())) failures.push(`${term} found in ${file}`);
  if (/\blegal advice\b/i.test(text) && !/does not provide legal advice|not legal advice/i.test(text)) failures.push(`unsafe legal advice context in ${file}`);
  if (/\bStripe\b/.test(text) && !file.includes("privacy") && !file.includes("terms")) failures.push(`Stripe appears in public copy: ${file}`);
}
if (failures.length) { console.error("Public copy safety validation failed:"); failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1); }
console.log("Public copy safety validation passed.");
function files(dir, pattern) { const full = path.join(root, dir); if (!fs.existsSync(full)) return []; return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => { const rel = path.join(dir, entry.name).replaceAll(path.sep, "/"); return entry.isDirectory() ? files(rel, pattern) : pattern.test(rel) ? [rel] : []; }); }
