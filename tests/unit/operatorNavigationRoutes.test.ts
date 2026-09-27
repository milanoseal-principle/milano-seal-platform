import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("every dashboard destination in the operator shell resolves to a page", () => {
  const shell = fs.readFileSync(
    path.join(root, "components/dashboard/OperatorShell.tsx"),
    "utf8",
  );
  const registry = fs.readFileSync(path.join(root, "lib/dashboard-modules.ts"), "utf8");
  const registeredModules = new Set(
    Array.from(registry.matchAll(/route:\s*"([^"]+)"/g), (match) => match[1]),
  );
  const destinations = Array.from(
    shell.matchAll(/href:\s*"(\/dashboard(?:\/[^"]*)?)"/g),
    (match) => match[1],
  );

  const unresolved = destinations.filter((destination) => {
    const relativeRoute = destination.replace(/^\/dashboard\/?/, "");
    const staticPage = path.join(root, "app", destination, "page.tsx");
    const canUseDynamicModule =
      !relativeRoute.includes("/") && registeredModules.has(relativeRoute);

    return !fs.existsSync(staticPage) && !canUseDynamicModule;
  });

  assert.deepEqual(unresolved, []);
});
