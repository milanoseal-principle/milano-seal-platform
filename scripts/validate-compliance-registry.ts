import { validateAll } from "../lib/compliance/validation";

const { valid, errors } = validateAll();

if (errors.length > 0) {
  console.error("Compliance registry validation FAILED:");
  for (const err of errors) {
    console.error(`  [${err.type}] ${err.slug}.${err.field}: ${err.message}`);
  }
  process.exit(1);
} else {
  console.log("Compliance registry validation passed.");
}
