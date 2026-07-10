import type { PortalMatter } from "@/lib/portal2/types";
import { assertClientSafe } from "@/lib/portal2/portalSafety";
import { GOLD, GOLD_FAINT, INK, INK_DIM, SampleBadge } from "./_ui";
import { LiveStatusRail } from "./LiveStatusRail";
import { MatterTimeline } from "./MatterTimeline";
import { DocumentVaultPanel } from "./DocumentVaultPanel";
import { InvoiceCenterPanel } from "./InvoiceCenterPanel";
import { UploadCenterPanel } from "./UploadCenterPanel";
import { ExecutionChecklistPanel } from "./ExecutionChecklistPanel";
import { CourierTrackingPanel } from "./CourierTrackingPanel";
import { ApostilleTimelinePanel } from "./ApostilleTimelinePanel";
import { RONTimelinePanel } from "./RONTimelinePanel";
import { CountryReadinessPanel } from "./CountryReadinessPanel";
import { FinalReleaseVault } from "./FinalReleaseVault";
import { CompletionCertificate } from "./CompletionCertificate";

export function ClientPortalShell({
  matter,
  isSample = false,
}: {
  matter: PortalMatter | null;
  isSample?: boolean;
}) {
  // Defensive guard: never render a matter carrying operator-only fields.
  if (matter) assertClientSafe(matter);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", fontFamily: "monospace", color: "rgba(198,165,90,0.55)" }}>
          The Milano Seal™ · Client Portal 2.0
        </div>
        <h1
          style={{
            margin: "8px 0 6px",
            fontSize: 26,
            fontWeight: 600,
            color: GOLD,
            fontFamily: "var(--font-serif, Georgia, serif)",
            letterSpacing: "0.01em",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {matter ? (matter.clientName ? `Welcome, ${matter.clientName.split(" ")[0]}` : "Your Matter") : "Client Portal"}
          {isSample && <SampleBadge />}
        </h1>
        <div style={{ fontSize: 12.5, color: INK, lineHeight: 1.5 }}>
          {matter
            ? `${matter.documentType ?? "Document execution"} · ${matter.destinationCountry ?? "—"} · Matter ${matter.displayId}`
            : "Your matter, documents, payment, and release tracking in one secure view."}
        </div>
      </div>

      {/* Payment-gate note (read-only, no client-trusted payment state) */}
      <div
        style={{
          border: `1px solid ${GOLD_FAINT}`,
          background: "rgba(198,165,90,0.04)",
          borderRadius: 6,
          padding: "10px 14px",
          marginBottom: 22,
          fontSize: 11.5,
          color: INK,
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: GOLD }}>Note:</span> Scheduling unlocks only after payment is confirmed by the platform.
        Status shown here is read-only and reflects the platform&apos;s confirmed record — it never changes your payment
        or release state.
      </div>

      {isSample && (
        <div
          style={{
            border: `1px dashed ${GOLD_FAINT}`,
            borderRadius: 6,
            padding: "10px 14px",
            marginBottom: 22,
            fontSize: 11.5,
            color: INK_DIM,
            lineHeight: 1.5,
          }}
        >
          No live matter is linked to this account yet. The panels below show clearly-labeled <strong>sample</strong>{" "}
          content to preview the experience. Your real matter data will replace it once your matter is active.
        </div>
      )}

      {/* Two-column responsive grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div>
          <LiveStatusRail matter={matter} />
          <MatterTimeline matter={matter} />
          <ExecutionChecklistPanel matter={matter} />
          <RONTimelinePanel matter={matter} />
          <ApostilleTimelinePanel matter={matter} />
          <CourierTrackingPanel matter={matter} />
        </div>
        <div>
          <InvoiceCenterPanel matter={matter} />
          <UploadCenterPanel />
          <DocumentVaultPanel matter={matter} />
          <CountryReadinessPanel matter={matter} />
          <FinalReleaseVault matter={matter} />
          <CompletionCertificate matter={matter} />
        </div>
      </div>
    </div>
  );
}
