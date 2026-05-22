export interface MilanoDeal {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  client_type: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  use_case: string | null;
  destination_country: string | null;
  origin_state: string | null;
  apostille_required: boolean;
  docs_count: number;
  lane: string;
  urgency: string;
  mobile: boolean;
  miles: number;
  signers: number;
  witnesses: number;
  witness_type: string | null;
  after_hours: boolean;
  translation: boolean;
  multi_country: boolean;
  base_price: number;
  witness_total: number;
  total_price: number;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  payment_link: string | null;
  balance_payment_link: string | null;
  balance_payment_status: string | null;
  balance_paid_at: string | null;
  balance_amount_received: number | null;
  deal_status: string;
  payment_status: string;
  conversion_score: number;
  assignee: string | null;
  notes: string | null;
  scheduled_at: string | null;
  executed_at: string | null;
  apostille_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export function serializeDealMS(row: Record<string, unknown>): MilanoDeal {
  const totalPrice = Number(row.total_price ?? row.amount ?? 0) || 0;

  const id = String(row.id ?? "");
  return {
    id,
    deal_id: (row.deal_id as string) || id || null,
    client_name:
      ((row.client_name as string) ?? (row.full_name as string)) || null,
    client_type: (row.client_type as string) ?? "individual",
    company_name:
      ((row.company_name as string) ?? (row.company as string)) || null,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    document_type:
      (row.document_type as string) ??
      (row.document as string) ??
      (row.service_type as string) ??
      null,
    use_case: (row.use_case as string) ?? null,
    destination_country:
      (row.destination_country as string) ?? (row.country as string) ?? null,
    origin_state: (row.origin_state as string) ?? null,
    apostille_required: Boolean(
      row.apostille_required ?? row.requires_apostille ?? false,
    ),
    docs_count: Number(row.docs_count ?? row.docs ?? 1),
    lane: (row.lane as string) ?? (row.execution_tier as string) ?? "Signature",
    urgency: (row.urgency as string) ?? "standard",
    mobile: Boolean(row.mobile ?? false),
    miles: Number(row.miles ?? 0),
    signers: Number(row.signers ?? 1),
    witnesses: Number(row.witnesses ?? 0),
    witness_type: (row.witness_type as string) ?? null,
    after_hours: Boolean(row.after_hours ?? false),
    translation: Boolean(row.translation ?? false),
    multi_country: Boolean(row.multi_country ?? false),
    base_price: Number(row.base_price ?? totalPrice ?? 0),
    witness_total: Number(row.witness_total ?? 0),
    total_price: totalPrice,
    invoice_retainer: row.invoice_retainer != null ? Number(row.invoice_retainer) : null,
    invoice_balance: row.invoice_balance != null ? Number(row.invoice_balance) : null,
    payment_link: (row.payment_link as string) ?? null,
    balance_payment_link: (row.balance_payment_link as string) ?? null,
    balance_payment_status: (row.balance_payment_status as string) ?? null,
    balance_paid_at: toIso(row.balance_paid_at),
    balance_amount_received: row.balance_amount_received != null ? Number(row.balance_amount_received) : null,
    deal_status: ((row.status as string) ??
      (row.deal_status as string) ??
      "new") as string,
    payment_status: ((row.payment_status as string) ?? "pending") as string,
    conversion_score: Number(row.conversion_score ?? 0),
    assignee: (row.assignee as string) ?? null,
    notes: (row.notes as string) ?? null,
    scheduled_at: toIso(row.scheduled_at ?? row.schedule_at),
    executed_at: toIso(row.execution_at ?? row.executed_at),
    apostille_at: toIso(row.apostille_at),
    shipped_at: toIso(row.shipped_at ?? row.delivery_at),
    completed_at: toIso(row.completed_at),
    tracking_number: (row.tracking_number as string) ?? null,
    created_at: toIso(row.created_at) ?? new Date().toISOString(),
    updated_at:
      toIso(row.updated_at) ??
      toIso(row.created_at) ??
      new Date().toISOString(),
  };
}

export interface MilanoActivity {
  id: string;
  deal_id: string | null;
  actor: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export function serializeActivityMS(
  row: Record<string, unknown>,
): MilanoActivity {
  return {
    id: String(row.id),
    deal_id: (row.deal_id as string) ?? null,
    actor: (row.actor as string) ?? null,
    action: (row.action as string) ?? "system",
    detail: (row.detail as string) ?? null,
    created_at: toIso(row.created_at) ?? new Date().toISOString(),
  };
}

function toIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toISOString();
  }
  return null;
}
