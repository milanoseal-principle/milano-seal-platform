export type ShippoGateCode =
  | "PAYMENT_REQUIRED"
  | "EXECUTION_NOT_COMPLETE"
  | "APOSTILLE_NOT_COMPLETE"
  | "SHIPPING_ADDRESS_MISSING"
  | "DOCUMENT_NOT_RELEASE_READY"
  | "COMPLIANCE_BLOCKED"
  | "RELEASE_BLOCKED"
  | "COURIER_RATE_NOT_SELECTED";

export class ShippoGateError extends Error {
  constructor(public code: ShippoGateCode, message: string) {
    super(message);
    this.name = "ShippoGateError";
  }
}

const EXECUTION_CLEAR_STATES = new Set([
  "in_execution",
  "apostille",
  "apostille_processing",
  "shipped",
  "in_transit",
  "delivered",
  "completed",
]);

interface MatterGateInput {
  payment_status?: string | null;
  status?: string | null;
  apostille_required?: boolean;
  apostille_complete?: boolean;
  shipping_address?: unknown;
  selected_rate_id?: string | null;
  selected_shipment_id?: string | null;
  has_release_ready_document?: boolean;
  compliance_blocked?: boolean;
  release_blocked?: boolean;
}

export function assertCanCreateLabel(matter: MatterGateInput): void {
  const paymentConfirmed = [
    "payment_confirmed",
    "paid",
    "confirmed",
  ].includes(String(matter.payment_status ?? "").toLowerCase());

  if (!paymentConfirmed) {
    throw new ShippoGateError(
      "PAYMENT_REQUIRED",
      "Verified Wise settlement is required before a courier label can be purchased.",
    );
  }

  const status = String(matter.status ?? "").toLowerCase();
  if (!EXECUTION_CLEAR_STATES.has(status)) {
    throw new ShippoGateError(
      "EXECUTION_NOT_COMPLETE",
      "Matter must reach execution before a courier label can be created.",
    );
  }

  if (matter.apostille_required && matter.apostille_complete !== true) {
    throw new ShippoGateError(
      "APOSTILLE_NOT_COMPLETE",
      "Apostille return evidence is required before international release shipping.",
    );
  }

  if (!matter.shipping_address) {
    throw new ShippoGateError(
      "SHIPPING_ADDRESS_MISSING",
      "A shipping address is required before creating a label.",
    );
  }

  if (!matter.selected_rate_id || !matter.selected_shipment_id) {
    throw new ShippoGateError(
      "COURIER_RATE_NOT_SELECTED",
      "A persisted provider-backed courier rate is required before label creation.",
    );
  }

  if (matter.has_release_ready_document === false) {
    throw new ShippoGateError(
      "DOCUMENT_NOT_RELEASE_READY",
      "No release-ready document found in the Matter vault.",
    );
  }

  if (matter.compliance_blocked) {
    throw new ShippoGateError(
      "COMPLIANCE_BLOCKED",
      "Unresolved compliance blockers must be cleared before shipping.",
    );
  }

  if (matter.release_blocked) {
    throw new ShippoGateError(
      "RELEASE_BLOCKED",
      "Release is blocked — operator review required.",
    );
  }
}

interface ReleaseGateInput {
  label_created?: boolean;
  tracking_registered?: boolean;
  release_approved?: boolean;
}

export function assertCanReleaseShipment(matter: ReleaseGateInput): void {
  if (!matter.label_created) {
    throw new ShippoGateError(
      "RELEASE_BLOCKED",
      "No label has been created for this Matter.",
    );
  }
  if (!matter.tracking_registered) {
    throw new ShippoGateError(
      "RELEASE_BLOCKED",
      "Tracking must be registered before release.",
    );
  }
  if (!matter.release_approved) {
    throw new ShippoGateError(
      "RELEASE_BLOCKED",
      "Canonical release approval is required.",
    );
  }
}
