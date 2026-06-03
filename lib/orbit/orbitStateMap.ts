export type OrbitState =
  | "idle"
  | "intake_received"
  | "under_review"
  | "awaiting_payment"
  | "scheduled"
  | "in_execution"
  | "apostille_processing"
  | "in_transit"
  | "delivered"
  | "completed";

export type OrbitMode =
  | "hero"
  | "dashboard"
  | "portal"
  | "trust"
  | "compact"
  | "release";

export interface OrbitStateConfig {
  label: string;
  sublabel: string;
  color: string;
  pulseSpeed: number; // seconds
  ringCount: number;
  glowIntensity: number; // 0–1
}

export const ORBIT_STATE_MAP: Record<OrbitState, OrbitStateConfig> = {
  idle: {
    label: "Ready",
    sublabel: "Awaiting Matter",
    color: "#C6A55A",
    pulseSpeed: 4,
    ringCount: 1,
    glowIntensity: 0.3,
  },
  intake_received: {
    label: "Intake Received",
    sublabel: "Matter Opened",
    color: "#C6A55A",
    pulseSpeed: 3.5,
    ringCount: 2,
    glowIntensity: 0.45,
  },
  under_review: {
    label: "Under Review",
    sublabel: "Operator Assessing",
    color: "#C6A55A",
    pulseSpeed: 3,
    ringCount: 2,
    glowIntensity: 0.5,
  },
  awaiting_payment: {
    label: "Awaiting Payment",
    sublabel: "Retainer Required",
    color: "#d4a843",
    pulseSpeed: 2.5,
    ringCount: 3,
    glowIntensity: 0.6,
  },
  scheduled: {
    label: "Scheduled",
    sublabel: "Execution Confirmed",
    color: "#C6A55A",
    pulseSpeed: 2.5,
    ringCount: 2,
    glowIntensity: 0.55,
  },
  in_execution: {
    label: "In Execution",
    sublabel: "Documents Active",
    color: "#3FA47A",
    pulseSpeed: 1.8,
    ringCount: 3,
    glowIntensity: 0.75,
  },
  apostille_processing: {
    label: "Apostille Processing",
    sublabel: "State Authentication",
    color: "#3FA47A",
    pulseSpeed: 2,
    ringCount: 3,
    glowIntensity: 0.7,
  },
  in_transit: {
    label: "In Transit",
    sublabel: "Documents Dispatched",
    color: "#4a9e6b",
    pulseSpeed: 2.2,
    ringCount: 2,
    glowIntensity: 0.6,
  },
  delivered: {
    label: "Delivered",
    sublabel: "Client Received",
    color: "#4a9e6b",
    pulseSpeed: 3,
    ringCount: 2,
    glowIntensity: 0.5,
  },
  completed: {
    label: "Completed",
    sublabel: "Matter Closed",
    color: "#3FA47A",
    pulseSpeed: 4,
    ringCount: 1,
    glowIntensity: 0.4,
  },
};
