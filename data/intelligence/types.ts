export type CorridorType = "hague" | "consular";
export type DocumentCategory = "identity" | "legal" | "corporate" | "real-estate" | "estate" | "immigration" | "academic" | "financial" | "medical";
export type ClientDemographic = "private-client" | "attorney" | "real-estate" | "corporate" | "immigration" | "medical" | "academic" | "family-law" | "estate-planning" | "banking";
export type NotarizationType = "mobile" | "ron" | "either";
export type RejectionSeverity = "fatal" | "correctable";
export type Region = "europe" | "americas" | "asia-pacific" | "middle-east" | "africa" | "caribbean";

export interface Country {
  id: string;
  name: string;
  isoCode: string;
  region: Region;
  corridorType: CorridorType;
  hagueSince?: number;
  counselTerm?: string;
  translationLanguage?: string;            // primary language for translation; omit if English accepted
  certifiedTranslationRequired?: boolean;
  requiresWitnesses: boolean;
  witnessCount?: number;
  apostilleTimeline?: string;              // receiving-country processing time after receipt
  specialNotes?: string;
  demographics: ClientDemographic[];       // typical client base for this destination
  commonDocuments?: string[];              // document type IDs most commonly sent here
}

export interface DocumentType {
  id: string;
  name: string;
  category: DocumentCategory;
  commonlyApostilled: boolean;
  floridaSourceAuthority: string;
  notarizationRequired: boolean;
  estimatedNotarizationTime?: string;
  demographics: ClientDemographic[];
  commonDestinations?: string[];           // country IDs most commonly paired
  description?: string;
}

export interface RejectionTrigger {
  trigger: string;
  description: string;
  severity: RejectionSeverity;
}

export interface Workflow {
  id: string;
  countryId: string;
  documentId: string;
  routeType: "Hague Convention" | "Consular Authentication";
  notarizationRequired: boolean;
  notarizationType?: NotarizationType;
  witnessRequired: boolean;
  witnessCount?: number;
  translationRequired: boolean;
  translationLanguage?: string;
  certifiedTranslationRequired?: boolean;
  apostilleRequired: boolean;
  apostilleAuthority?: string;
  consularLegalizationRequired?: boolean;
  estimatedTimeline: string;
  executionPath: string[];
  rejectionTriggers: RejectionTrigger[];
  specialInstructions?: string;
  isDerived?: boolean;                     // true = auto-derived; false/undefined = hand-authored
  validFrom: string;
  validTo?: string;
  lastReviewed: string;
  sourceReference?: string;
}
