import type { AllianceMemberType } from "./types";

export const ALLIANCE_MEMBER_TYPES: AllianceMemberType[] = [
  { id: "document_execution", label: "Certified Document Execution Partner", examples: ["Mobile Notaries", "RON Notaries", "Loan Signing Agents", "Field Signing Specialists"], value: "Expands execution capacity and coverage." },
  { id: "international_document", label: "International Document Partner", examples: ["Apostille Coordinators", "Authentication Specialists", "Translation Agencies", "Localization Partners", "Embassy Specialists"], value: "Expands cross-border routing and language capability." },
  { id: "legal", label: "Legal Alliance Partner", examples: ["Attorneys", "Estate Planning Firms", "Immigration Firms", "Corporate Counsel", "Probate Firms"], value: "Expands professional referral and complex matter coordination." },
  { id: "healthcare", label: "Healthcare Alliance Partner", examples: ["Hospitals", "Hospice", "Skilled Nursing", "Rehabilitation", "Behavioral Health", "Medical Practices"], value: "Expands sensitive facility and directive workflow support." },
  { id: "government", label: "Government Alliance Partner", examples: ["Government Contractors", "Emergency Management", "Procurement Consultants", "Municipal Vendors", "Public Agencies"], value: "Expands public sector readiness and procurement intelligence." },
  { id: "logistics", label: "Logistics Alliance Partner", examples: ["Courier Services", "International Shipping", "Secure Document Transport", "Print and Scan Centers", "Records Storage"], value: "Expands custody and delivery capacity." },
  { id: "enterprise", label: "Enterprise Alliance Partner", examples: ["Banks", "Credit Unions", "Title Companies", "Corporate HR", "Universities", "Airports", "Private Wealth Offices"], value: "Expands institutional demand and account coverage." }
];

export const ALLIANCE_POSITIONING = {
  name: "The Milano Seal Alliance™",
  tagline: "Trusted Professionals. One Global Standard.",
  mission: "Create a vetted network of independent professionals who operate under Milano Seal operational standards while maintaining their own businesses.",
  enrollment: "Application, review, verification, operating agreement, training, and score initialization required."
} as const;
