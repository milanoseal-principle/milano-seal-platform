"use client";

import { useEffect, useState } from "react";

interface CountryTile {
  country: string;
  open_count: number;
  blocked_count: number;
  completed_only: boolean;
  matter_count: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  Italy: "🇮🇹", Portugal: "🇵🇹", Mexico: "🇲🇽", Spain: "🇪🇸",
  France: "🇫🇷", Germany: "🇩🇪", Brazil: "🇧🇷", Argentina: "🇦🇷",
  Colombia: "🇨🇴", Peru: "🇵🇪", Chile: "🇨🇱", Japan: "🇯🇵",
  China: "🇨🇳", UAE: "🇦🇪", UK: "🇬🇧", Canada: "🇨🇦",
};

function getTileColor(tile: CountryTile): string {
  if (tile.blocked_count > 0) return "#ef4444";
  if (tile.open_count > 0) return "#C6A55A";
  if (tile.completed_only) return "#4a9e6b";
  return "rgba(255,255,255,0.06)";
}

function getTileSize(count: number): number {
  if (count >= 10) return 100;
  if (count >= 5) return 80;
  if (count >= 3) return 70;
  return 60;
}

export function CountryHeatmap() {
  const [tiles, setTiles] = useState<CountryTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/country-ops")
      .then((r) => r.json())
      .then((d: { countries?: Array<{ country: string; open_count: number; blocked_count: number; matter_count: number }> }) => {
        const countries = d.countries ?? [];
        const result: CountryTile[] = countries.map((c) => ({
          country: c.country,
          open_count: c.open_count,
          blocked_count: c.blocked_count,
          matter_count: c.matter_count,
          completed_only: c.open_count === 0 && c.matter_count > 0,
        }));
        setTiles(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        background: "rgba(3,3,5,0.9)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        padding: "20px 24px",
        marginTop: 20,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          letterSpacing: "0.32em",
          textTransform: "uppercase" as const,
          color: "rgba(198,165,90,0.5)",
          marginBottom: 12,
        }}
      >
        Country Activity Heatmap
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" as const }}>
        {[
          { color: "#C6A55A", label: "Active (open matters)" },
          { color: "#ef4444", label: "Blocked" },
          { color: "#4a9e6b", label: "Completed" },
          { color: "rgba(255,255,255,0.1)", label: "No data" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
            <div style={{ width: 8, height: 8, borderRadius: 1, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Loading...</div>
      )}

      {!loading && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, alignItems: "flex-end" }}>
          {tiles.map((tile) => {
            const size = getTileSize(tile.matter_count);
            const color = getTileColor(tile);
            return (
              <div
                key={tile.country}
                title={`${tile.country}: ${tile.matter_count} matters, ${tile.open_count} open, ${tile.blocked_count} blocked`}
                style={{
                  width: size,
                  height: size,
                  background: `${color}20`,
                  border: `1px solid ${color}60`,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column" as const,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  cursor: "default",
                  transition: "transform 0.15s ease",
                }}
              >
                <span style={{ fontSize: size >= 80 ? 20 : 16 }}>
                  {COUNTRY_FLAGS[tile.country] ?? "🌍"}
                </span>
                {size >= 70 && (
                  <span
                    style={{
                      fontSize: 8,
                      fontFamily: "monospace",
                      color: "rgba(255,255,255,0.5)",
                      textAlign: "center" as const,
                      lineHeight: 1.2,
                      maxWidth: size - 8,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    {tile.country.length > 8 ? tile.country.slice(0, 8) : tile.country}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color,
                  }}
                >
                  {tile.matter_count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
