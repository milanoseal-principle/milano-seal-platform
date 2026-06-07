export interface DocumentPacket {
  id: string;
  label: string;
  description: string;
  requiredDocuments: string[];
  signerRequirements: string[];
  certificateRequirements: string[];
  apostillePath: string;
  translationRequired: boolean;
  courierNote: string;
  releaseChecklist: string[];
}

const PACKETS: DocumentPacket[] = [
  { id: "italy_citizenship", label: "Italy Citizenship Packet", description: "Full document packet for Italian citizenship by descent.", requiredDocuments: ["Birth certificate (US)", "Marriage certificates (lineage)", "Death certificates if applicable", "Government-issued ID"], signerRequirements: ["Applicant present", "Codice fiscale required"], certificateRequirements: ["Acknowledgment or jurat per document type"], apostillePath: "Florida SOS apostille on each notarized document", translationRequired: true, courierNote: "Ship to Comune or Italian consulate per applicant's municipality.", releaseChecklist: ["All apostilles attached", "Translations certified", "Codice fiscale on file", "Operator release approved"] },
  { id: "fbi_apostille", label: "FBI Background Check Apostille", description: "Apostille for FBI Identity History Summary.", requiredDocuments: ["Original FBI Identity History Summary"], signerRequirements: ["No notarization required — federal document"], certificateRequirements: ["None — federal document, authenticated by US Dept of State"], apostillePath: "US Department of State (not Florida SOS)", translationRequired: false, courierNote: "Certified mail or tracked courier to destination.", releaseChecklist: ["US DOS apostille confirmed", "Operator release approved"] },
  { id: "florida_ron_affidavit_italy", label: "Florida RON Affidavit to Italy", description: "RON-executed affidavit for use in Italian proceedings.", requiredDocuments: ["Draft affidavit or POA"], signerRequirements: ["RON session required", "Payment confirmed before session"], certificateRequirements: ["Florida RON Jurat or Acknowledgment"], apostillePath: "Florida SOS apostille", translationRequired: true, courierNote: "DHL or FedEx International to receiving authority.", releaseChecklist: ["RON session completed", "Apostille attached", "Translation certified", "Operator release approved"] },
  { id: "uae_corporate_legalization", label: "UAE Corporate Legalization", description: "Document legalization chain for UAE corporate use.", requiredDocuments: ["Corporate resolution or POA", "Certificate of Good Standing"], signerRequirements: ["Authorized signatory", "Corporate seal if required"], certificateRequirements: ["Notarized corporate acknowledgment"], apostillePath: "Florida SOS apostille + UAE Embassy legalization", translationRequired: true, courierNote: "DHL International with declared value.", releaseChecklist: ["Florida apostille", "UAE Embassy legalization", "Arabic translation certified", "Operator release approved"] },
  { id: "mexico_poa", label: "Mexico Power of Attorney", description: "POA for use in Mexican legal or real estate matters.", requiredDocuments: ["POA document in Spanish or bilingual"], signerRequirements: ["Grantor present or RON eligible"], certificateRequirements: ["Acknowledgment with apostille"], apostillePath: "Florida SOS apostille", translationRequired: true, courierNote: "FedEx or DHL to Mexican notario.", releaseChecklist: ["Apostille attached", "Spanish version certified", "Operator release approved"] },
  { id: "yacht_sale", label: "Yacht Sale Document Packet", description: "Full execution packet for international yacht sale.", requiredDocuments: ["Bill of Sale", "USCG Certificate of Documentation", "Builder's Certificate if applicable"], signerRequirements: ["Seller + buyer or authorized agents"], certificateRequirements: ["Acknowledgment per document"], apostillePath: "Florida SOS apostille where required by flag state", translationRequired: false, courierNote: "Overnight courier with signature required.", releaseChecklist: ["All parties signed", "USCG docs included", "Apostille if required by flag", "Operator release approved"] },
  { id: "estate_probate_foreign", label: "Estate / Probate Foreign Use Packet", description: "Notarized estate documents for use in foreign jurisdiction.", requiredDocuments: ["Letters Testamentary or Administration", "Affidavit of Heirship if applicable", "Death certificate"], signerRequirements: ["Executor or administrator present"], certificateRequirements: ["Certified copy certification or acknowledgment"], apostillePath: "Florida SOS apostille or US DOS depending on document origin", translationRequired: true, courierNote: "Secure courier with tracking to foreign authority.", releaseChecklist: ["Apostille confirmed", "Translation certified", "Operator release approved"] },
  { id: "general_apostille", label: "General Apostille Packet", description: "Standard apostille packet for Florida-notarized documents.", requiredDocuments: ["Original notarized document"], signerRequirements: ["Notarized signature present"], certificateRequirements: ["Any Florida notarial certificate"], apostillePath: "Florida SOS apostille", translationRequired: false, courierNote: "Standard courier to destination.", releaseChecklist: ["Apostille attached", "Operator release approved"] },
];

export function getPacket(id: string): DocumentPacket | undefined {
  return PACKETS.find(p => p.id === id);
}

export function listPackets(): Array<{ id: string; label: string; description: string }> {
  return PACKETS.map(p => ({ id: p.id, label: p.label, description: p.description }));
}
