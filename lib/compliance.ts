// COMPLIANCE ENGINE — Deterministic rules for all jurisdictions
// Source: Trust Engine™ + Milano Seal OS canonical rules

export interface ComplianceInput {
  country: string
  signerLocation?: string
  documentType: string
  executionType: 'ron' | 'mobile'
  destinationCountry?: string
}

export interface ComplianceResult {
  jurisdiction: string
  jurisdiction_type: string
  ron_allowed: boolean
  apostille_required: boolean
  witnesses_required: boolean
  witness_count: number
  hague_member: boolean
  restrictions: string[]
  notes: string
  execution_path: string[]
  requires_review: boolean
  isValid: boolean
  warnings: string[]
  recommendations: string[]
}

// ── DETERMINISTIC COMPLIANCE MAP ──────────────────────────────
const COMPLIANCE_MAP: Record<string, Omit<ComplianceResult, 'isValid'|'warnings'|'recommendations'>> = {
  florida: {
    jurisdiction: 'florida', jurisdiction_type: 'state',
    ron_allowed: true, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: false,
    restrictions: [],
    notes: 'Florida RON fully authorized. No witnesses required for standard documents. Must use approved platform.',
    execution_path: ['RON via approved platform', 'Electronic seal applied', 'Certificate of notarization issued'],
  },
  virginia: {
    jurisdiction: 'virginia', jurisdiction_type: 'state',
    ron_allowed: true, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: false,
    restrictions: ['Requires identity proofing', 'Approved platform required'],
    notes: 'RON authorized under Va. Code § 47.1-6.1. Requires credential analysis and AV communication.',
    execution_path: ['Identity verification required', 'RON session via approved platform', 'Notarial certificate issued'],
  },
  colorado: {
    jurisdiction: 'colorado', jurisdiction_type: 'state',
    ron_allowed: false, apostille_required: false, witnesses_required: true,
    witness_count: 2, hague_member: false, requires_review: false,
    restrictions: ['RON not broadly available', 'Two witnesses required for deeds', 'In-person preferred'],
    notes: 'Colorado has limited RON. Most matters require in-person or mobile notary.',
    execution_path: ['In-person or mobile notary', 'Two witnesses for deeds', 'Traditional notarial certificate'],
  },

  texas: {
    jurisdiction: 'texas', jurisdiction_type: 'state',
    ron_allowed: true, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: false,
    restrictions: [
      'RON requires identity proofing via credential analysis',
      'Approved RON platform required (Notarize, DocVerify, etc.)',
      'International use requires apostille via Texas SOS — not handled by Milano Seal directly',
    ],
    notes: 'Texas RON fully authorized under TX Govt Code § 406.101. No witnesses required for standard notarizations. For documents intended for international use, apostille must be obtained through the Texas Secretary of State.',
    execution_path: [
      'RON session via approved platform (FL or TX commission)',
      'Identity credential analysis + AV recording required',
      'Electronic notarial certificate issued',
      'For international use: Texas SOS apostille coordination',
    ],
  },
  'new york': {
    jurisdiction: 'new york', jurisdiction_type: 'state',
    ron_allowed: true, apostille_required: false, witnesses_required: true,
    witness_count: 1, hague_member: false, requires_review: false,
    restrictions: [
      'One witness required for certain documents (wills, powers of attorney)',
      'RON platform must be registered with NY SOS',
      'NY POA requires specific statutory language — review required',
    ],
    notes: 'New York RON authorized under NY Real Property Law § 298-e. POA documents must comply with NY GOL § 5-1501 statutory form. One witness required for POAs and wills. Apostilles issued by NY Department of State, Division of Licensing Services.',
    execution_path: [
      'RON session via NY-registered platform',
      'One witness required for POAs and wills',
      'NY statutory POA language verified before execution',
      'Notarial certificate issued with electronic seal',
      'For international use: NY Dept of State apostille',
    ],
  },
  california: {
    jurisdiction: 'california', jurisdiction_type: 'state',
    ron_allowed: false, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: false,
    restrictions: [
      'RON NOT permitted — California prohibits remote online notarization',
      'In-person execution required for all notarizations',
      'Notary must physically be present with the signer',
      'California notary journal entry mandatory',
    ],
    notes: 'California does not authorize RON as of current statute. All notarizations require in-person presence. Milano Seal can coordinate mobile notary in California or the signer can appear before any FL-commissioned notary in person. Apostilles issued by California Secretary of State.',
    execution_path: [
      'In-person or mobile notary required (no RON)',
      'Signer must be physically present with commissioned notary',
      'California notary journal entry completed',
      'Notarial certificate with wet ink seal',
      'For international use: California SOS apostille',
    ],
  },
  georgia: {
    jurisdiction: 'georgia', jurisdiction_type: 'state',
    ron_allowed: true, apostille_required: false, witnesses_required: true,
    witness_count: 1, hague_member: false, requires_review: false,
    restrictions: [
      'One witness required for deeds and real estate instruments',
      'RON requires approved platform and identity verification',
      'Unofficial witnesses cannot be notary or attorney on same document',
    ],
    notes: "Georgia RON authorized under O.C.G.A. § 45-17-1. One witness required for deeds and real estate instruments. Georgia is a high-volume state for international matters due to large immigrant communities. Apostilles issued by Georgia Superior Court Clerks' Cooperative Authority or SOS.",
    execution_path: [
      'RON via approved platform or mobile notary',
      'One witness present for deeds and real estate',
      'Identity verification with credential analysis',
      'Georgia notarial certificate issued',
      'For international use: Georgia SOS apostille',
    ],
  },
  nevada: {
    jurisdiction: 'nevada', jurisdiction_type: 'state',
    ron_allowed: true, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: false,
    restrictions: [
      'RON requires two-way AV communication',
      'Notary must be commissioned in Nevada or Florida for cross-state RON',
      'Electronic records must be tamper-evident',
    ],
    notes: 'Nevada has broad RON authorization under NRS 240.1925. No witness requirement for standard notarizations. Nevada is a favorable jurisdiction for corporate documents and business authority matters due to Nevada LLC/Corp law. Apostilles issued by Nevada Secretary of State.',
    execution_path: [
      'RON session with two-way AV communication',
      'Identity verification and credential analysis',
      'Tamper-evident electronic notarial certificate',
      'For international use: Nevada SOS apostille',
    ],
  },
  washington: {
    jurisdiction: 'washington', jurisdiction_type: 'state',
    ron_allowed: true, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: false,
    restrictions: [
      'RON requires approved technology platform',
      'Must maintain audio-visual recording for 10 years',
      'Electronic journal entry required',
    ],
    notes: 'Washington RON authorized under RCW 42.45.300. Notary must maintain AV recording for 10 years. Strong demand for international matters from Asian Pacific community (Japan, Philippines, South Korea). Apostilles issued by Washington Secretary of State.',
    execution_path: [
      'RON via approved technology platform',
      'Audio-visual session recorded and retained 10 years',
      'Electronic journal entry completed',
      'Washington notarial certificate issued',
      'For international use: Washington SOS apostille',
    ],
  },
  pennsylvania: {
    jurisdiction: 'pennsylvania', jurisdiction_type: 'state',
    ron_allowed: true, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: false,
    restrictions: [
      'RON requires identity proofing — credential analysis or KBA',
      'Must use Pennsylvania-registered RON provider',
      'AV communication must be live and synchronous',
    ],
    notes: 'Pennsylvania RON authorized under 57 Pa.C.S. § 316. Identity proofing via credential analysis or knowledge-based authentication required. High volume of Italian-American and Eastern European community driving international matters. Apostilles issued by Pennsylvania Department of State.',
    execution_path: [
      'RON via PA-registered provider',
      'Credential analysis or KBA identity proofing',
      'Live synchronous AV communication required',
      'Pennsylvania notarial certificate with electronic seal',
      'For international use: PA Department of State apostille',
    ],
  },  italy: {
    jurisdiction: 'italy', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: true, witnesses_required: true,
    witness_count: 2, hague_member: true, requires_review: false,
    restrictions: ['RON not accepted for apostille chain', 'Traditional notarization required', 'Italian translation may be required'],
    notes: 'Hague Convention member. All US docs for use in Italy require apostille. Two witnesses for property/estate.',
    execution_path: ['Traditional notarization', 'Apostille via FL Dept of State', 'Certified translation if required', 'International delivery'],
  },
  greece: {
    jurisdiction: 'greece', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: true, witnesses_required: false,
    witness_count: 0, hague_member: true, requires_review: false,
    restrictions: ['RON generally not accepted', 'Apostille mandatory', 'Greek translation may be required'],
    notes: 'Hague Convention member. All US-origin documents require apostille before Greek authority submission.',
    execution_path: ['Notarization', 'Apostille via FL Dept of State', 'Translation if required', 'Courier to Greece'],
  },
  spain: {
    jurisdiction: 'spain', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: true, witnesses_required: false,
    witness_count: 0, hague_member: true, requires_review: false,
    restrictions: ['Spanish translation required for official submissions'],
    notes: 'Hague Convention member. US docs require apostille. Certified Spanish translation typically required.',
    execution_path: ['Notarization', 'Apostille coordination', 'Certified translation', 'International delivery'],
  },
  portugal: {
    jurisdiction: 'portugal', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: true, witnesses_required: false,
    witness_count: 0, hague_member: true, requires_review: false,
    restrictions: ['Portuguese translation required', 'High D8 visa / residency volume'],
    notes: 'Hague Convention member. High volume of D8 and NHR residency applications.',
    execution_path: ['Notarization', 'Apostille', 'Translation if required', 'Delivery'],
  },
  france: {
    jurisdiction: 'france', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: true, witnesses_required: false,
    witness_count: 0, hague_member: true, requires_review: false,
    restrictions: ['French translation typically required', 'Talent Passport / property demand'],
    notes: 'Hague Convention member. French translation typically required for official filings.',
    execution_path: ['Notarization', 'Apostille via FL Dept of State', 'French translation', 'International delivery'],
  },
  germany: {
    jurisdiction: 'germany', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: true, witnesses_required: false,
    witness_count: 0, hague_member: true, requires_review: false,
    restrictions: ['German translation required', 'Ancestry visa demand', 'Property + corporate matters'],
    notes: 'Hague Convention member. German translation required. Ancestry visa and property high volume.',
    execution_path: ['Notarization', 'Apostille via FL Dept of State', 'German translation', 'International delivery'],
  },
  brazil: {
    jurisdiction: 'brazil', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: true, witnesses_required: false,
    witness_count: 0, hague_member: true, requires_review: false,
    restrictions: ['Portuguese translation required', 'Hague member since 2016'],
    notes: 'Brazil joined Hague Convention 2016. Portuguese translation required. Corporate + citizenship demand.',
    execution_path: ['Notarization', 'Apostille via FL Dept of State', 'Portuguese translation', 'Delivery'],
  },
  mexico: {
    jurisdiction: 'mexico', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: false,
    restrictions: ['NOT Hague Convention member', 'Full legalization chain required', 'Consular legalization via Mexican Consulate'],
    notes: 'Mexico is NOT a Hague Convention member. Full legalization chain through Mexican Consulate required.',
    execution_path: ['Notarization', 'Secretary of State authentication', 'Consular legalization', 'Delivery'],
  },
  'united states': {
    jurisdiction: 'united states', jurisdiction_type: 'country',
    ron_allowed: true, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: false,
    restrictions: [],
    notes: 'Domestic US matters. No apostille required. RON accepted per state authorization.',
    execution_path: ['RON or mobile notarization', 'Certificate issued', 'Digital or physical delivery'],
  },
  'united kingdom': {
    jurisdiction: 'united kingdom', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: true, witnesses_required: false,
    witness_count: 0, hague_member: true, requires_review: false,
    restrictions: ['Post-Brexit Hague member as of 2024'],
    notes: 'UK joined Hague Convention 2024. Translation may be required for some matters.',
    execution_path: ['Notarization', 'Apostille via FL Dept of State', 'Delivery'],
  },
  'united arab emirates': {
    jurisdiction: 'united arab emirates', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: false, witnesses_required: false,
    witness_count: 0, hague_member: false, requires_review: true,
    restrictions: ['NOT Hague Convention member', 'Full authentication chain required', 'UAE Embassy/Consulate legalization'],
    notes: 'UAE requires full chain authentication. Premium fees justified. Complex coordination.',
    execution_path: ['Notarization', 'FL Dept of State authentication', 'UAE Embassy legalization', 'Delivery'],
  },
  canada: {
    jurisdiction: 'canada', jurisdiction_type: 'country',
    ron_allowed: true, apostille_required: true, witnesses_required: false,
    witness_count: 0, hague_member: true, requires_review: false,
    restrictions: [],
    notes: 'Hague Convention member. English accepted. Relatively straightforward process.',
    execution_path: ['RON or notarization', 'Apostille if required', 'Delivery'],
  },
  argentina: {
    jurisdiction: 'argentina', jurisdiction_type: 'country',
    ron_allowed: false, apostille_required: true, witnesses_required: false,
    witness_count: 0, hague_member: true, requires_review: false,
    restrictions: ['Spanish translation required', 'Complex civil document requirements'],
    notes: 'Hague Convention member. Dual nationality and citizenship matters common.',
    execution_path: ['Notarization', 'Apostille via FL Dept of State', 'Spanish translation', 'Delivery'],
  },
}

