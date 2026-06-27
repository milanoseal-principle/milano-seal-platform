import { execSync } from "child_process";
execSync("node scripts/validate-country-intelligence.mjs", { stdio: "inherit" });
