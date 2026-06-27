import { readFileSync } from "fs";

const card = readFileSync("components/landing/destination-intelligence-card.tsx", "utf8");
const failures = [];

for (const required of [
  "w-[min(310px,calc(100vw-2rem))]",
  "whitespace-normal break-words",
  "min-h-11",
  "data-critical-card",
  "primaryCtaLabel",
  "secondaryCtaLabel",
]) {
  if (!card.includes(required)) failures.push(`Responsive smoke missing: ${required}`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Milano responsive smoke validation passed.");
