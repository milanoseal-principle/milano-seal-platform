import type { SmartIntakeFactor } from "./types";

export const SMART_INTAKE_FACTORS: SmartIntakeFactor[] = [
  { id: "destination_country", label: "Destination Country", purpose: "Determines Hague, non-Hague, embassy, consular, or special routing needs." },
  { id: "pathway", label: "Hague or Non-Hague Pathway", purpose: "Classifies international authentication workflow." },
  { id: "document_category", label: "Document Category", purpose: "Identifies execution requirements and potential downstream authority needs." },
  { id: "jurisdiction", label: "Jurisdiction", purpose: "Tracks document origin, signer location, and receiving authority." },
  { id: "signer_location", label: "Signer Location", purpose: "Determines mobile, RON, or other coordination path." },
  { id: "signer_count", label: "Number of Signers", purpose: "Supports scheduling, pricing, and identity workflow." },
  { id: "witness_requirements", label: "Witness Requirements", purpose: "Determines if independent witnesses or remote witness coordination are needed." },
  { id: "ron_eligibility", label: "RON Eligibility", purpose: "Reviews whether Remote Online Notarization may be appropriate where authorized by law." },
  { id: "translation_requirements", label: "Translation Requirements", purpose: "Identifies whether translation or interpreter coordination may be needed." },
  { id: "legalization_requirements", label: "Embassy or Consular Legalization Requirements", purpose: "Flags non-Hague or special handling needs." },
  { id: "courier_requirements", label: "Courier Requirements", purpose: "Determines secure delivery, tracking, and release path." },
  { id: "urgency", label: "Project Urgency", purpose: "Classifies standard, priority, or executive execution lane." },
  { id: "dependencies", label: "Administrative Dependencies", purpose: "Identifies blockers before scheduling." }
];

export const SMART_INTAKE_OUTCOME = "The outcome determines the appropriate execution tier, coordination workflow, estimated timeline, and pricing methodology before scheduling.";
