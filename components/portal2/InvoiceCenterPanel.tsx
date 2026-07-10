import type { PortalMatter, InvoiceSummary } from "@/lib/portal2/types";
import { Panel, EmptyState, GOLD, GOLD_FAINT, INK, INK_DIM } from "./_ui";

const STATUS_LABELS: Record<InvoiceSummary["status"], string> = {
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Partially Paid",
  paid: "Paid",
};

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function InvoiceCenterPanel({ matter }: { matter: PortalMatter | null }) {
  const invoice = matter?.invoice ?? null;

  if (!invoice) {
    return (
      <Panel title="Invoice Center" eyebrow="Billing">
        <EmptyState message="No invoice issued yet. Your execution proposal and invoice will appear here once your matter is quoted." />
      </Panel>
    );
  }

  const rows: Array<[string, string, string?]> = [
    ["Amount Due", money(invoice.amountDue, invoice.currency)],
    ["Amount Paid", money(invoice.amountPaid, invoice.currency)],
    ["Balance", money(invoice.balance, invoice.currency), invoice.balance > 0 ? GOLD : undefined],
  ];

  return (
    <Panel title="Invoice Center" eyebrow="Billing">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: INK_DIM, fontFamily: "monospace" }}>
          {invoice.invoiceNumber ?? "Invoice"}
        </span>
        <span style={{ fontSize: 12, color: invoice.status === "paid" ? GOLD : INK }}>
          {STATUS_LABELS[invoice.status]}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map(([k, v, color]) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "9px 0",
              borderBottom: `1px solid ${GOLD_FAINT}`,
            }}
          >
            <span style={{ fontSize: 12.5, color: INK }}>{k}</span>
            <span style={{ fontSize: 12.5, color: color ?? "rgba(255,255,255,0.8)", fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: INK_DIM, marginTop: 12, lineHeight: 1.5 }}>
        Payment is processed securely. Scheduling unlocks only after payment is confirmed by the platform.
      </div>
    </Panel>
  );
}
