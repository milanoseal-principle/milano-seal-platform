// INTERNAL PRICING ENGINE - DO NOT EXPOSE TO FRONTEND

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
