// Command Center — internal typed operating model extracted from the workbook.
// INTERNAL ONLY. These types describe operator/dashboard data and exact revenue fields.

export interface MatterCommandRecord {
  dealId: string;
  clientName: string;
  clientType: string | null;
  country: string | null;
  referralSource: string | null;
  serviceType: string | null;
  documentType: string | null;
  lane: string | null;
  status: string | null;
  masterStatus: string | null;
  stageGroup: string | null;
  quotedPrice: number | null;
  finalPrice: number | null;
  amountQuoted: number | null;
  amountPaid: number | null;
  amountCollected: number | null;
  revenueStatus: string | null;
  balance: number | null;
  paymentStatus: string | null;
  executionLock: string | null;
  invoiceStatus: string | null;
  ronStatus: string | null;
  apostilleStatus: string | null;
  apostilleStage: string | null;
  shippingStatus: string | null;
  deliveryStatus: string | null;
  dateCreated: string | null;
  executionDate: string | null;
  apostilleSubmitted: string | null;
  apostilleCompleted: string | null;
  deliveryDate: string | null;
  turnaroundDays: number | null;
  folderLink: string | null;
  assignedTo: string | null;
  nextAction: string | null;
  lastUpdated: string | null;
  stuck48h: boolean;
  delayRisk: string | null;
  addonEvaluated: boolean;
  addonTranslation: boolean;
  addonExtraCopies: boolean;
  addonInternationalShippingUpgrade: boolean;
  addonRush: boolean;
  addonTotal: number | null;
  addonFlag: string | null;
  notes: string | null;
  dealType: string | null;
  closeStatus: string | null;
  closeSpeedDays: number | null;
  dealValueTier: string | null;
}

export interface ClientRegistryRecord {
  clientId: string;
  clientName: string;
  clientType: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  country: string | null;
  referralSource: string | null;
  totalDeals: number;
  lifetimeValue: number;
  lastDealDate: string | null;
  openDeals: number;
  repeatClient: boolean;
  clientTier: string;
}

export interface DealFinancialRecord {
  dealId: string;
  clientName: string;
  lane: string | null;
  basePrice: number;
  signatureCost: number;
  signerCost: number;
  apostilleCost: number;
  urgencyCost: number;
  dispatchCost: number;
  coordinationCost: number;
  quotedPrice: number;
  finalPrice: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: string | null;
  netProfit: number;
}

export interface ApostillePipelineRecord {
  dealId: string;
  primaryClient: string;
  country: string | null;
  documentType: string | null;
  apostilleStatus: string | null;
  stateSentDate: string | null;
  returnDate: string | null;
  trackingNumber: string | null;
  deliveryStatus: string | null;
  notes: string | null;
}

export interface ReviewFlowRecord {
  dealId: string;
  clientName: string;
  deliveryDate: string | null;
  reviewEmailDue: string | null;
  reviewEmailSent: boolean;
  reviewCompleted: boolean;
  reviewPlatform: string | null;
  reviewLinkSentAt: string | null;
  starsRating: number | null;
  notes: string | null;
}

export interface OperatorMetric {
  section: string;
  metric: string;
  value: string;
  source: string;
  statusLevel: "ok" | "warn" | "risk" | "neutral";
}
