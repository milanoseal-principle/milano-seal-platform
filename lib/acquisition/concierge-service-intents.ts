export const CONCIERGE_SERVICE_INTENTS = [
  "ron",
  "domestic_execution",
  "apostille",
  "authentication",
  "international_execution",
  "foreign_counsel",
  "unsure",
] as const;

export type ConciergeServiceIntent = (typeof CONCIERGE_SERVICE_INTENTS)[number];