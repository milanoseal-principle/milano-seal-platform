/**
 * Hague Apostille Convention membership for the intake execution-path engine.
 *
 * Derived from the canonical HCCH registry (lib/treaty/hcchApostilleStatus.ts): a country counts
 * only once the Convention is in force for it on the given date, so a future-effective accession
 * (e.g. Thailand, 28 February 2027) is not treated as a member early. Membership alone never
 * decides a country pair; use evaluateApostilleRelationship for that.
 */
import { isApostilleConventionInForce } from "@/lib/treaty/apostilleRelationship";

/** Accepts a common English country name or ISO code. Returns false for empty/unknown input. */
export function isHagueMember(country: string, date?: string): boolean {
  return isApostilleConventionInForce(country, date);
}
