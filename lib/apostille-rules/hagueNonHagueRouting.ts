export const HAGUE_ROUTING_NOTE =
  "Destination classification is operator-reviewed and illustrative only — it is not an absolute determination. Final acceptance remains subject to the receiving authority.";

// Illustrative, operator-reviewed list — NOT absolute.
const ILLUSTRATIVE_HAGUE_LIST: string[] = [
  "italy",
  "france",
  "spain",
  "germany",
  "mexico",
  "brazil",
  "argentina",
  "netherlands",
  "portugal",
  "japan",
  "south korea",
  "australia",
];

export function classifyDestination(
  country?: string
): "hague" | "non_hague" | "unknown" {
  if (!country || country.trim() === "") {
    return "unknown";
  }
  const normalized = country.trim().toLowerCase();
  if (ILLUSTRATIVE_HAGUE_LIST.includes(normalized)) {
    return "hague";
  }
  // Not on the illustrative list — treat as operator-reviewed unknown rather than
  // asserting a non-Hague status outright.
  return "unknown";
}
