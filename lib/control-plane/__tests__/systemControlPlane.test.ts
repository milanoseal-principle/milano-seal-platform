import assert from "node:assert/strict";
import test from "node:test";
import { INTERNAL_MODULES } from "@/lib/internal/moduleRegistry";
import { EXPANSION_MODULES } from "@/lib/expansion/institutionalExpansion";
import {
  CANONICAL_AUTHORITIES,
  CONTROL_PLANE_GOVERNANCE,
  DELIVERY_STATUSES,
  PARENT_SYSTEMS,
  SYSTEM_REGISTRY,
} from "@/lib/control-plane/systemRegistry";
import {
  assertSystemRegistryIntegrity,
  evaluateSystemPlacement,
} from "@/lib/control-plane/placementGate";

test("control plane preserves exactly five parent systems", () => {
  assert.deepEqual(PARENT_SYSTEMS, [
    "demand",
    "matter_control",
    "execution_network",
    "intelligence_control",
    "governance_platform",
  ]);
});

test("delivery statuses preserve code versus live certification boundaries", () => {
  assert.deepEqual(DELIVERY_STATUSES, [
    "CONCEPT",
    "SPECIFIED",
    "BUILT",
    "WIRED",
    "GATED",
    "DEPLOYED",
    "LIVE_PROVEN",
    "CERTIFIED",
  ]);
});

test("system registry is internally valid", () => {
  const result = assertSystemRegistryIntegrity();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.ok(result.count >= 30);
});

test("every legacy internal module is surfaced in the master registry", () => {
  for (const module of INTERNAL_MODULES) {
    assert.ok(
      SYSTEM_REGISTRY.some((entry) => entry.id === `internal:${module.id}`),
      `Missing internal module adapter: ${module.id}`,
    );
  }
});

test("every institutional expansion engine is surfaced in the master registry", () => {
  for (const module of EXPANSION_MODULES) {
    assert.ok(
      SYSTEM_REGISTRY.some((entry) => entry.id === `expansion:${module}`),
      `Missing expansion adapter: ${module}`,
    );
  }
});

test("Wise remains the sole registered payment authority", () => {
  const paymentAuthority = CANONICAL_AUTHORITIES.find((authority) => authority.id === "payment");
  assert.ok(paymentAuthority);
  assert.match(paymentAuthority.authority, /Wise/i);
  assert.equal(paymentAuthority.mode, "external_verified");
  assert.ok(
    SYSTEM_REGISTRY.some(
      (entry) => entry.id === "wise_payment_authority" && entry.sourcePaths.some((path) => path.includes("wise")),
    ),
  );
});

test("intelligence/control projections cannot silently mutate canonical truth", () => {
  const violations = SYSTEM_REGISTRY.filter(
    (entry) =>
      entry.parentSystem === "intelligence_control" &&
      entry.category === "intelligence_surface" &&
      entry.mutationPolicy !== "read_only",
  );
  assert.deepEqual(violations, []);
  assert.equal(CONTROL_PLANE_GOVERNANCE.intelligenceCannotOverwriteTruth, true);
  assert.equal(CONTROL_PLANE_GOVERNANCE.oneMatterEngine, true);
});

test("placement gate rejects duplicate capabilities before build", () => {
  const result = evaluateSystemPlacement({
    id: "another-control-plane",
    name: "Milano Seal System Control Plane",
    parentSystem: "governance_platform",
    category: "workspace",
    audiences: ["operator"],
    authorityIds: ["sop"],
    mutationPolicy: "read_only",
    uxPlacement: "/dashboard/control-plane",
    sourcePaths: ["lib/example.ts"],
    validation: ["scripts/example.mjs"],
    duplicateKey: "system-control-plane",
  });
  assert.equal(result.valid, false);
  assert.ok(result.duplicateIds.includes("system_control_plane"));
});

test("placement gate requires source authority, UX placement and validation", () => {
  const result = evaluateSystemPlacement({
    id: "bad-module",
    name: "Bad Module",
    parentSystem: "demand",
    category: "public_surface",
    audiences: [],
    authorityIds: [],
    mutationPolicy: "none",
    uxPlacement: "",
    sourcePaths: [],
    validation: [],
    duplicateKey: "bad-module",
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 5);
});
