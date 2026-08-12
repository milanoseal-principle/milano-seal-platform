import type { FounderCommandItem } from "./types";
export const DAILY_COMMAND_ITEMS: FounderCommandItem[] = [
  { id: "pending-quotes", label: "Pending quotes", lane: "Revenue", nextAction: "Review quote queue; do not display fake revenue." },
  { id: "gov-opps", label: "Government opportunities", lane: "Procurement Alignment", nextAction: "Verify source before response drafting." },
];
