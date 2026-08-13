export type WorkbookRecordKind = "matter_opportunity" | "lost_opportunity" | "collected_payment";
export type WorkbookAuthority = "evidence_only";

export interface WorkbookProvenance {
  sourceFile: string;
  sourceSheet: "COMMAND_CENTER" | "CLIENT_REGISTRY";
  sourceRecordId: string;
  importedCommit: string;
  authority: WorkbookAuthority;
}

export interface WorkbookOpportunityProjection {
  id: string;
  clientName: string;
  clientType: string;
  country: string | null;
  status: string;
  stage: "Pre-Revenue" | "Closed";
  lane: string | null;
  documentScope: string | null;
  paymentStatus: "None" | "Collected";
  collectedRevenue: number;
  closeStatus: "Open" | "Lost" | "Closed";
  referralSource: string | null;
  protectedCode: string | null;
  recordKind: WorkbookRecordKind;
  notes: readonly string[];
  provenance: WorkbookProvenance;
}

export interface WorkbookClientProjection {
  clientName: string;
  totalHistoricalAndOpportunityRecords: number;
  lifetimeCollectedValue: number;
  openOpportunities: number;
  provenance: WorkbookProvenance;
}

export interface CommandCenterWorkbookProjection {
  projectionId: string;
  opportunities: readonly WorkbookOpportunityProjection[];
  clients: readonly WorkbookClientProjection[];
  collectedRevenue: number;
  sourceAttribution: Readonly<Record<string, string>>;
}

const SOURCE_FILE = "Milano_Seal_Command_Center_OS_v3_BRANDED_Damiani_3rd_DAMIANI50_Prefill.xlsx";
const SOURCE_COMMIT = "9c3d5f14920f207925275c903dbe0b38dcf39f63";

function provenance(sourceSheet: WorkbookProvenance["sourceSheet"], sourceRecordId: string): WorkbookProvenance {
  return {
    sourceFile: SOURCE_FILE,
    sourceSheet,
    sourceRecordId,
    importedCommit: SOURCE_COMMIT,
    authority: "evidence_only",
  };
}

const opportunities: readonly WorkbookOpportunityProjection[] = [
  {
    id: "MS-DAMIANI-2026-003",
    clientName: "Irene Damiani",
    clientType: "Attorney / Reorder",
    country: "Italy",
    status: "New Intake",
    stage: "Pre-Revenue",
    lane: "Priority",
    documentScope: null,
    paymentStatus: "None",
    collectedRevenue: 0,
    closeStatus: "Open",
    referralSource: null,
    protectedCode: "DAMIANI50",
    recordKind: "matter_opportunity",
    notes: [
      "Confirm document scope.",
      "Calculate with the canonical pricing engine.",
      "Persist the eligible subtotal before applying any adjustment.",
      "Validate DAMIANI50 on the server before applying the 50% courtesy adjustment.",
      "Derive the 50% retainer and 50% balance from the validated final total.",
      "No redemption, payment, scheduling, or execution is recorded.",
    ],
    provenance: provenance("COMMAND_CENTER", "MS-DAMIANI-2026-003"),
  },
  {
    id: "WORKBOOK-DAMIANI-REJECTED-1100",
    clientName: "Irene Damiani",
    clientType: "Attorney",
    country: "Italy",
    status: "Lost",
    stage: "Closed",
    lane: null,
    documentScope: null,
    paymentStatus: "None",
    collectedRevenue: 0,
    closeStatus: "Lost",
    referralSource: null,
    protectedCode: null,
    recordKind: "lost_opportunity",
    notes: ["Rejected $1,100 opportunity; the quoted value is not revenue."],
    provenance: provenance("COMMAND_CENTER", "DAMIANI-REJECTED-1100"),
  },
  {
    id: "WORKBOOK-COLOMBIA-LOST-500",
    clientName: "Colombia Lead",
    clientType: "Lead",
    country: "Colombia",
    status: "Lost",
    stage: "Closed",
    lane: null,
    documentScope: null,
    paymentStatus: "None",
    collectedRevenue: 0,
    closeStatus: "Lost",
    referralSource: null,
    protectedCode: null,
    recordKind: "lost_opportunity",
    notes: ["Lost $500 lead; the lead value is not revenue."],
    provenance: provenance("COMMAND_CENTER", "COLOMBIA-LOST-500"),
  },
  {
    id: "WORKBOOK-ABUJHAISHA-120",
    clientName: "Abujhaisha",
    clientType: "Client",
    country: null,
    status: "Completed",
    stage: "Closed",
    lane: null,
    documentScope: null,
    paymentStatus: "Collected",
    collectedRevenue: 120,
    closeStatus: "Closed",
    referralSource: "Snapdocs",
    protectedCode: null,
    recordKind: "collected_payment",
    notes: ["$120 is workbook-recorded collected revenue; Snapdocs is source attribution."],
    provenance: provenance("COMMAND_CENTER", "ABUJHAISHA-SNAPDOCS-120"),
  },
] as const;

const clients: readonly WorkbookClientProjection[] = [
  {
    clientName: "Irene Damiani",
    totalHistoricalAndOpportunityRecords: 3,
    lifetimeCollectedValue: 760.03,
    openOpportunities: 1,
    provenance: provenance("CLIENT_REGISTRY", "IRENE-DAMIANI"),
  },
] as const;

export function getCommandCenterWorkbookProjection(): CommandCenterWorkbookProjection {
  return {
    projectionId: `${SOURCE_COMMIT}:command-center-v1`,
    opportunities,
    clients,
    collectedRevenue: opportunities.reduce((sum, record) => sum + record.collectedRevenue, 0),
    sourceAttribution: { "WORKBOOK-ABUJHAISHA-120": "Snapdocs" },
  };
}
