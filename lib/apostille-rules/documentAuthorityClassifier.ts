import type { DocumentAuthority } from "./types";

export function classifyDocumentAuthority(documentType?: string): DocumentAuthority {
  if (!documentType || documentType.trim() === "") {
    return "unknown";
  }
  const t = documentType.trim().toLowerCase();

  if (t.includes("fbi") || t.includes("identity history")) return "fbi_background_check";
  if (t.includes("federal")) return "federal_agency_document";
  if (t.includes("birth") || t.includes("death") || t.includes("marriage") || t.includes("vital")) {
    if (t.includes("county")) return "county_vital_record";
    return "state_vital_record";
  }
  if (t.includes("court") || t.includes("judgment") || t.includes("divorce decree")) {
    return "court_document";
  }
  if (t.includes("diploma") || t.includes("transcript") || t.includes("school") || t.includes("degree")) {
    return "school_document";
  }
  if (t.includes("license") || t.includes("professional")) return "professional_license";
  if (t.includes("corporate") || t.includes("articles") || t.includes("incorporation") || t.includes("bylaw")) {
    return "corporate_document";
  }
  if (t.includes("customs") || t.includes("commercial invoice") || t.includes("certificate of origin")) {
    return "commercial_customs_document";
  }
  if (t.includes("translation")) return "translation_affidavit";
  if (t.includes("notar") || t.includes("affidavit") || t.includes("power of attorney")) {
    return "notarized_private_document";
  }
  return "unknown";
}
