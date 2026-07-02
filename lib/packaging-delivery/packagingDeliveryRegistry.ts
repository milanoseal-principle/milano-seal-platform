import type { PackagingDeliveryModule } from "./types";
export const PACKAGING_DELIVERY_MODULES: readonly PackagingDeliveryModule[] = [
  { id: "final-packet-order", label: "Final Packet Order", description: "Gold slip, apostille original, underlying notarized document, optional copy set only if requested.", status: "locked", routeAnchor: "final-packet-order" },
  { id: "print-specs", label: "Print Specs", description: "9x12 folder and A6 slip print at 100 percent scale with no resize or auto-fit.", status: "locked", routeAnchor: "print-specs" },
  { id: "dhl-release-checklist", label: "DHL Release Checklist", description: "RON, apostille, slip, packet, folder, DHL envelope, and drop-before-cutoff sequence.", status: "locked", routeAnchor: "dhl-release-checklist" },
  { id: "packaging-safety", label: "Packaging Safety", description: "No release without payment, zero balance, custody clearance, and release approval.", status: "operator_review", routeAnchor: "packaging-safety" }
];
