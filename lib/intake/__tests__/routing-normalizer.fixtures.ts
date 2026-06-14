/**
 * Routing normalizer validation fixtures.
 *
 * No test framework required — call validateRoutingNormalizerFixtures() to
 * exercise all 6 canonical cases and get a plain-text pass/fail report.
 *
 * Usage (Node or browser console):
 *   import { validateRoutingNormalizerFixtures } from "./__tests__/routing-normalizer.fixtures";
 *   console.log(validateRoutingNormalizerFixtures());
 */

import {
  normalizeIntakeRouting,
  type NormalizedRoutingContext,
} from "../routing-normalizer";

interface FixtureCase {
  name: string;
  payload: Record<string, unknown>;
  expect: {
    origin_authority_type: NormalizedRoutingContext["origin_authority_type"];
    apostille_path: NormalizedRoutingContext["apostille_path"];
    origin_state?: string;
    requires_operator_review?: boolean;
    hasWarning?: string; // substring that must appear in at least one warning
  };
}

const FIXTURES: FixtureCase[] = [
  // ── Case 1: One and Same Affidavit + RON + Italy ──────────────────────────
  {
    name: "One and Same Affidavit + RON + Italy → florida_ron_notarial_act, florida_apostille",
    payload: {
      document_type: "One and the Same Affidavit",
      execution_type: "RON",
      destination_country: "Italy",
      origin_state: "Florida",
    },
    expect: {
      origin_authority_type: "florida_ron_notarial_act",
      apostille_path: "florida_apostille",
    },
  },

  // ── Case 2: One and Same + RON + raw "Federal (FBI)" in origin ────────────
  {
    name: "One and Same + RON + Federal (FBI) origin → corrected to florida_ron_notarial_act + warning",
    payload: {
      document_type: "One and the Same Affidavit",
      execution_type: "RON",
      destination_country: "Italy",
      origin_state: "Federal (FBI)",
    },
    expect: {
      origin_authority_type: "florida_ron_notarial_act",
      apostille_path: "florida_apostille",
      origin_state: "Florida",
      hasWarning: "Federal (FBI) was selected",
    },
  },

  // ── Case 3: FBI Background Check + Italy ──────────────────────────────────
  {
    name: "FBI Background Check + Italy → federal_document, federal_apostille",
    payload: {
      document_type: "FBI Background Check",
      destination_country: "Italy",
      origin_state: "Federal (FBI)",
    },
    expect: {
      origin_authority_type: "federal_document",
      apostille_path: "federal_apostille",
    },
  },

  // ── Case 4: Colorado Birth Certificate + Italy ────────────────────────────
  {
    name: "Colorado Birth Certificate + Italy → state_issued_document, state_apostille, origin_state=Colorado",
    payload: {
      document_type: "Birth Certificate",
      destination_country: "Italy",
      origin_state: "Colorado",
    },
    expect: {
      origin_authority_type: "state_issued_document",
      apostille_path: "state_apostille",
      origin_state: "Colorado",
    },
  },

  // ── Case 5: Florida Power of Attorney + RON + UAE ─────────────────────────
  {
    name: "Florida Power of Attorney + RON + UAE → requires_operator_review=true, operator_review",
    payload: {
      document_type: "Power of Attorney",
      execution_type: "RON",
      destination_country: "United Arab Emirates",
      origin_state: "Florida",
    },
    expect: {
      // Not a One-and-Same, so it stays as state_issued_document
      origin_authority_type: "state_issued_document",
      apostille_path: "operator_review",
      requires_operator_review: true,
      hasWarning: "pathway verification is required",
    },
  },

  // ── Case 6: Foreign Birth Certificate (Mexico) + United States ────────────
  {
    name: "Foreign Birth Certificate (origin_country=Mexico) + United States → foreign_issued_document, operator_review, requires_operator_review=true",
    payload: {
      document_type: "Birth Certificate",
      origin_country: "Mexico",
      destination_country: "United States",
    },
    expect: {
      origin_authority_type: "foreign_issued_document",
      apostille_path: "operator_review",
      requires_operator_review: true,
    },
  },
];

interface TestResult {
  name: string;
  pass: boolean;
  failures: string[];
  ctx: NormalizedRoutingContext;
}

function runFixture(fixture: FixtureCase): TestResult {
  const ctx = normalizeIntakeRouting(fixture.payload);
  const failures: string[] = [];

  if (ctx.origin_authority_type !== fixture.expect.origin_authority_type) {
    failures.push(
      `origin_authority_type: expected "${fixture.expect.origin_authority_type}", got "${ctx.origin_authority_type}"`,
    );
  }

  if (ctx.apostille_path !== fixture.expect.apostille_path) {
    failures.push(
      `apostille_path: expected "${fixture.expect.apostille_path}", got "${ctx.apostille_path}"`,
    );
  }

  if (
    fixture.expect.origin_state !== undefined &&
    ctx.origin_state !== fixture.expect.origin_state
  ) {
    failures.push(
      `origin_state: expected "${fixture.expect.origin_state}", got "${ctx.origin_state}"`,
    );
  }

  if (
    fixture.expect.requires_operator_review !== undefined &&
    ctx.requires_operator_review !== fixture.expect.requires_operator_review
  ) {
    failures.push(
      `requires_operator_review: expected ${fixture.expect.requires_operator_review}, got ${ctx.requires_operator_review}`,
    );
  }

  if (fixture.expect.hasWarning) {
    const found = ctx.warnings.some((w) =>
      w.toLowerCase().includes(fixture.expect.hasWarning!.toLowerCase()),
    );
    if (!found) {
      failures.push(
        `expected warning containing "${fixture.expect.hasWarning}" but got: [${ctx.warnings.join(" | ")}]`,
      );
    }
  }

  return { name: fixture.name, pass: failures.length === 0, failures, ctx };
}

export function validateRoutingNormalizerFixtures(): string {
  const results = FIXTURES.map(runFixture);
  const lines: string[] = ["=== Routing Normalizer Fixture Results ===", ""];

  for (const r of results) {
    const status = r.pass ? "PASS" : "FAIL";
    lines.push(`[${status}] ${r.name}`);
    if (!r.pass) {
      for (const f of r.failures) {
        lines.push(`       ✗ ${f}`);
      }
    }
  }

  const passCount = results.filter((r) => r.pass).length;
  lines.push("");
  lines.push(`Result: ${passCount}/${results.length} passed`);

  return lines.join("\n");
}

/** Run and print inline — useful for manual verification */
export function runAndPrint(): void {
  // eslint-disable-next-line no-console
  console.log(validateRoutingNormalizerFixtures());
}
