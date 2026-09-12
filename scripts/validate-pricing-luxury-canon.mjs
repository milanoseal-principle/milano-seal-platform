import fs from "node:fs";

const p = fs.readFileSync("app/pricing/page.tsx", "utf8");
const failures = [];

for (const text of [
  "Execution Quote",
  "Know exactly what your",
  "What You Are Buying",
  "Authentication Matter",
  "Signature Matter — RON",
  "Signature Matter — In Person",
  "First apostille coordination when required",
  "What Can Change The Quote",
  "Your Reviewed Matter Summary",
  "Payment-Gated Execution",
  "50% Wise deposit",
  "final 50%",
  "international release",
  "Counsel keeps the legal matter.",
  "See your exact Matter path before you pay.",
  'href="/secure-portal"',
  "Final acceptance remains subject to the receiving authority.",
]) {
  if (!p.includes(text)) failures.push(`missing ${text}`);
}

for (const bad of [
  "$599",
  "$750",
  "$850",
  "$975",
  "$1,850",
  "$1850",
  "$250",
  "$150",
  "$400",
  "$75",
  "$25",
  "priceLabel",
]) {
  if (p.includes(bad)) failures.push(`public price exposed ${bad}`);
}

if (!/href="\/intake\?source=pricing/.test(p)) {
  failures.push("pricing page does not provide secure intake conversion path");
}

if (/apostille-related[\s\S]{0,120}Priority Execution/i.test(p)) {
  failures.push("apostille alone is still framed as a Priority trigger");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Pricing conversion clarity validation passed.");