function formatResult(raw: Omit<ComplianceResult,'isValid'|'warnings'|'recommendations'>, docType: string): ComplianceResult {
  const warnings: string[] = []
  const recommendations: string[] = []

  if (raw.restrictions.length > 0) {
    recommendations.push(`${raw.jurisdiction} has specific requirements. Our team will ensure compliance.`)
  }

  const criticalDocs = ['power of attorney', 'real estate', 'will', 'trust']
  if (criticalDocs.some(d => docType.toLowerCase().includes(d))) {
    recommendations.push('This document type may require additional witnesses or specific formatting.')
  }

  return {
    ...raw,
    isValid: true,
    warnings,
    recommendations,
  }
}

export function validateCompliance(input: ComplianceInput): ComplianceResult {
  const key = (input.country || '').trim().toLowerCase()
    .replace('usa', 'united states')
    .replace('us', 'united states')
    .replace('uk', 'united kingdom')
    .replace('uae', 'united arab emirates')

  const rule = COMPLIANCE_MAP[key]
  if (rule) return formatResult(rule, input.documentType)

  // Unknown jurisdiction — safe defaults, flag for review
  return {
    jurisdiction: key,
    jurisdiction_type: 'unknown',
    ron_allowed: false,
    apostille_required: false,
    witnesses_required: false,
    witness_count: 0,
    hague_member: false,
    restrictions: ['Compliance data not available — manual review required'],
    notes: `No compliance data on file for "${input.country}". This matter requires manual compliance review.`,
    execution_path: ['Manual compliance review required', 'Contact for jurisdiction-specific requirements'],
    requires_review: true,
    isValid: true,
    warnings: [`${input.country} requires manual compliance review`],
    recommendations: ['Submit intake and our team will confirm execution path'],
  }
}

export function resolveJurisdiction(params: { destination_country?: string; origin_state?: string }) {
  const country = (params.destination_country || '').trim().toLowerCase()
  const state   = (params.origin_state || 'florida').trim().toLowerCase()
  if (country && country !== 'united states' && country !== 'us' && country !== '') {
    return { primary: country, secondary: state, type: 'international' as const }
  }
  return { primary: state, secondary: null, type: 'domestic' as const }
}

export function classifyServiceType(country: string, documentType: string, needsApostille: boolean): string {
  const isIntl = country !== 'USA' && country !== 'United States'
  if (isIntl && needsApostille) return 'international'
  if (needsApostille) return 'apostille'
  return 'ron'
}
