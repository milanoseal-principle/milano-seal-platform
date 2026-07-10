import type { MatterOpsCheck } from "./types";

export const mandatoryQAChecks: MatterOpsCheck[] = [
  { key: "full_legal_name", label: "Full legal name", required: true, damianiIdentifierCheck: true },
  { key: "spelling", label: "Spelling", required: true, damianiIdentifierCheck: true },
  { key: "date_of_birth", label: "Date of birth if applicable", required: false, damianiIdentifierCheck: true },
  { key: "passport_number", label: "Passport number if applicable", required: false, damianiIdentifierCheck: true },
  { key: "tax_id", label: "Tax ID / codice fiscale if applicable", required: false, damianiIdentifierCheck: true },
  { key: "document_date", label: "Document date", required: true, damianiIdentifierCheck: true },
  { key: "document_title", label: "Document title", required: true },
  { key: "destination_country", label: "Destination country", required: true },
  { key: "receiving_authority", label: "Receiving authority", required: true },
  { key: "signer_location", label: "Signer location", required: true },
  { key: "witness_requirement", label: "Witness requirement", required: true },
  { key: "notarial_wording", label: "Notarial wording", required: true },
  { key: "ron_eligibility", label: "RON eligibility", required: true },
  { key: "apostille_requirement", label: "Apostille requirement", required: true },
  { key: "translation_requirement", label: "Translation requirement", required: true },
  { key: "courier_requirement", label: "Courier requirement", required: true },
  { key: "payment_confirmed", label: "Payment confirmed", required: true },
  { key: "release_authorized", label: "Release authorized", required: true },
];
