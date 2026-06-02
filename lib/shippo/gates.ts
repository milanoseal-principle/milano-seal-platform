export type ShippoGateCode =
  | "PAYMENT_REQUIRED"
  | "EXECUTION_NOT_COMPLETE"
  | "APOSTILLE_NOT_COMPLETE"
  | "SHIPPING_ADDRESS_MISSING"
  | "DOCUMENT_NOT_RELEASE_READY"
  | "COMPLIANCE_BLOCKED"
  | "RELEASE_BLOCKED";

export class ShippoGateError extends Error {
  constructor(public code: ShippoGateCode, message: string) {
    super(message);
    this.name = "ShippoGateError";
  }
}

const EXECUTION_STATES = new Set([
  "in_execution",
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
]);

const APOSTILLE_CLEAR_STATES = new Set([
  "in_transit",
  "delivered",
  "completed",
]);

interface MatterGateInput {
  payment_status?: string | null;
  paid_and_released?: boolean;
  matter_status?: string | null;
  apostille_required?: boolean;
  shipping_address?: unknown;
  has_release_ready_document?: boolean;
  compliance_blocked?: boolean;
  release_blocked?: boolean;
}

export function assertCanCreateLabel(matter: MatterGateInput): void {
  const paymentConfirmed =
    matter.payment_status === "payment_confirmed" ||
    matter.payment_status === "paid" ||
    matter.paid_and_released === true;

  if (!paymentConfirmed) {
    throw new ShippoGateError(
      "PAYMENT_REQUIRED",
      "Payment must be confirmed before a courier label can be created."
    );
  }

  const status = (matter.matter_status ?? "").toLowerCase();

  if (!EXECUTION_STATES.has(status)) {
    throw new ShippoGateError(
      "EXECUTION_NOT_COMPLETE",
      "Matter must reach execution stage before label creation."
    );
  }

  if (matter.apostille_required && !APOSTILLE_CLEAR_STATES.has(status)) {
    throw new ShippoGateError(
      "APOSTILLE_NOT_COMPLETE",
      "Apostille processing must complete before label creation."
    );
  }

  if (!matter.shipping_address) {
    throw new ShippoGateError(
      "SHIPPING_ADDRESS_MISSING",
      "A shipping address is required before creating a label."
    );
  }

  if (matter.has_release_ready_document === false) {
    throw new ShippoGateError(
      "DOCUMENT_NOT_RELEASE_READY",
      "No release-ready document found in the vault."
    );
  }

  if (matter.compliance_blocked) {
    throw new ShippoGateError(
      "COMPLIANCE_BLOCKED",
      "Unresolved compliance blockers must be cleared before shipping."
    );
  }

  if (matter.release_blocked) {
    throw new ShippoGateError(
      "RELEASE_BLOCKED",
      "Release is blocked — operator review required."
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
    throw new ShippoGateError("RELEASE_BLOCKED", "No label has been created for this matter.");
  }
  if (!matter.tracking_registered) {
    throw new ShippoGateError("RELEASE_BLOCKED", "Tracking must be registered before release.");
  }
  if (!matter.release_approved) {
    throw new ShippoGateError("RELEASE_BLOCKED", "Operator release approval is required.");
  }
}
