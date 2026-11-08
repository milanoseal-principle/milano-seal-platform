import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const config = readFileSync("eslint.config.js", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

test("lint gate parses TypeScript/TSX and enforces error-level correctness rules", () => {
  assert.match(config, /tseslint\.parser/);
  assert.match(config, /files: \["\*\*\/\*\.\{ts,tsx,js,mjs,cjs\}"\]/);
  const errorRules = config.match(/": "error"/g) ?? [];
  assert.ok(errorRules.length >= 20, "lint must enforce a meaningful error-level rule set");
  assert.match(config, /"react-hooks\/rules-of-hooks": "error"/);
  assert.doesNotMatch(config, /"\*\*\/\*\.(ts|tsx)"\s*,?\s*\]\s*,?\s*\n\s*\],?\s*\/\/\s*ignore/);
  assert.equal(pkg.scripts.lint, "npx --yes eslint@9.39.5 .");
  assert.ok(pkg.devDependencies["typescript-eslint"]);
});
