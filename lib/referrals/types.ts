export type ReferralSourceType = "attorney" | "private_client" | "family_office" | "alliance" | "professional" | "unknown";

export interface ReferralRelationshipRecord {
  id: string;
  dealId: string;
  sourceName: string;
  sourceType: ReferralSourceType;
  relationshipStage: "new" | "active" | "warm" | "dormant";
  attachedToDeal: true;
  notes?: string;
}
