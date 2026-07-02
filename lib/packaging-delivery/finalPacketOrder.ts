import type { FinalPacketItem } from "./types";

export const FINAL_PACKET_ORDER: readonly FinalPacketItem[] = [
  { order: 1, material: "gold_slip", label: "Gold slip", required: true, notes: "Top of stack with handwritten greeting area complete." },
  { order: 2, material: "apostille_original", label: "Apostille original", required: true, notes: "Original apostille received before packet assembly." },
  { order: 3, material: "underlying_notarized_document", label: "Underlying notarized document", required: true, notes: "Underlying executed document sits below the apostille original." },
  { order: 4, material: "optional_copy_set", label: "Optional copy set", required: false, notes: "Include only if requested or operator-approved." }
];
export function getFinalPacketOrder() { return FINAL_PACKET_ORDER; }
export function getFinalPacketOrderWarning() { return "Final packet order is locked. Do not resize, reorder, or add optional copies unless requested."; }
