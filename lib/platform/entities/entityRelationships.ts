// Canonical entity relationship map — declares how entities connect to Matter.
// Documentation/graph aid only; contains no business logic.

export type CanonicalEntityName =
  | "Matter" | "Contact" | "Organization" | "Document" | "Signer" | "Witness"
  | "Jurisdiction" | "Country" | "Quote" | "Invoice" | "Payment" | "Execution"
  | "Apostille" | "Courier" | "CustodyEvent" | "Partner" | "PartnerPassport"
  | "ReferralSource" | "GovernmentAgency" | "GovernmentOpportunity"
  | "GovernmentSubmission" | "QARecord" | "Blocker" | "RevenueEvent"
  | "PortalAccess" | "OperatorAction" | "IntelligenceNode" | "CaseStudy"
  | "SOPUpdate" | "AuditEvent";

// For each entity: which Matter field(s) reference it (or how it links back).
export const ENTITY_RELATIONSHIPS: Record<CanonicalEntityName, string[]> = {
  Matter: ["(root)"],
  Contact: ["Matter.contactId"],
  Organization: ["Matter.organizationId"],
  Document: ["Matter.documentIds"],
  Signer: ["Matter (signer readiness)"],
  Witness: ["Matter.witnessIds"],
  Jurisdiction: ["Matter.documentOriginJurisdictionId"],
  Country: ["Matter.destinationCountryId"],
  Quote: ["Matter.quoteId"],
  Invoice: ["Matter.invoiceId"],
  Payment: ["Matter.paymentId (read-only via approved interface)"],
  Execution: ["Matter (execution tier/path)"],
  Apostille: ["Matter.apostilleId"],
  Courier: ["Matter.courierId"],
  CustodyEvent: ["Matter.custodyEventIds (read-only projection)"],
  Partner: ["Matter.assignedPartnerId"],
  PartnerPassport: ["Partner.passportId"],
  ReferralSource: ["Matter.referralSourceId"],
  GovernmentAgency: ["GovernmentOpportunity.agency"],
  GovernmentOpportunity: ["Matter.governmentOpportunityId"],
  GovernmentSubmission: ["Matter.governmentSubmissionId"],
  QARecord: ["Matter.qaRecordIds"],
  Blocker: ["Matter.blockerIds"],
  RevenueEvent: ["Matter.revenueEventIds"],
  PortalAccess: ["Matter.portalAccessId"],
  OperatorAction: ["Matter.operatorActionIds"],
  IntelligenceNode: ["Matter.intelligenceNodeIds"],
  CaseStudy: ["Matter.caseStudyId"],
  SOPUpdate: ["Matter.sopUpdateIds"],
  AuditEvent: ["entityType + entityId (any)"],
};
