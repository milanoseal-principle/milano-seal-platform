import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

// Run the node test runner through tsx so TypeScript tests and the `@/` path
// alias resolve. Accept explicit test paths as arguments; otherwise discover the
// canonical test locations deterministically instead of passing shell-style **
// globs to Node (which are not expanded consistently on clean CI runners).
const args = process.argv.slice(2).filter((arg) => arg !== "--runInBand");

function walkTests(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTests(absolute));
    else if (entry.isFile() && /\.test\.(?:ts|tsx|js|mjs|mts)$/.test(entry.name)) out.push(absolute);
  }
  return out;
}

const testTargets = args.length > 0
  ? args
  : ["tests", "lib", "components"]
      .flatMap(walkTests)
      .sort();

if (testTargets.length === 0) {
  console.error("No test files discovered.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...testTargets],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
