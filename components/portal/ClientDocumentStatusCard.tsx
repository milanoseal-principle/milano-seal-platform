import React from "react";
import type { DocumentLifecycleStatus } from "@/lib/documents/documentLifecycle";
import { getClientSafeDocumentStatus } from "@/lib/documents/documentLifecycle";

interface Props {
  documentName: string;
  lifecycleStatus: DocumentLifecycleStatus;
  clientSafeSummary?: string;
  signedUrl?: string | null;
  canDownload?: boolean;
}

export function ClientDocumentStatusCard({
  documentName,
  lifecycleStatus,
  clientSafeSummary,
  signedUrl,
  canDownload = false,
}: Props) {
  const safeStatus = getClientSafeDocumentStatus(lifecycleStatus);
  const isReleased = lifecycleStatus === "RELEASED";

  return (
    <div style={{
      background: "rgba(10,10,12,0.96)",
      border: "1px solid rgba(198,165,90,0.18)",
      borderRadius: 10,
      padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{documentName}</div>
          <div style={{
            fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
            color: isReleased ? "rgba(34,197,94,0.8)" : "rgba(198,165,90,0.75)",
          }}>
            {safeStatus}
          </div>
        </div>
        {canDownload && signedUrl && isReleased && (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11, padding: "7px 14px", borderRadius: 6, textDecoration: "none",
              background: "rgba(198,165,90,0.12)", border: "1px solid rgba(198,165,90,0.35)",
              color: "#C6A55A", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0,
            }}
          >
            Download
          </a>
        )}
      </div>
      {clientSafeSummary && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 10, lineHeight: 1.6 }}>
          {clientSafeSummary}
        </p>
      )}
    </div>
  );
}
