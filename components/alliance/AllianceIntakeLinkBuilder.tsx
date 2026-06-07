"use client";

import { useState } from "react";
import { Link2, Copy, CheckCircle } from "lucide-react";

interface IntakeLink {
  id: string;
  partner_code: string;
  campaign_label: string | null;
  click_count: number;
  active: boolean;
  created_at: string;
}

interface AllianceIntakeLinkBuilderProps {
  partnerCode: string;
  existingLinks: IntakeLink[];
}

const BASE_URL = "https://www.themilanoseal.com/intake";

export function AllianceIntakeLinkBuilder({ partnerCode, existingLinks }: AllianceIntakeLinkBuilderProps) {
  const [campaign, setCampaign] = useState("");
  const [creating, setCreating] = useState(false);
  const [links, setLinks] = useState<IntakeLink[]>(existingLinks);
  const [copied, setCopied] = useState<string | null>(null);

  function buildUrl(code: string, camp?: string | null) {
    const params = new URLSearchParams({ partner: code });
    if (camp) params.set("ref", camp.toLowerCase().replace(/\s+/g, "-"));
    return `${BASE_URL}?${params.toString()}`;
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/alliance/intake-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_label: campaign || null }),
      });
      const data = await res.json();
      if (data.link) {
        setLinks((prev) => [data.link, ...prev]);
        setCampaign("");
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function copyUrl(url: string, id: string) {
    await navigator.clipboard.writeText(url).catch(() => null);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalClicks = links.reduce((sum, l) => sum + l.click_count, 0);
  const activeCount = links.filter((l) => l.active).length;

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "9px 12px",
    background: "#0a0a0a",
    border: "1px solid rgba(198,166,91,0.2)",
    borderRadius: 4,
    color: "#F6F1E6",
    fontSize: 13,
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { label: "Total Clicks", value: totalClicks },
          { label: "Active Links", value: activeCount },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "14px 20px",
              background: "#111111",
              border: "1px solid rgba(198,166,91,0.12)",
              borderRadius: 6,
              minWidth: 120,
            }}
          >
            <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: "#F6F1E6" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Create new link */}
      <div>
        <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 10 }}>
          Generate Intake Link
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="Campaign label (optional)"
            style={inputStyle}
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              background: "rgba(198,166,91,0.1)",
              border: "1px solid rgba(198,166,91,0.3)",
              borderRadius: 4,
              color: "#C6A55A",
              fontSize: 12,
              fontFamily: "monospace",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Link2 size={13} />
            {creating ? "Creating..." : "Generate"}
          </button>
        </div>
        {campaign && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#A8A29A", fontFamily: "monospace", wordBreak: "break-all" }}>
            Preview: {buildUrl(partnerCode, campaign)}
          </div>
        )}
      </div>

      {/* Existing links */}
      {links.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 12 }}>
            Your Links
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {links.map((link) => {
              const url = buildUrl(link.partner_code, link.campaign_label);
              const isCopied = copied === link.id;
              return (
                <div
                  key={link.id}
                  style={{
                    padding: "12px 16px",
                    background: "#111111",
                    border: "1px solid rgba(198,166,91,0.12)",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {link.campaign_label && (
                      <div style={{ fontSize: 11, color: "#C6A55A", marginBottom: 4 }}>{link.campaign_label}</div>
                    )}
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: "#A8A29A", wordBreak: "break-all" }}>{url}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#A8A29A", flexShrink: 0 }}>
                    {link.click_count} click{link.click_count !== 1 ? "s" : ""}
                  </div>
                  <button
                    onClick={() => copyUrl(url, link.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 10px",
                      background: "transparent",
                      border: "1px solid rgba(198,166,91,0.2)",
                      borderRadius: 4,
                      color: isCopied ? "#3FA47A" : "#A8A29A",
                      fontSize: 12,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {isCopied ? <CheckCircle size={12} /> : <Copy size={12} />}
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
