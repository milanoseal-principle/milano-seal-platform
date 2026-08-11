"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Gift, Link2, ShieldCheck } from "lucide-react";

export interface AllianceBenefitView {
  id: string;
  code: string;
  percentage: number;
  status: string;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  label: string;
  serviceScope: string;
}

interface AllianceBenefitsCardProps {
  benefits: AllianceBenefitView[];
  referralCode: string | null;
  referralCount: number;
  referralPath: string | null;
}

function remaining(benefit: AllianceBenefitView) {
  if (benefit.usageLimit == null) return "Unlimited";
  return String(Math.max(0, benefit.usageLimit - benefit.usageCount));
}

function expiry(value: string | null) {
  if (!value) return "No expiration";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AllianceBenefitsCard({
  benefits,
  referralCode,
  referralCount,
  referralPath,
}: AllianceBenefitsCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section
        style={{
          padding: 22,
          background: "#0d0d0d",
          border: "1px solid rgba(198,166,91,0.14)",
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Gift size={16} color="#C6A55A" />
          <div>
            <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C6A55A" }}>
              Alliance Benefits
            </div>
            <div style={{ marginTop: 3, fontSize: 12, color: "#A8A29A" }}>
              Read-only benefits assigned by The Milano Seal. Pricing authority remains server controlled.
            </div>
          </div>
        </div>

        {benefits.length === 0 ? (
          <div style={{ padding: "18px 0", color: "#A8A29A", fontSize: 12 }}>
            No courtesy benefit is currently assigned to this Alliance account.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {benefits.map((benefit) => (
              <article
                key={benefit.id}
                style={{
                  padding: 16,
                  border: "1px solid rgba(198,166,91,0.12)",
                  borderRadius: 8,
                  background: "#121212",
                  display: "grid",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontFamily: "monospace", fontSize: 16, color: "#F6F1E6" }}>{benefit.code}</strong>
                      <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: benefit.status === "active" ? "#3FA47A" : "#C6A55A" }}>
                        {benefit.status}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, color: "#C6A55A", fontSize: 20 }}>{benefit.percentage}%</div>
                    <div style={{ marginTop: 2, fontSize: 11, color: "#A8A29A" }}>{benefit.label}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copy(benefit.code, benefit.id)}
                    style={{
                      alignSelf: "flex-start",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(198,166,91,0.2)",
                      background: "rgba(198,166,91,0.05)",
                      color: "#F6E8B8",
                      fontSize: 10,
                      cursor: "pointer",
                    }}
                  >
                    <Copy size={12} /> {copied === benefit.id ? "Copied" : "Copy Code"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
                  <div style={detailStyle}><span style={labelStyle}>Uses remaining</span>{remaining(benefit)}</div>
                  <div style={detailStyle}><span style={labelStyle}>Expiration</span>{expiry(benefit.expiresAt)}</div>
                  <div style={detailStyle}><span style={labelStyle}>Eligible scope</span>{benefit.serviceScope.replaceAll("_", " ")}</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10, color: "#8f8a81" }}>
                  <ShieldCheck size={12} color="#3FA47A" />
                  Server validated. Benefits cannot alter Matter pricing directly and are redeemed only through the canonical payment workflow.
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          padding: 22,
          background: "#0d0d0d",
          border: "1px solid rgba(198,166,91,0.14)",
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Link2 size={16} color="#C6A55A" />
          <div>
            <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C6A55A" }}>
              Referral Attribution
            </div>
            <div style={{ marginTop: 3, fontSize: 12, color: "#A8A29A" }}>
              Partner referral submissions stay attributed to your Alliance account.
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 14 }}>
          <div style={detailStyle}><span style={labelStyle}>Referral code</span>{referralCode ?? "Not assigned"}</div>
          <div style={detailStyle}><span style={labelStyle}>Attributed referrals</span>{referralCount}</div>
        </div>

        {referralPath && referralCode ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              href={referralPath}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 12px",
                borderRadius: 6,
                border: "1px solid rgba(198,166,91,0.24)",
                background: "rgba(198,166,91,0.08)",
                color: "#F6E8B8",
                textDecoration: "none",
                fontSize: 11,
              }}
            >
              Submit Attributed Referral
            </Link>
            <button
              type="button"
              onClick={() => void copy(referralCode, "referral-code")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 12px",
                borderRadius: 6,
                border: "1px solid rgba(198,166,91,0.15)",
                background: "transparent",
                color: "#A8A29A",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              <Copy size={12} /> {copied === "referral-code" ? "Copied" : "Copy Referral Code"}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#A8A29A" }}>A referral code has not been assigned to this account yet.</div>
        )}
      </section>
    </div>
  );
}

const detailStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: 12,
  borderRadius: 6,
  border: "1px solid rgba(198,166,91,0.09)",
  background: "rgba(255,255,255,0.015)",
  fontSize: 12,
  color: "#F6F1E6",
};

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#777168",
};
