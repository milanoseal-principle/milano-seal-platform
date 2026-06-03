"use client";

const GOLD = "#C6A55A";

interface CertificateActionsProps {
  verificationId: string;
  matterId: string;
  onPrint?: () => void;
}

export function CertificateActions({
  verificationId,
  matterId,
  onPrint,
}: CertificateActionsProps) {
  function handlePrint() {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  }

  function handleDownloadPdf() {
    // PDF download — placeholder pending server-side PDF generation
    console.log(
      "[CertificateActions] PDF download requested for",
      verificationId,
      matterId
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 16,
      }}
    >
      <button
        onClick={handlePrint}
        style={btnStyle()}
      >
        Preview / Print
      </button>

      <button
        onClick={handleDownloadPdf}
        style={btnStyle()}
        title="PDF generation pending server implementation"
      >
        Download PDF
      </button>

      <a
        href={`/verify/${verificationId}`}
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle(GOLD)}
      >
        Open Verification ↗
      </a>

      <a
        href={`/dashboard/communications?matter_id=${matterId}&template=release`}
        style={linkStyle("rgba(255,255,255,0.5)")}
      >
        Send Release Notice
      </a>
    </div>
  );
}

function btnStyle(): React.CSSProperties {
  return {
    fontSize: 11,
    padding: "7px 14px",
    borderRadius: 3,
    background: "rgba(198,165,90,0.07)",
    border: "1px solid rgba(198,165,90,0.25)",
    color: GOLD,
    cursor: "pointer",
    letterSpacing: "0.04em",
  };
}

function linkStyle(color: string): React.CSSProperties {
  return {
    fontSize: 11,
    padding: "7px 14px",
    borderRadius: 3,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    color,
    textDecoration: "none",
    letterSpacing: "0.04em",
    display: "inline-block",
  };
}
