import { spawnSync } from "node:child_process";

const passthrough = process.argv.slice(2).filter((arg) => arg !== "--runInBand");
const result = spawnSync(process.execPath, ["--test", ...passthrough], { stdio: "inherit" });
// Run the node test runner through tsx so TypeScript tests and the `@/` path
// alias resolve. Accept explicit test paths as arguments; otherwise discover the
// canonical test locations. `--runInBand` is accepted for compatibility.
const args = process.argv.slice(2).filter((arg) => arg !== "--runInBand");

const defaultGlobs = [
  "tests/**/*.test.ts",
  "lib/**/__tests__/*.test.ts",
  "components/**/__tests__/*.test.ts",
];

const testTargets = args.length > 0 ? args : defaultGlobs;

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...testTargets],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
