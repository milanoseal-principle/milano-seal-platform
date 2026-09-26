import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function walkTests(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTests(absolute));
    else if (entry.isFile() && entry.name.endsWith(".test.ts")) out.push(absolute);
  }
  return out;
}

const files = ["tests", "lib", "components"].flatMap(walkTests).sort();
const chunks = 8;
const chunk = Number(process.env.MILANO_TEST_CHUNK ?? "0");
const group = files.filter((_, index) => Math.floor((index * chunks) / files.length) === chunk);

console.log(`DIAG canonical npm-test chunk ${chunk + 1}/${chunks}: ${group.length} files of ${files.length}`);
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...group], {
  stdio: "inherit",
  env: { ...process.env, CI: "1" },
});
process.exit(result.status ?? 1);
