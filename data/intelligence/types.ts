export interface Country {
  id: string          // slug: "italy", "spain", etc
  name: string
  isoCode: string
  corridorType: "hague" | "consular"
  hagueSince?: number
  counselTerm?: string  // e.g. "Notaio", "Studio Legale"
  requiresWitnesses: boolean
  witnessCount?: number
}

export interface DocumentType {
  id: string          // slug: "power-of-attorney", "birth-certificate"
  name: string
  category: "identity" | "legal" | "corporate" | "real-estate" | "estate" | "immigration" | "academic"
  commonlyApostilled: boolean
  floridaSourceAuthority?: string   // e.g. "Florida Department of State"
}

export interface RejectionTrigger {
  trigger: string
  description: string
  severity: "fatal" | "correctable"
}

export interface Workflow {
  id: string
  countryId: string
  documentId: string
  routeType: "Hague Convention" | "Consular Authentication"
  notarizationRequired: boolean
  notarizationType?: "mobile" | "ron" | "either"
  witnessRequired: boolean
  witnessCount?: number
  translationRequired: boolean
  translationLanguage?: string
  certifiedTranslationRequired?: boolean
  apostilleRequired: boolean
  apostilleAuthority?: string
  consularLegalizationRequired?: boolean
  estimatedTimeline: string         // e.g. "7–14 Business Days"
  executionPath: string[]           // ordered steps
  rejectionTriggers: RejectionTrigger[]
  specialInstructions?: string
  // versioning
  validFrom: string                 // ISO date string "2025-01-01"
  validTo?: string                  // undefined = currently valid
  lastReviewed: string              // ISO date string
  sourceReference?: string
}
