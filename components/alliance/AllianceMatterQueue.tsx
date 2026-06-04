import { FileStack } from "lucide-react";
import { AllianceEmptyState } from "./AllianceEmptyState";

// Partner-safe status map — no internal states exposed
const PARTNER_SAFE_STATUSES: Record<string, { label: string; color: string }> = {
  submitted: { label: "Received", color: "#A8A29A" },
  under_review: { label: "Under Review", color: "#C99A3D" },
  accepted: { label: "Accepted", color: "#C6A55A" },
  in_progress: { label: "In Progress", color: "#C6A55A" },
  awaiting_authentication: { label: "Awaiting Authentication", color: "#C99A3D" },
  apostille: { label: "Apostille / Authentication", color: "#C6A55A" },
  in_transit: { label: "In Transit", color: "#C6A55A" },
  completed: { label: "Completed", color: "#3FA47A" },
  not_accepted: { label: "Not Accepted", color: "#B85C5C" },
  rejected: { label: "Not Accepted", color: "#B85C5C" },
};

const COMMISSION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NOT_ELIGIBLE: { label: "Not Eligible", color: "#A8A29A" },
  PENDING_REVIEW: { label: "Pending Review", color: "#C99A3D" },
  APPROVED: { label: "Approved", color: "#C6A55A" },
  REJECTED: { label: "Not Approved", color: "#B85C5C" },
  PAID: { label: "Paid", color: "#3FA47A" },
  ON_HOLD: { label: "On Hold", color: "#C99A3D" },
  NEEDS_REVIEW: { label: "Needs Review", color: "#C99A3D" },
};

export interface MatterRow {
  id: string;
  client_name: string | null;
  destination_country: string | null;
  document_type: string | null;
  referral_status: string;
  commission_status: string;
  submitted_at: string;
}

interface AllianceMatterQueueProps {
  matters: MatterRow[];
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

export function AllianceMatterQueue({ matters }: AllianceMatterQueueProps) {
  if (!matters.length) {
    return (
      <AllianceEmptyState
        icon={FileStack}
        title="No referred matters"
        description="Matters referred through your partner account will appear here once accepted."
      />
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(198,166,91,0.12)" }}>
            {["Matter ID", "Client", "Destination", "Document Type", "Status", "Submitted", "Commission"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontSize: 10,
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#A8A29A",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matters.map((row) => {
            const status = PARTNER_SAFE_STATUSES[row.referral_status] ?? { label: row.referral_status, color: "#A8A29A" };
            const commission = COMMISSION_STATUS_LABELS[row.commission_status] ?? { label: row.commission_status, color: "#A8A29A" };
            const matterId = `MTR-${row.id.substring(0, 8).toUpperCase()}`;

            return (
              <tr
                key={row.id}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: "#C6A55A" }}>{matterId}</td>
                <td style={{ padding: "12px 14px", color: "#F6F1E6" }}>{row.client_name ?? "—"}</td>
                <td style={{ padding: "12px 14px", color: "#A8A29A" }}>{row.destination_country ?? "—"}</td>
                <td style={{ padding: "12px 14px", color: "#A8A29A" }}>{row.document_type ?? "—"}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: status.color,
                      padding: "3px 8px",
                      background: `${status.color}14`,
                      border: `1px solid ${status.color}33`,
                      borderRadius: 3,
                    }}
                  >
                    {status.label}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", color: "#A8A29A", whiteSpace: "nowrap" }}>{formatDate(row.submitted_at)}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ fontSize: 11, color: commission.color }}>{commission.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
