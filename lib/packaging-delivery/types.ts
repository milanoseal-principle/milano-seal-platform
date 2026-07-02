export type PackagingStepStatus = "locked" | "operator_review" | "blocked";
export type PackagingMaterial = "gold_slip" | "apostille_original" | "underlying_notarized_document" | "optional_copy_set" | "presentation_folder" | "dhl_document_envelope";
export interface FinalPacketItem { order: number; material: PackagingMaterial; label: string; required: boolean; notes: string; }
export interface PrintSpec { id: string; label: string; dimensions: string; stock: string; scale: "100_percent"; resizeAllowed: false; notes: string; }
export interface DhlReleaseStep { id: string; order: number; label: string; status: PackagingStepStatus; owner: "operator" | "founder_admin"; notes: string; }
export interface PackagingDeliveryModule { id: string; label: string; description: string; status: PackagingStepStatus; routeAnchor: string; }
