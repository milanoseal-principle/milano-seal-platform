/**
 * insuranceRegistry — insurance & certification readiness tracking. Insurance is
 * only "bound" with real binding evidence — never a broker letter or LOI.
 */

import type { ProcurementRecordMeta } from "@/lib/procurement/procurementSafety";
import { isInsuranceBound } from "@/lib/procurement/procurementSafety";

export type InsuranceType =
  | "Notary E&O"
  | "General Liability"
  | "Professional Liability"
  | "Cyber"
  | "Auto"
  | "Hired / Non-Owned Auto"
  | "Workers' Compensation"
  | "Umbrella"
  | "Crime / Fidelity"
  | "other";

export type InsuranceStatus =
  | "bound"
  | "broker_letter"
  | "pending"
  | "expired"
  | "not_required"
  | "unavailable"
  | "unverified";

export interface InsuranceRecord extends ProcurementRecordMeta {
  insuranceType: InsuranceType;
  status: InsuranceStatus;
  carrier: string | null;
  broker: string | null;
  policyNumber: string | null;
  limits: string | null;
  effectiveDate: string | null;
  expiration: string | null;
  evidenceFile: string | null;
  opportunityRequirement: string | null;
  gap: string | null;
}

export const INSURANCE_REGISTRY: InsuranceRecord[] = [];

/** Bound coverage only — safe to represent as satisfying a requirement. */
export function listBoundInsurance(): InsuranceRecord[] {
  return INSURANCE_REGISTRY.filter((r) => isInsuranceBound(r.status));
}

/** A requirement is satisfied only when matching coverage is genuinely bound. */
export function insuranceSatisfies(type: InsuranceType): boolean {
  return INSURANCE_REGISTRY.some((r) => r.insuranceType === type && isInsuranceBound(r.status));
}
