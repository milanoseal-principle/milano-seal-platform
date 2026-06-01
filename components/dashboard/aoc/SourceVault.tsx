"use client";

import type { SourceVaultEntry } from "@/data/authorities";

const GOLD = "#C6A55A";
const RED = "#e05252";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function sourceTypeBadge(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  entries: SourceVaultEntry[];
}

export function SourceVault({ entries }: Props) {
  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 2,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Source Vault — {entries.length} source{entries.length !== 1 ? "s" : ""} on file
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          No sources on file. Add a source reference to begin verification.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {entries.map((e, i) => (
            <div
              key={e.id}
              style={{
                padding: "10px 0",
                borderBottom:
                  i < entries.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>
                    {e.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(198,165,90,0.5)",
                        background: "rgba(198,165,90,0.06)",
                        padding: "1px 6px",
                        borderRadius: 2,
                      }}
                    >
                      {sourceTypeBadge(e.source_type)}
                    </span>
                    {e.valid_to && (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "monospace",
                          letterSpacing: "0.1em",
                          color: RED,
                        }}
                      >
                        Expired {formatDate(e.valid_to)}
                      </span>
                    )}
                  </div>
                  {e.url && (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: GOLD, textDecoration: "none", opacity: 0.7, display: "block", marginBottom: 4 }}
                    >
                      {e.url}
                    </a>
                  )}
                  {e.notes && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4, lineHeight: 1.4 }}>
                      {e.notes}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                    Captured by {e.captured_by} on {formatDate(e.captured_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
