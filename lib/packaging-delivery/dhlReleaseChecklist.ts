import type { DhlReleaseStep } from "./types";

export const DHL_RELEASE_CHECKLIST: readonly DhlReleaseStep[] = [
  { id: "ron-completed", order: 1, label: "RON completed", status: "locked", owner: "operator", notes: "Execution must be complete before apostille processing." },
  { id: "apostille-received", order: 2, label: "Apostille received", status: "locked", owner: "operator", notes: "Original apostille must be in hand before assembly." },
  { id: "slip-prepared", order: 3, label: "Slip printed and handwritten", status: "locked", owner: "operator", notes: "A6 slip printed at 100 percent scale." },
  { id: "packet-assembled", order: 4, label: "Packet assembled in correct order", status: "locked", owner: "operator", notes: "Gold slip, apostille original, underlying notarized document, optional copy set if requested." },
  { id: "folder-inserted", order: 5, label: "Insert into folder if used", status: "operator_review", owner: "operator", notes: "Use 9x12 matte black presentation folder when selected." },
  { id: "dhl-envelope", order: 6, label: "Insert into DHL Express document envelope", status: "locked", owner: "operator", notes: "No fake live tracking language." },
  { id: "drop-before-cutoff", order: 7, label: "Drop before cutoff", status: "locked", owner: "operator", notes: "Document cutoff time in operator notes before release confirmation." }
];
export function getDhlReleaseChecklist() { return DHL_RELEASE_CHECKLIST; }
export function getDhlReleaseWarning() { return "No final release until paid or paid_comped, zero balance, custody clearance, and operator release confirmation are satisfied."; }
