export interface ProofableDeal {
  id?: string;
  deal_id?: string | null;
  signed_by?: string | null;
  delivery_timestamp?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  destination_country?: string | null;
}

export interface SignatureProof {
  deal_id: string | null;
  signed_by: string | null;
  signed_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  destination_country: string | null;
  verified: boolean;
}

export function buildSignatureProof(deal: ProofableDeal): SignatureProof {
  return {
    deal_id: deal.deal_id ?? deal.id ?? null,
    signed_by: deal.signed_by ?? null,
    signed_at: deal.delivery_timestamp ?? null,
    tracking_number: deal.tracking_number ?? null,
    carrier: deal.carrier ?? null,
    destination_country: deal.destination_country ?? null,
    verified: !!(deal.signed_by && deal.delivery_timestamp),
  };
}
