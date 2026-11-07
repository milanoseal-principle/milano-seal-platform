import { isDomesticDestination } from "./reviewReadiness";
import { isHagueMember } from "./hagueMembers";

export interface ExecutionPathInput {
  country: string;
  apostilleRequired?: boolean;
  translationNeeded?: boolean;
  ronPossible?: boolean;
}

export interface ExecutionPathResult {
  steps: string[];
  hagueMember: boolean;
  reasoning: string;
}

const ITALY_BASE = [
  "RON Review",
  "Florida Apostille",
  "Translation Review",
  "DHL International Release",
];

const SPAIN_BASE = [
  "Notarization",
  "Apostille",
  "Spanish Translation",
  "International Release",
];

const GENERIC_HAGUE_BASE = [
  "Notarization",
  "State Apostille",
  "International Release",
];

const NON_HAGUE_BASE = [
  "Notarization",
  "State Authentication",
  "Consular Legalization",
  "International Release",
];

export function buildExecutionPath(
  input: ExecutionPathInput,
): ExecutionPathResult {
  const country = (input.country || "").trim();
  // Resolve domestic use before the non-Hague branch. A routing preview never
  // confirms legal requirements or an execution method.
  if (isDomesticDestination(country)) {
    return {
      steps: ["Document & Execution Review", ...(input.apostilleRequired ? ["Authentication Review"] : []), "Domestic Release"],
      hagueMember: isHagueMember(country),
      reasoning: "Domestic use: Milano reviews execution and any separately requested authentication before private quoting.",
    };
  }
  const hagueMember = isHagueMember(country);
  const apostilleRequired = input.apostilleRequired ?? hagueMember;
  const translationNeeded = Boolean(input.translationNeeded);

  if (matchesCountry(country, "Italy")) {
    const steps = [...ITALY_BASE];
    if (!translationNeeded) {
    }
    if (input.ronPossible === false) {
      steps[0] = "Traditional Notarization";
    }
    return {
      steps,
      hagueMember: true,
      reasoning:
        "Italy is a Hague Convention member. Apostille issued by Florida Department of State; translation reviewed before international release.",
    };
  }

  if (matchesCountry(country, "Spain")) {
    const steps = [...SPAIN_BASE];
    if (!translationNeeded) {
    }
    return {
      steps,
      hagueMember: true,
      reasoning:
        "Spain is a Hague Convention member. Apostille issued by the originating jurisdiction; Spanish translation typically required before release.",
    };
  }

  if (hagueMember && apostilleRequired) {
    const steps = [...GENERIC_HAGUE_BASE];
    if (translationNeeded) {
      steps.splice(2, 0, "Translation Review");
    }
    return {
      steps,
      hagueMember: true,
      reasoning: `${country || "Destination"} is a Hague Convention member. A single apostille from the originating U.S. jurisdiction is sufficient for international acceptance.`,
    };
  }

  if (country && !hagueMember) {
    const steps = [...NON_HAGUE_BASE];
    if (translationNeeded) {
      steps.splice(3, 0, "Translation Review");
    }
    return {
      steps,
      hagueMember: false,
      reasoning: `${country} is not a Hague Convention member. The document must follow the full legalization chain ending at the destination's consular authority.`,
    };
  }

  if (!country || matchesCountry(country, "United States")) {
    return {
      steps: ["Notarization", "Domestic Release"],
      hagueMember: true,
      reasoning:
        "Domestic notarization only — no apostille or legalization required for U.S. use.",
    };
  }

  return {
    steps: GENERIC_HAGUE_BASE,
    hagueMember,
    reasoning: "Default international apostille flow.",
  };
}

function matchesCountry(input: string, target: string): boolean {
  return input.trim().toLowerCase() === target.toLowerCase();
}
