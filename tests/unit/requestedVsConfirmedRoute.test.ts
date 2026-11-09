import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { confirmedExecutionRoute, requestedServiceFromNotes, requestedServiceLabel } from "@/lib/intake/requestedVsConfirmed";

const notes = (intent: string) => [
  "Requested in-person location: Tampa",
  `[client_requested_service] ${intent} (context only; Milano review confirms execution, witness, apostille and route)`,
  `[intake_metadata:${JSON.stringify({ source: "web", client_requested_service: intent })}]`,
].join("\n");

test("requested service is read from persisted intake notes; unknown or absent stays unknown", () => {
  assert.equal(requestedServiceFromNotes(notes("ron")), "ron");
  assert.equal(requestedServiceFromNotes(notes("witness")), "witness");
  assert.equal(requestedServiceFromNotes(null), null);
  assert.equal(requestedServiceFromNotes("free text only"), null);
  assert.equal(requestedServiceFromNotes(notes("scheduled")), null, "non-vocabulary values are not trusted");
  assert.match(requestedServiceLabel(null), /Not captured/);
  assert.equal(requestedServiceLabel("ron"), "Online Notary / RON");
});

test("confirmed route comes only from execution truth, never from the requested service", () => {
  assert.deepEqual(confirmedExecutionRoute(null), { confirmed: false, label: "Awaiting Milano route review", parts: [] });
  assert.equal(confirmedExecutionRoute({ execution_method: "review_required" }).confirmed, false);
  assert.equal(confirmedExecutionRoute({ execution_method: "ron", notarial_act: "acknowledgment" }).label, "Remote online notarization (RON) + acknowledgment");
  assert.equal(
    confirmedExecutionRoute({ execution_method: "in_person", notarial_act: "jurat", authentication_requirement: "apostille" }, 2).label,
    "In-person execution + jurat + witness coordination (2) + apostille",
  );
  assert.equal(confirmedExecutionRoute({ execution_method: "forged_method" }).confirmed, false);
});

test("the two truths stay separate: a witness request with an RON route shows both, unmerged", () => {
  const requested = requestedServiceLabel(requestedServiceFromNotes(notes("witness")));
  const route = confirmedExecutionRoute({ execution_method: "ron" }).label;
  assert.equal(requested, "Witness Support");
  assert.equal(route, "Remote online notarization (RON)");
});

test("operator Matter page renders the panel from canonical fields (read-only)", () => {
  const page = readFileSync("app/dashboard/deals/[id]/page.tsx", "utf8");
  assert.match(page, /<RequestedVsConfirmedRoute notes=\{deal\.notes\} executionTruth=\{deal\.execution_truth \?\? null\} witnesses=\{deal\.witnesses\} \/>/);
  const component = readFileSync("components/dashboard/RequestedVsConfirmedRoute.tsx", "utf8");
  assert.doesNotMatch(component, /fetch\(|\.update\(|\.insert\(|onClick/);
});
