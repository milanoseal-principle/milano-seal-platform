import type { PrintSpec } from "./types";

export const PRINT_SPECS: readonly PrintSpec[] = [
  { id: "presentation-folder", label: "9x12 matte black presentation folder", dimensions: "9 x 12 inches", stock: "matte black presentation folder", scale: "100_percent", resizeAllowed: false, notes: "Centered official Milano Seal logo only; no auto-fit." },
  { id: "gold-slip", label: "A6 gold slip", dimensions: "4.1 x 5.8 inches", stock: "cream or soft white cardstock", scale: "100_percent", resizeAllowed: false, notes: "Handwritten greeting area and signature space; print at 100 percent scale." },
  { id: "future-foil", label: "Future foil upgrade", dimensions: "source SVG clean paths", stock: "gold foil layer", scale: "100_percent", resizeAllowed: false, notes: "Foil layer 100 percent black with emboss/deboss alignment; no production dependency now." }
];
export function getPrintSpecs() { return PRINT_SPECS; }
export function isResizeAllowed() { return false; }
