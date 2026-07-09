export interface VaultRecord { id: string; label: string; status: "pending" | "received" | "released"; }
export const DOCUMENT_VAULT_RECORDS: VaultRecord[] = [{ id: "placeholder", label: "Controlled Records", status: "pending" }];
