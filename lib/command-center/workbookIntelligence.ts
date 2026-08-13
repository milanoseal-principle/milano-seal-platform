import generated from "@/data/command-center/workbook-intelligence.generated.json";

export type WorkbookRecordKind = "matter_opportunity" | "lost_opportunity" | "collected_payment";
export type WorkbookAuthority = "evidence_only";

export interface WorkbookProvenance {
  sourceFile: string;
  sourceSheet: "COMMAND_CENTER" | "CLIENT_REGISTRY";
  sourceRow: number;
  sourceRecordId: string;
  importedCommit: string;
  sourceSha256: string;
  authority: WorkbookAuthority;
}

export interface WorkbookOpportunityProjection {
  id: string;
  clientName: string;
  sourceClientName: string;
  clientType: string;
  country: string | null;
  status: string;
  stage: string;
  lane: string | null;
  serviceType: string | null;
  documentScope: string | null;
  paymentStatus: "None" | "Collected";
  quotedValue: number;
  finalValue: number;
  collectedRevenue: number;
  closeStatus: string;
  referralSource: string | null;
  protectedCode: string | null;
  phone: string | null;
  sourceUrl: string | null;
  externalOrderId: string | null;
  recordKind: WorkbookRecordKind;
  notes: readonly string[];
  provenance: WorkbookProvenance;
}

export interface WorkbookClientProjection {
  clientId: string;
  clientName: string;
  clientType: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  referralSource: string | null;
  totalHistoricalAndOpportunityRecords: number;
  lifetimeCollectedValue: number;
  openOpportunities: number;
  lostOpportunities: number;
  completedDeals: number;
  provenance: WorkbookProvenance;
}

export interface CommandCenterWorkbookProjection {
  projectionId: string;
  sourceSha256: string;
  opportunities: readonly WorkbookOpportunityProjection[];
  clients: readonly WorkbookClientProjection[];
  collectedRevenue: number;
  sourceAttribution: Readonly<Record<string, string>>;
}

type GeneratedDeal = (typeof generated.deals)[number];
type GeneratedClient = (typeof generated.clients)[number];

function dealProvenance(record: GeneratedDeal): WorkbookProvenance {
  return {
    sourceFile: generated.source.file,
    sourceSheet: "COMMAND_CENTER",
    sourceRow: record.sourceRow,
    sourceRecordId: record.sourceRecordId,
    importedCommit: generated.source.commit,
    sourceSha256: generated.source.sha256,
    authority: "evidence_only",
  };
}

function clientProvenance(record: GeneratedClient): WorkbookProvenance {
  return {
    sourceFile: generated.source.file,
    sourceSheet: "CLIENT_REGISTRY",
    sourceRow: record.sourceRow,
    sourceRecordId: record.clientId,
    importedCommit: generated.source.commit,
    sourceSha256: generated.source.sha256,
    authority: "evidence_only",
  };
}

export function getCommandCenterWorkbookProjection(): CommandCenterWorkbookProjection {
  const opportunities: WorkbookOpportunityProjection[] = generated.deals.map((record) => ({
    id: record.id,
    clientName: record.clientName,
    sourceClientName: record.sourceClientName,
    clientType: record.clientType,
    country: record.country,
    status: record.status,
    stage: record.stage,
    lane: record.lane,
    serviceType: record.serviceType,
    documentScope: record.documentScope,
    paymentStatus: record.paymentStatus as "None" | "Collected",
    quotedValue: record.quotedValue,
    finalValue: record.finalValue,
    collectedRevenue: record.collectedRevenue,
    closeStatus: record.closeStatus,
    referralSource: record.referralSource,
    protectedCode: record.protectedCode,
    phone: record.phone,
    sourceUrl: record.sourceUrl,
    externalOrderId: record.externalOrderId,
    recordKind: record.recordKind as WorkbookRecordKind,
    notes: record.notes,
    provenance: dealProvenance(record),
  }));

  const clients: WorkbookClientProjection[] = generated.clients.map((record) => ({
    clientId: record.clientId,
    clientName: record.clientName,
    clientType: record.clientType,
    organization: record.organization,
    email: record.email,
    phone: record.phone,
    country: record.country,
    referralSource: record.referralSource,
    totalHistoricalAndOpportunityRecords: record.totalHistoricalAndOpportunityRecords,
    lifetimeCollectedValue: record.lifetimeCollectedValue,
    openOpportunities: record.openOpportunities,
    lostOpportunities: record.lostOpportunities,
    completedDeals: record.completedDeals,
    provenance: clientProvenance(record),
  }));

  return {
    projectionId: `${generated.source.sha256}:command-center-v2`,
    sourceSha256: generated.source.sha256,
    opportunities,
    clients,
    collectedRevenue: generated.collectedRevenue,
    sourceAttribution: generated.sourceAttribution,
  };
}
