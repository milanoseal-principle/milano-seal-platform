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
      return;
    }
    window.print();
  }

  function handleSavePdf() {
    // The browser print dialog provides a truthful Save as PDF path without
    // pretending a server-generated artifact exists when it does not.
    handlePrint();
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
      <button onClick={handlePrint} style={btnStyle()}>
        Preview / Print
      </button>

      <button
        onClick={handleSavePdf}
        style={btnStyle()}
        title="Open the print dialog and choose Save as PDF"
      >
        Save as PDF
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
