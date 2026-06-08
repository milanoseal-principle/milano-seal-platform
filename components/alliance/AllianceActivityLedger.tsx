import { Activity } from "lucide-react";
import { AllianceEmptyState } from "./AllianceEmptyState";

export interface ActivityEntry {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
}

interface AllianceActivityLedgerProps {
  entries: ActivityEntry[];
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function eventColor(type: string): string {
  if (type.includes("referral")) return "#C6A55A";
  if (type.includes("compliance") || type.includes("security")) return "#3FA47A";
  if (type.includes("error") || type.includes("rejected")) return "#B85C5C";
  if (type.includes("review")) return "#C99A3D";
  return "#A8A29A";
}

export function AllianceActivityLedger({ entries }: AllianceActivityLedgerProps) {
  if (!entries.length) {
    return (
      <AllianceEmptyState
        icon={Activity}
        title="No activity yet"
        description="Your partner activity log will appear here as you interact with the Alliance Portal."
      />
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(198,166,91,0.12)" }}>
            {["Date", "Event", "Description"].map((h) => (
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
          {entries.map((entry) => (
            <tr key={entry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <td style={{ padding: "11px 14px", color: "#A8A29A", whiteSpace: "nowrap", fontSize: 12, fontFamily: "monospace" }}>
                {formatDate(entry.created_at)}
              </td>
              <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: eventColor(entry.event_type),
                  }}
                >
                  {entry.event_type.replace(/_/g, " ")}
                </span>
              </td>
              <td style={{ padding: "11px 14px", color: "#F6F1E6" }}>{entry.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
