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
const targetChunk = 4;
const group = files.filter((_, index) => Math.floor((index * chunks) / files.length) === targetChunk);
console.log(`DIAG canonical npm-test chunk 5/8: ${group.length} files`);

for (let index = 0; index < group.length; index += 1) {
  const file = group[index];
  console.log(`DIAG TEST ${index}: ${file}`);
  const result = spawnSync(process.execPath, ["--import", "tsx", "--test", file], {
    stdio: "inherit",
    env: { ...process.env, CI: "1" },
  });
  if ((result.status ?? 1) !== 0) process.exit(120 + index);
}
process.exit(0);
