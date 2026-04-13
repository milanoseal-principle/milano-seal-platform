// COMPLIANCE ENGINE - Core validation logic

export interface ComplianceInput {
  country: string
  signerLocation?: string
  documentType: string
  executionType: 'ron' | 'mobile'
  destinationCountry?: string
}

export interface ComplianceResult {
  isValid: boolean
  requiresApostille: boolean
  warnings: string[]
  errors: string[]
  recommendations: string[]
}

// Hague Convention member countries (simplified list)
const HAGUE_COUNTRIES = new Set([
  'Italy', 'Spain', 'Greece', 'Portugal', 'France', 'Germany',
  'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'United Kingdom',
  'Australia', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Japan',
  'South Korea', 'India', 'South Africa', 'New Zealand', 'Ireland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Czech Republic',
  'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Slovenia', 'Slovakia',
  'Estonia', 'Latvia', 'Lithuania', 'Malta', 'Cyprus', 'Luxembourg',
  'Monaco', 'San Marino', 'Andorra', 'Liechtenstein', 'Iceland',
])

// Countries that commonly require specific document handling
const STRICT_COUNTRIES = new Set([
  'Italy', 'Spain', 'Germany', 'France', 'Brazil',
])

export function validateCompliance(input: ComplianceInput): ComplianceResult {
  const warnings: string[] = []
  const errors: string[] = []
  const recommendations: string[] = []
  let requiresApostille = false
  
  // Core rule: Non-US destinations require apostille
  if (input.country !== 'USA' && input.country !== 'United States') {
    requiresApostille = true
    
    // Check if destination is Hague Convention member
    if (!HAGUE_COUNTRIES.has(input.country)) {
      warnings.push(
        `${input.country} may not be a Hague Convention member. Additional authentication may be required.`
      )
      recommendations.push(
        'Consider verifying acceptance requirements with the receiving authority.'
      )
    }
    
    // Strict country handling
    if (STRICT_COUNTRIES.has(input.country)) {
      recommendations.push(
        `${input.country} has specific document requirements. Our team will ensure compliance.`
      )
    }
  }
  
  // RON-specific validations
  if (input.executionType === 'ron') {
    // Check if signer location is provided for RON
    if (!input.signerLocation) {
      warnings.push(
        'Signer physical location must be verified during the RON session.'
      )
    }
    
    // Some countries may not accept RON
    if (STRICT_COUNTRIES.has(input.country)) {
      warnings.push(
        `${input.country} may have specific requirements for remotely notarized documents. We will verify acceptance.`
      )
    }
  }
  
  // Document type specific checks
  const criticalDocuments = ['power of attorney', 'real estate', 'will', 'trust']
  const lowerDocType = input.documentType.toLowerCase()
  
  if (criticalDocuments.some(doc => lowerDocType.includes(doc))) {
    recommendations.push(
      'This document type may require additional witnesses or specific formatting.'
    )
  }
  
  // Validate destination country if provided
  if (input.destinationCountry && input.destinationCountry !== input.country) {
    warnings.push(
      'Destination country differs from client country. Ensure document meets destination requirements.'
    )
  }
  
  return {
    isValid: errors.length === 0,
    requiresApostille,
    warnings,
    errors,
    recommendations,
  }
}

export function classifyServiceType(
  country: string,
  documentType: string,
  needsApostille: boolean
): 'ron' | 'mobile' | 'apostille' | 'international' {
  const isInternational = country !== 'USA' && country !== 'United States'
  
  if (isInternational && needsApostille) {
    return 'international'
  }
  
  if (needsApostille) {
    return 'apostille'
  }
  
  // Default to RON for most cases
  return 'ron'
}
