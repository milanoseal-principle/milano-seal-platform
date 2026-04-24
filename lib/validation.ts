export interface MatterData {
  name?: string; name_match?: boolean; country?: string; apostille?: boolean
  page_count?: number; multi_signer?: boolean; sequence?: string
  signers?: number; state?: string; mobile?: boolean; docs?: number
  urgency?: string; multi_country?: boolean; translation?: boolean
  miles?: number; witnesses?: number; witness_type?: string; after_hours?: boolean
  phone?: string; files_uploaded?: boolean; delay_response?: boolean
  email?: string; document_type?: string; tier?: string; notes?: string
}

export function validateMatter(data: MatterData): true {
  if (data.name_match === false) throw new Error("NAME_MISMATCH_BLOCK")
  if (data.apostille === true && !data.country) throw new Error("APOSTILLE_COUNTRY_MISSING")
  if (data.multi_signer && data.sequence !== "US_FIRST") throw new Error("INVALID_SIGNER_SEQUENCE")
  return true
}

export function normalizeMatter(data: MatterData): MatterData {
  return {
    ...data,
    apostille:     typeof data.apostille === "boolean" ? data.apostille : false,
    mobile:        typeof data.mobile === "boolean" ? data.mobile : false,
    multi_country: typeof data.multi_country === "boolean" ? data.multi_country : false,
    translation:   typeof data.translation === "boolean" ? data.translation : false,
    signers:       typeof data.signers === "number" ? data.signers : 1,
    docs:          typeof data.docs === "number" ? data.docs : 1,
    page_count:    typeof data.page_count === "number" ? data.page_count : 1,
    witnesses:     typeof data.witnesses === "number" ? data.witnesses : 0,
    miles:         typeof data.miles === "number" ? data.miles : 0,
    name_match:    typeof data.name_match === "boolean" ? data.name_match : true,
  }
}

export function riskScore(data: MatterData): "HIGH_RISK" | "NORMAL" {
  let score = 0
  if (!data.phone) score += 1
  if (!data.files_uploaded) score += 1
  if (data.delay_response) score += 2
  return score >= 3 ? "HIGH_RISK" : "NORMAL"
}
