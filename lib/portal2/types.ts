export type Portal2Status = "intake" | "review" | "invoice" | "execution" | "apostille" | "courier" | "release" | "complete";
export interface Portal2Matter { id: string; status: Portal2Status; destinationCountry?: string; nextAction: string; }
