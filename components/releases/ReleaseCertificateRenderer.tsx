"use client";

const GOLD = "#C6A55A";
const BLACK = "#060606";

export interface ReleaseCertificateRendererProps {
  verificationId: string;
  matterId: string;
  clientName: string;
  documentType: string;
  destinationCountry: string;
  executionLane?: string;
  notarizationStatus: string;
  apostilleStatus: string;
  courierStatus: string;
  releaseStatus: string;
  releaseDate: string;
  custodyHash?: string;
  verificationUrl?: string;
  operatorOfRecord?: string;
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 8,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.6)",
          marginBottom: 2,
          fontFamily: "monospace",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.8)",
          fontFamily: mono ? "monospace" : "inherit",
          letterSpacing: mono ? "0.04em" : undefined,
          wordBreak: mono ? "break-all" : undefined,
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export function ReleaseCertificateRenderer({
  verificationId,
  matterId,
  clientName,
  documentType,
  destinationCountry,
  executionLane,
  notarizationStatus,
  apostilleStatus,
  courierStatus,
  releaseStatus,
  releaseDate,
  custodyHash,
  verificationUrl,
  operatorOfRecord,
}: ReleaseCertificateRendererProps) {
  const formattedDate = (() => {
    try {
      return new Date(releaseDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return releaseDate;
    }
  })();

  return (
    <div
      className="release-certificate"
      style={{
        background: BLACK,
        border: `1px solid ${GOLD}33`,
        borderRadius: 6,
        padding: "36px 40px",
        maxWidth: 680,
        margin: "0 auto",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "Georgia, serif",
        position: "relative",
      }}
    >
      <style>{`
        @media print {
          .release-certificate {
            background: #fff !important;
            color: #000 !important;
            border: 1px solid #ccc !important;
          }
          .release-certificate .cert-gold {
            color: #8a6a00 !important;
          }
          .release-certificate .cert-hash {
            color: #333 !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/milano-seal-feather-m-orb.png"
          alt="Milano Seal Crest"
          style={{ width: 60, height: 60, objectFit: "contain", marginBottom: 12 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div
          className="cert-gold"
          style={{
            fontSize: 9,
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: GOLD,
            marginBottom: 8,
            fontFamily: "monospace",
          }}
        >
          The Milano Seal™
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "0.04em",
            marginBottom: 4,
          }}
        >
          Certificate of Digital Custody
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "monospace",
            letterSpacing: "0.08em",
          }}
        >
          {formattedDate}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)`,
          marginBottom: 28,
        }}
      />

      {/* Two-column grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 32px",
          marginBottom: 24,
        }}
      >
        <Field label="Client" value={clientName} />
        <Field label="Document Type" value={documentType} />
        <Field label="Destination Country" value={destinationCountry} />
        <Field label="Execution Lane" value={executionLane ?? "—"} />
        <Field label="Notarization" value={notarizationStatus} />
        <Field label="Apostille" value={apostilleStatus} />
        <Field label="Courier Status" value={courierStatus} />
        <Field label="Release Status" value={releaseStatus} />
        {operatorOfRecord && (
          <Field label="Operator of Record" value={operatorOfRecord} />
        )}
        <Field label="Matter ID" value={matterId} mono />
        <Field label="Verification ID" value={verificationId} mono />
      </div>

      {/* Custody hash */}
      {custodyHash && (
        <div
          style={{
            background: "rgba(198,165,90,0.04)",
            border: `1px solid ${GOLD}18`,
            borderRadius: 3,
            padding: "12px 16px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(198,165,90,0.5)",
              marginBottom: 6,
              fontFamily: "monospace",
            }}
          >
            Custody Hash
          </div>
          <div
            className="cert-hash"
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.55)",
              wordBreak: "break-all",
              letterSpacing: "0.04em",
            }}
          >
            {custodyHash}
          </div>
        </div>
      )}

      {/* Verification URL */}
      {verificationUrl && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(198,165,90,0.5)",
              marginBottom: 4,
              fontFamily: "monospace",
            }}
          >
            Verification Link
          </div>
          <a
            href={verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: GOLD,
              textDecoration: "none",
              fontFamily: "monospace",
              borderBottom: `1px solid ${GOLD}30`,
              wordBreak: "break-all",
            }}
          >
            {verificationUrl}
          </a>
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD}20, transparent)`,
          marginBottom: 18,
        }}
      />

      {/* Disclaimer */}
      <p
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.25)",
          lineHeight: 1.6,
          margin: 0,
          fontStyle: "italic",
        }}
      >
        The Milano Seal provides notarial and document coordination services
        only. International use remains subject to destination and
        receiving-authority requirements.
      </p>
    </div>
  );
}
