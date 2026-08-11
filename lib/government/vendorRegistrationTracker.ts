import type { VendorRegistrationStatus } from "./types";

export interface VendorRegistration {
  portal: string; // e.g. "Pinellas County OpenGov"
  agency: string;
  status: VendorRegistrationStatus;
  vendorId: string | null; // null until an actual ID is issued — never fabricate
  submittedDate: string | null;
  expirationDate: string | null;
  notes: string;
}

export const VENDOR_REGISTRATION_STATUSES: VendorRegistrationStatus[] = [
  "not_started",
  "in_progress",
  "submitted",
  "active",
  "expired",
];

// Honest empty state: a registration is NEVER active unless an operator has
// verified an issued vendor ID. This helper does not invent an active status.
export function summarizeVendorRegistrations(regs: VendorRegistration[]): {
  total: number;
  active: number;
  inProgress: number;
  submitted: number;
  expired: number;
  notStarted: number;
} {
  return {
    total: regs.length,
    active: regs.filter((r) => r.status === "active").length,
    inProgress: regs.filter((r) => r.status === "in_progress").length,
    submitted: regs.filter((r) => r.status === "submitted").length,
    expired: regs.filter((r) => r.status === "expired").length,
    notStarted: regs.filter((r) => r.status === "not_started").length,
  };
}

export function isRegistrationActive(reg: VendorRegistration): boolean {
  // Requires both an active status AND a verified vendor ID.
  return reg.status === "active" && !!reg.vendorId;
}
