import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Verification | The Milano Seal™",
  description: "Verify a released document custody record from The Milano Seal™.",
  robots: "noindex, nofollow", // verification pages should not be indexed
};

interface VerificationRecord {
  verified: boolean;
  status: string;
  verification_id: string;
  custody_hash: string;
  document_count: number;
  destination_country: string | null;
  document_type: string | null;
  released_at: string | null;
  public_summary: string | null;
  issuer: string;
}

async function getVerification(verificationId: string): Promise<VerificationRecord | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.milanoseal.com";
    const res = await fetch(`${baseUrl}/api/verify/${verificationId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York",
    });
  } catch { return iso; }
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ verificationId: string }>;
}) {
  const { verificationId } = await params;
  const record = await getVerification(verificationId);

  const containerStyle = {
    minHeight: "100vh",
    background: "rgba(8,5,1,0.99)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    fontFamily: "var(--font-geist-mono, monospace)",
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(198,165,90,0.15)",
    borderRadius: 12,
    padding: "40px 36px",
    maxWidth: 560,
    width: "100%",
  };

  if (!record || !record.verified) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img
              src="/milano-seal-evolved-full-logo.png"
              alt="The Milano Seal"
              style={{ height: 36, marginBottom: 20, opacity: 0.7 }}
            />
            <div style={{ color: "#C6A55A", fontSize: 10, letterSpacing: "0.14em", marginBottom: 16 }}>
              THE MILANO SEAL™
            </div>
          </div>
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8,
            padding: "20px 24px",
            textAlign: "center",
          }}>
            <div style={{ color: "#ef4444", fontSize: 24, marginBottom: 8 }}>✗</div>
            <div style={{ color: "#ef4444", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Verification Not Found
            </div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>
              No verification record was found for ID: {verificationId}
            </div>
          </div>
          <p style={{ color: "#374151", fontSize: 10, textAlign: "center", marginTop: 24 }}>
            If you believe this is an error, contact The Milano Seal™ directly.
          </p>
        </div>
      </div>
    );
  }

  const docTypeLabel = record.document_type
    ? record.document_type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
  const countryLabel = record.destination_country
    ? record.destination_country.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/milano-seal-evolved-full-logo.png"
            alt="The Milano Seal"
            style={{ height: 36, marginBottom: 20, opacity: 0.9 }}
          />
          <div style={{ color: "#C6A55A", fontSize: 10, letterSpacing: "0.14em", marginBottom: 8 }}>
            THE MILANO SEAL™
          </div>
          <div style={{ color: "#6b7280", fontSize: 11 }}>Certificate Verification</div>
        </div>

        {/* Status badge */}
        <div style={{
          background: "rgba(74,158,107,0.08)",
          border: "1px solid rgba(74,158,107,0.25)",
          borderRadius: 8,
          padding: "20px 24px",
          textAlign: "center",
          marginBottom: 28,
        }}>
          <div style={{ color: "#4a9e6b", fontSize: 28, marginBottom: 8 }}>✓</div>
          <div style={{ color: "#4a9e6b", fontSize: 15, fontWeight: 600, letterSpacing: "0.04em" }}>
            VALID — Custody Release Recorded
          </div>
          <div style={{ color: "rgba(229,224,216,0.5)", fontSize: 11, marginTop: 6 }}>
            Custody and release event confirmed by The Milano Seal™
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {[
            ["Verification ID", record.verification_id],
            ["Document Type", docTypeLabel],
            ["Destination", countryLabel],
            ["Documents", String(record.document_count)],
            ["Release Date", formatDate(record.released_at)],
            ["Issuer", "The Milano Seal™"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 10 }}>
              <span style={{ color: "#6b7280", fontSize: 11 }}>{label}</span>
              <span style={{ color: "#e5e0d8", fontSize: 12 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Hash */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(198,165,90,0.1)",
          borderRadius: 6,
          padding: "12px 14px",
          marginBottom: 24,
        }}>
          <div style={{ color: "#6b7280", fontSize: 9, letterSpacing: "0.1em", marginBottom: 6 }}>
            CUSTODY LEDGER HASH
          </div>
          <div style={{ color: "#C6A55A", fontSize: 10, wordBreak: "break-all", fontFamily: "monospace" }}>
            {record.custody_hash}
          </div>
        </div>

        {/* Public summary */}
        {record.public_summary && (
          <p style={{ color: "rgba(229,224,216,0.5)", fontSize: 11, lineHeight: 1.6, marginBottom: 24 }}>
            {record.public_summary}
          </p>
        )}

        {/* Disclaimer */}
        <p style={{ color: "#374151", fontSize: 10, lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 20 }}>
          This certificate confirms that The Milano Seal recorded a custody and release event for this matter.
          International use remains subject to destination and receiving-authority requirements.
          This certificate does not constitute legal guidance or guarantee acceptance by any receiving authority.
        </p>
      </div>
    </div>
  );
}
