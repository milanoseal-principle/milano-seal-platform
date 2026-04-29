// NLP intake parser — raw WhatsApp / IG / email text → structured data
// Confidence scoring + edge case handling

export interface ParsedIntake {
  client_name: string | null
  country: string | null
  document_type: string
  signer_count: number
  urgency: 'standard' | 'urgent' | 'expedited'
  apostille_needed: boolean
  missing: string[]
  confidence: number      // 0–1 overall confidence
  confidence_fields: Record<string, number>
}

const COUNTRIES: [string, string][] = [
  ['italy','Italy'],['spain','Spain'],['portugal','Portugal'],['mexico','Mexico'],
  ['brazil','Brazil'],['colombia','Colombia'],['france','France'],['germany','Germany'],
  ['greece','Greece'],['united kingdom','United Kingdom'],['uk','United Kingdom'],
  ['england','United Kingdom'],['canada','Canada'],['australia','Australia'],
  ['netherlands','Netherlands'],['switzerland','Switzerland'],['austria','Austria'],
  ['argentina','Argentina'],['japan','Japan'],['south korea','South Korea'],
  ['uae','United Arab Emirates'],['dubai','United Arab Emirates'],
  ['united arab emirates','United Arab Emirates'],
  ['india','India'],['new zealand','New Zealand'],['ireland','Ireland'],
  ['turkey','Turkey'],['israel','Israel'],['chile','Chile'],['peru','Peru'],
  ['venezuela','Venezuela'],['panama','Panama'],['costa rica','Costa Rica'],
  ['dominican republic','Dominican Republic'],['ecuador','Ecuador'],
]

const DOC_TYPES: [string, string, number][] = [
  // [keyword, label, confidence_boost]
  ['one and the same','One and the Same Affidavit', 1.0],
  ['name discrepancy','Name Discrepancy Affidavit', 1.0],
  ['power of attorney','Power of Attorney', 1.0],
  [' poa ','Power of Attorney', 0.9],
  ['affidavit','Affidavit', 0.9],
  ['birth certificate','Birth Certificate', 1.0],
  ['marriage certificate','Marriage Certificate', 1.0],
  ['divorce decree','Divorce Decree', 1.0],
  ['divorce','Divorce Decree', 0.8],
  ['death certificate','Death Certificate', 1.0],
  ['fbi','FBI Background Check', 0.95],
  ['background check','FBI Background Check', 0.85],
  ['corporate','Corporate Document', 0.85],
  ['articles of incorporation','Articles of Incorporation', 1.0],
  ['trust document','Trust Document', 1.0],
  ['will ','Will / Testament', 0.9],
  ['testament','Will / Testament', 0.9],
  ['deed','Deed / Title Document', 0.85],
  ['mortgage','Mortgage Document', 0.9],
  ['contract','Contract / Agreement', 0.8],
  ['agreement','Contract / Agreement', 0.8],
  ['passport','Passport / Identification Copy', 0.85],
  ['adoption','Adoption Document', 0.95],
  ['immigration','Immigration Document', 0.85],
  ['visa','Visa Support Document', 0.85],
]

function titleCase(str: string): string {
  return str.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

export function parseIntake(message: string): ParsedIntake {
  const raw = (message || '').trim()
  const lower = raw.toLowerCase()
  const missing: string[] = []
  const confidence_fields: Record<string, number> = {}

  // ── Name extraction ──────────────────────────────────────────
  let client_name: string | null = null
  let name_conf = 0
  const namePatterns: [RegExp, number][] = [
    [/(?:my name is|i am|name[:\s]+|client[:\s]+)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i, 0.95],
    [/^([A-Z][a-z]+\s+[A-Z][a-z]+)/m, 0.7],
    [/\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/, 0.6],
  ]
  for (const [pat, conf] of namePatterns) {
    const m = raw.match(pat)
    if (m && m[1]?.length > 3) {
      client_name = m[1].trim()
      name_conf = conf
      break
    }
  }
  if (!client_name) missing.push('client_name')
  confidence_fields.client_name = name_conf

  // ── Country extraction ───────────────────────────────────────
  let country: string | null = null
  let country_conf = 0
  const countryHints = /(?:for use in|destination[:\s]+|going to|apostille (?:for|to)|use in|document for)\s+([A-Za-z\s]{3,25})/gi
  const hintMatches = [...raw.matchAll(countryHints)]
  if (hintMatches.length > 0) {
    const hint = hintMatches[0][1].trim().toLowerCase()
    for (const [kw, label] of COUNTRIES) {
      if (hint.includes(kw)) { country = label; country_conf = 0.95; break }
    }
  }
  if (!country) {
    for (const [kw, label] of COUNTRIES) {
      if (lower.includes(kw)) { country = label; country_conf = 0.8; break }
    }
  }
  if (!country) missing.push('country')
  confidence_fields.country = country_conf

  // ── Document type ────────────────────────────────────────────
  let document_type = 'General Document'
  let doc_conf = 0.3
  for (const [kw, label, conf] of DOC_TYPES) {
    if (lower.includes(kw.trim())) { document_type = label; doc_conf = conf; break }
  }
  confidence_fields.document_type = doc_conf

  // ── Signer count ─────────────────────────────────────────────
  let signer_count = 1
  const signerMatch = lower.match(/(\d+)\s*(?:signers?|signatures?|people|persons?|parties)/)
  if (signerMatch) {
    signer_count = Math.min(parseInt(signerMatch[1]), 20)
    confidence_fields.signer_count = 0.95
  } else {
    if (/two signer|both parties|joint|husband.{1,10}wife|spouses/.test(lower)) { signer_count = 2 }
    confidence_fields.signer_count = signer_count > 1 ? 0.8 : 0.7
  }

  // ── Urgency ──────────────────────────────────────────────────
  let urgency: 'standard' | 'urgent' | 'expedited' = 'standard'
  if (/asap|urgent|emergency|rush|same.?day|today|immediately|tonight|tomorrow/.test(lower)) {
    urgency = 'urgent'
    confidence_fields.urgency = 0.95
  } else if (/expedit|as soon as possible|quickly|priority|soon/.test(lower)) {
    urgency = 'expedited'
    confidence_fields.urgency = 0.85
  } else {
    confidence_fields.urgency = 0.9
  }

  // ── Apostille ────────────────────────────────────────────────
  const apostille_explicit = /apostille|hague|authentication|legalization|authenticated/.test(lower)
  const apostille_country = country && !['United States','Canada','Australia'].includes(country)
  const apostille_needed = apostille_explicit || !!apostille_country
  confidence_fields.apostille = apostille_explicit ? 0.98 : (apostille_country ? 0.85 : 0.7)

  // ── Overall confidence ───────────────────────────────────────
  const field_weights = { client_name: 0.2, country: 0.25, document_type: 0.25, signer_count: 0.1, urgency: 0.1, apostille: 0.1 }
  const confidence = Object.entries(field_weights).reduce((sum, [field, weight]) => {
    return sum + (confidence_fields[field] || 0) * weight
  }, 0)

  return { client_name, country, document_type, signer_count, urgency, apostille_needed, missing, confidence: Math.round(confidence * 100) / 100, confidence_fields }
}
