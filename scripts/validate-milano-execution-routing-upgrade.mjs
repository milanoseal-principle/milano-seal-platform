import fs from "node:fs";
const files = ["lib/milano-seal/execution-routing.ts", "lib/milano-seal/execution-scoring.ts", "lib/milano-seal/execution-lifecycle.ts", "lib/milano-seal/execution-status-dictionary.ts", "lib/milano-seal/referral-attribution.ts", "lib/milano-seal/message-template-library.ts", "lib/milano-seal/sendoff-assets.ts", "lib/milano-seal/entity-boundaries.ts", "lib/milano-seal/proof-loop.ts", "lib/milano-seal/operator-qa.ts", "docs/MILANO_SEAL_ENTITY_BOUNDARY_RULES.md", "docs/MILANO_SEAL_EXECUTION_ROUTING_SPEC.md"];
const missing = files.filter((file) => !fs.existsSync(file));
if (missing.length) throw new Error(`Missing execution routing files: ${missing.join(", ")}`);
const all = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
for (const term of ["routeMilanoSealRequest", "detectMilanoSealServiceLane", "getExecutionRoutingAction", "getExecutionSlaMinutes", "detectMissingExecutionInformation", "buildExecutionAttribution", "scoreExecutionReadiness", "ready_to_schedule", "MILANO_SEAL_EXECUTION_LIFECYCLE", "MILANO_SEAL_EXECUTION_STATUS_DICTIONARY", "buildMilanoSealAttribution", "MILANO_SEAL_MESSAGE_TEMPLATES", "Your Milano Seal Document Request", "MILANO_SEAL_SENDOFF_BUNDLES", "MILANO_SEAL_ENTITY_BOUNDARY_RULES", "MILANO_SEAL_PROOF_LOOP", "runMilanoSealPreSendQA", "runMilanoSealPreExecutionQA"]) if (!all.includes(term)) throw new Error(`Missing execution routing term: ${term}`);
const templates = fs.readFileSync("lib/milano-seal/message-template-library.ts", "utf8");
if (templates.includes("we will win") || templates.includes("guaranteed acceptance")) throw new Error("Unsafe template language found");
console.log("Milano execution routing upgrade validation passed.");
