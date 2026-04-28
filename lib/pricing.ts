// INTERNAL PRICING ENGINE — DO NOT EXPOSE TO FRONTEND
export type ExecutionLane = 'RON_SIMPLE' | 'MOBILE_STANDARD' | 'Signature' | 'Priority' | 'Executive'

export interface PricingData {
  state?: string; apostille?: boolean; docs?: number; mobile?: boolean
  miles?: number; signers?: number; translation?: boolean
  urgency?: 'standard' | 'urgent'; multi_country?: boolean
  witnesses?: number; witness_type?: 'ron' | 'in_person'; after_hours?: boolean
}

export interface PricingResult {
  lane: ExecutionLane; total: number; base: number
  addons: { item: string; amount: number }[]; witness_total: number
}

function calcWitness(data: PricingData): number {
  if (!data.witnesses) return 0
  const base = data.witness_type === 'ron' ? 35 : 55
  return (base * data.witnesses) + (data.after_hours ? 37 : 0)
}

export function determineLaneAndPrice(data: PricingData): PricingResult {
  // Colorado simple RON
  if (data.state === 'Colorado' && data.apostille === false && (data.docs||1) === 1) {
    const wt = calcWitness(data)
    return { lane:'RON_SIMPLE', base:150, total:150+wt, addons:[], witness_total:wt }
  }
  // Florida mobile
  if (data.state === 'Florida' && data.mobile === true) {
    const mileage = (data.miles||0)*2; const base = 135+mileage; const wt = calcWitness(data)
    return { lane:'MOBILE_STANDARD', base, total:base+wt, addons:[], witness_total:wt }
  }
  let lane: ExecutionLane = 'Signature'; let base = 750
  if ((data.signers||1) > 1 || data.translation) { lane='Priority'; base=975 }
  if (data.urgency === 'urgent' || data.multi_country) { lane='Executive'; base=1850 }
  const wt = calcWitness(data)
  return { lane, base, total:base+wt, addons:[], witness_total:wt }
}
