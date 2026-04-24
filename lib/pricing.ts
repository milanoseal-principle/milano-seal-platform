// INTERNAL PRICING ENGINE - DO NOT EXPOSE TO FRONTEND
import type { MatterData } from '@/lib/validation'

export type ExecutionTier = 'signature' | 'priority' | 'executive'
export type ServiceType = 'ron' | 'mobile' | 'apostille' | 'international'
export type AddOnType = 'apostille' | 'urgent' | 'expedited' | 'additional_signer'

// Base tier pricing (INTERNAL ONLY)
const TIER_PRICING: Record<ExecutionTier, number> = {
  signature: 750,
  priority: 975,
  executive: 1850,
}

// Add-on pricing (INTERNAL ONLY)
const ADDON_PRICING: Record<AddOnType, number> = {
  apostille: 250,
  urgent: 400,
  expedited: 200,
  additional_signer: 150,
}

export interface PricingInput {
  tier: ExecutionTier
  addOns: AddOnType[]
  additionalSigners?: number
}

export interface PricingResult {
  basePrice: number
  addOnsTotal: number
  total: number
  breakdown: {
    item: string
    amount: number
  }[]
}

export function calculatePricing(input: PricingInput): PricingResult {
  const basePrice = TIER_PRICING[input.tier]
  const breakdown: { item: string; amount: number }[] = [
    { item: `${capitalizeFirst(input.tier)} Execution`, amount: basePrice },
  ]
  
  let addOnsTotal = 0
  
  for (const addOn of input.addOns) {
    if (addOn === 'additional_signer' && input.additionalSigners) {
      const signerCost = ADDON_PRICING.additional_signer * input.additionalSigners
      addOnsTotal += signerCost
      breakdown.push({
        item: `Additional Signers (${input.additionalSigners})`,
        amount: signerCost,
      })
    } else {
      const addOnCost = ADDON_PRICING[addOn]
      addOnsTotal += addOnCost
      breakdown.push({
        item: formatAddOnName(addOn),
        amount: addOnCost,
      })
    }
  }
  
  return {
    basePrice,
    addOnsTotal,
    total: basePrice + addOnsTotal,
    breakdown,
  }
}

export interface LaneAndPriceResult extends PricingResult {
  lane: ExecutionTier
}

export function determineLaneAndPrice(data: MatterData): LaneAndPriceResult {
  // Determine execution tier from explicit field or infer from complexity
  let lane: ExecutionTier = 'signature'

  if (data.tier === 'executive' || data.urgency === 'executive') {
    lane = 'executive'
  } else if (
    data.tier === 'priority' ||
    data.urgency === 'urgent' ||
    data.multi_country ||
    data.translation ||
    (data.signers && data.signers > 2)
  ) {
    lane = 'priority'
  }

  // Build add-ons from matter data
  const addOns: AddOnType[] = []
  if (data.apostille) addOns.push('apostille')
  if (data.urgency === 'urgent') addOns.push('urgent')
  if (data.urgency === 'expedited') addOns.push('expedited')

  const additionalSigners = data.signers && data.signers > 1 ? data.signers - 1 : 0
  if (additionalSigners > 0) addOns.push('additional_signer')

  const pricing = calculatePricing({ tier: lane, addOns, additionalSigners })

  return { lane, ...pricing }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatAddOnName(addOn: AddOnType): string {
  const names: Record<AddOnType, string> = {
    apostille: 'Apostille Coordination',
    urgent: 'Urgent Processing',
    expedited: 'Expedited Handling',
    additional_signer: 'Additional Signer',
  }
  return names[addOn]
}
