import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (
      entry.isFile() &&
      (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.mjs"))
    ) {
      out.push(p);
    }
  }
  return out.sort();
}

const files = walk("tests");
const chunks = 8;
const failingChunkIndex = 2;
const group = files.filter(
  (_, index) => Math.floor((index * chunks) / files.length) === failingChunkIndex,
);

for (let i = 0; i < group.length; i += 1) {
  const file = group[i];
  console.log(`DIAG TEST ${i}: ${file}`);
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--test", file],
    {
      stdio: "inherit",
      env: { ...process.env, CI: "1" },
    },
  );

  if ((result.status ?? 1) !== 0) {
    console.error(`DIAG FAIL ${i}: ${file}`);
    process.exit(60 + i);
  }
}

console.log("PASS: isolated production test chunk");
process.exit(0);
