// Internal add-on catalog for operator quoting. INTERNAL ONLY.
// Values are ranges the operator applies during quote preparation; they are
// never displayed on public pages.

import type { SmartPricingInput } from "./types";

export type AddOnValue = number | [number, number];

export const ADD_ON_RULES: Record<string, AddOnValue> = {
  additional_signer: 150,
  rush: [250, 500],
  weekend_after_hours: [250, 500],
  ron_witness: [50, 100],
  in_person_witness: [75, 150],
  translation_coordination: [150, 350],
  courier: [0, 0], // actual cost + protected margin, computed per matter
  state_federal_split_routing: [150, 350],
  complex_receiving_authority_review: [150, 500],
  founder_admin_exception_review: [250, 750],
  packet_rebuild_client_correction: [150, 350],
};

// Derive the internal add-ons that apply to a given intake. Returns a map of
// add-on key -> value (number or [min,max]). Never surfaced to the client.
export function deriveAddOns(input: SmartPricingInput): Record<string, AddOnValue> {
  const addOns: Record<string, AddOnValue> = {};
  const signerCount = input.signerCount ?? 1;

  if (signerCount > 1) {
    // one charge per additional signer beyond the first
    addOns.additional_signer = (signerCount - 1) * (ADD_ON_RULES.additional_signer as number);
  }
  if (input.urgency === "urgent" || input.urgency === "same_day") {
    addOns.rush = ADD_ON_RULES.rush;
  }
  if (input.translationNeeded === true) {
    addOns.translation_coordination = ADD_ON_RULES.translation_coordination;
  }
  if (input.courierNeeded || input.internationalShipping) {
    addOns.courier = ADD_ON_RULES.courier;
  }
  if (input.authenticationRequired && input.apostilleRequired) {
    addOns.state_federal_split_routing = ADD_ON_RULES.state_federal_split_routing;
  }
  if (input.receivingAuthorityType && input.receivingAuthorityType !== "standard") {
    addOns.complex_receiving_authority_review = ADD_ON_RULES.complex_receiving_authority_review;
  }
  return addOns;
}
