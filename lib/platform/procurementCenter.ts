export const GOVERNMENT_OPPORTUNITY_CENTER_SCOPE = {
  name: "Government Opportunity Center",
  tracks: ["Federal", "State", "County", "Municipal", "Airport", "Healthcare", "University", "Emergency Management"],
  features: ["Opportunity Watch", "Vendor Registrations", "NAICS", "NIGP", "UNSPSC", "Capability Statements", "Proposal Builder", "Pricing Library", "Past Responses", "Reference Library", "Award Tracking"],
  sourceOfTruth: "Procurement records must connect to the canonical Matter, Organization, Contact, Partner, Revenue, and Intelligence records when verified.",
} as const;

export const UNIVERSAL_PRICING_MODELS = {
  consumer: ["Signature", "Priority", "Executive"],
  government: ["Hourly", "Project-Based", "Task Order"],
  enterprise: ["Custom Scope", "Retainer", "Project"],
  alliance: ["Foundation", "Professional", "Enterprise"],
  governance: "Every pricing model must use the existing pricing engine as the source of truth. Do not create duplicate pricing calculators.",
} as const;
