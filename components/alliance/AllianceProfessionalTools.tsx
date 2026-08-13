"use client";

import { useMemo, useState } from "react";
import {
  evaluateDocumentReadiness,
  projectApostilleRoute,
  type DocumentReadinessInput,
  type IssuingAuthority,
  type ReadinessStatus,
} from "@/lib/alliance/professionalToolbelt";

const statusStyles: Record<ReadinessStatus, { border: string; text: string; bg: string }> = {
  READY: { border: "#4D7C5A", text: "#A7D7B2", bg: "rgba(77,124,90,.12)" },
  REVIEW_REQUIRED: { border: "#C6A55A", text: "#E5C978", bg: "rgba(198,165,90,.10)" },
  BLOCKED: { border: "#8B4B4B", text: "#E5A3A3", bg: "rgba(139,75,75,.12)" },
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 42,
  borderRadius: 10,
  border: "1px solid rgba(198,165,90,.24)",
  background: "rgba(14,14,15,.72)",
  color: "#F6F1E6",
  padding: "9px 11px",
  outline: "none",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(198,165,90,.18)",
  background: "linear-gradient(180deg, rgba(29,27,24,.96), rgba(14,14,15,.98))",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 18px 60px rgba(0,0,0,.24)",
};

function StatusPill({ status }: { status: ReadinessStatus }) {
  const style = statusStyles[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", border: `1px solid ${style.border}`, background: style.bg, color: style.text, borderRadius: 999, padding: "5px 9px", fontSize: 10, fontFamily: "monospace", letterSpacing: ".12em", fontWeight: 700 }}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function BooleanCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 42, cursor: "pointer", color: "#D6D0C3", fontSize: 13 }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} style={{ width: 16, height: 16, accentColor: "#C6A55A" }} />
      <span>{label}</span>
    </label>
  );
}

export function AllianceProfessionalTools() {
  const [originState, setOriginState] = useState("Florida");
  const [destinationCountry, setDestinationCountry] = useState("Italy");
  const [documentType, setDocumentType] = useState("Power of Attorney");
  const [issuingAuthority, setIssuingAuthority] = useState<IssuingAuthority>("private");
  const [urgency, setUrgency] = useState<"standard" | "expedited" | "rush">("standard");
  const [readiness, setReadiness] = useState<DocumentReadinessInput>({
    documentPresent: true,
    signatureBlocksPresent: true,
    signerCountKnown: true,
    datesComplete: true,
    venuePresent: true,
    notarialWordingConfirmed: true,
    missingPages: false,
    duplicatePages: false,
    scanUsable: true,
    foreignLanguage: false,
    destinationConfirmed: true,
    authenticationPathConfirmed: true,
  });

  const route = useMemo(() => projectApostilleRoute({ originState, destinationCountry, documentType, issuingAuthority, urgency }), [originState, destinationCountry, documentType, issuingAuthority, urgency]);
  const readinessResult = useMemo(() => evaluateDocumentReadiness(readiness), [readiness]);
  const toggle = (key: keyof DocumentReadinessInput, next: boolean) => setReadiness((current) => ({ ...current, [key]: next }));

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div>
        <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: ".18em", color: "#C6A55A", textTransform: "uppercase", marginBottom: 7 }}>Professional Execution Intelligence</div>
        <h2 style={{ margin: 0, color: "#F6F1E6", fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 22, fontWeight: 400 }}>Apostille Route Architect + Document Readiness Scan</h2>
        <p style={{ margin: "8px 0 0", color: "#A8A29A", fontSize: 13, lineHeight: 1.6 }}>Governed routing projections over the existing Milano Seal country-intelligence registry. Unresolved execution facts fail closed to review.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <div><div style={{ color: "#F6F1E6", fontSize: 16, fontWeight: 600 }}>Apostille Route Architect</div><div style={{ color: "#8F897F", fontSize: 12, marginTop: 4 }}>Operational route projection</div></div>
            <StatusPill status={route.routeStatus} />
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ color: "#A8A29A", fontSize: 12 }}>Originating U.S. state<input value={originState} onChange={(event) => setOriginState(event.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <label style={{ color: "#A8A29A", fontSize: 12 }}>Destination country<input value={destinationCountry} onChange={(event) => setDestinationCountry(event.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <label style={{ color: "#A8A29A", fontSize: 12 }}>Document type<input value={documentType} onChange={(event) => setDocumentType(event.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <label style={{ color: "#A8A29A", fontSize: 12 }}>Issuing authority<select value={issuingAuthority} onChange={(event) => setIssuingAuthority(event.target.value as IssuingAuthority)} style={{ ...fieldStyle, marginTop: 6 }}><option value="private">Private / notarized</option><option value="state">State</option><option value="county">County</option><option value="court">Court</option><option value="federal">Federal</option><option value="unknown">Unknown / review needed</option></select></label>
            <label style={{ color: "#A8A29A", fontSize: 12 }}>Urgency<select value={urgency} onChange={(event) => setUrgency(event.target.value as typeof urgency)} style={{ ...fieldStyle, marginTop: 6 }}><option value="standard">Standard</option><option value="expedited">Expedited</option><option value="rush">Rush / same-day review</option></select></label>
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(198,165,90,.12)" }}>
            <div style={{ color: "#C6A55A", fontSize: 11, fontFamily: "monospace", letterSpacing: ".12em" }}>{route.destination.routeLabel}</div>
            <div style={{ color: "#F6F1E6", fontSize: 14, marginTop: 7 }}>{route.destination.displayName}</div>
            <div style={{ color: "#A8A29A", fontSize: 12, lineHeight: 1.55, marginTop: 7 }}>{route.destination.authoritySummary}</div>
            <div style={{ marginTop: 14, display: "grid", gap: 7 }}>{route.authorityPath.map((step) => <div key={step} style={{ color: "#D6D0C3", fontSize: 12 }}><span style={{ color: "#C6A55A", marginRight: 7 }}>→</span>{step}</div>)}</div>
            <div style={{ marginTop: 14, color: "#A8A29A", fontSize: 12, lineHeight: 1.55 }}><strong style={{ color: "#D6D0C3" }}>Translation:</strong> {route.translationConsideration}</div>
            <div style={{ marginTop: 8, color: "#A8A29A", fontSize: 12, lineHeight: 1.55 }}><strong style={{ color: "#D6D0C3" }}>Consular:</strong> {route.consularConsideration}</div>
            {route.reviewReasons.length > 0 && <div style={{ marginTop: 14, display: "grid", gap: 6 }}>{route.reviewReasons.map((reason) => <div key={reason} style={{ color: "#E5C978", fontSize: 12 }}>Review: {reason}</div>)}</div>}
            <div style={{ marginTop: 16, border: "1px solid rgba(198,165,90,.16)", background: "rgba(198,165,90,.05)", borderRadius: 10, padding: 11, color: "#A8A29A", fontSize: 11, lineHeight: 1.55 }}>{route.safetyNotice}</div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}><div><div style={{ color: "#F6F1E6", fontSize: 16, fontWeight: 600 }}>Document Readiness Scan</div><div style={{ color: "#8F897F", fontSize: 12, marginTop: 4 }}>Fail-closed execution preflight</div></div><StatusPill status={readinessResult.status} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", columnGap: 12 }}>
            <BooleanCheck label="Document present" checked={readiness.documentPresent} onChange={(v) => toggle("documentPresent", v)} /><BooleanCheck label="Signature blocks present" checked={readiness.signatureBlocksPresent} onChange={(v) => toggle("signatureBlocksPresent", v)} /><BooleanCheck label="Signer count known" checked={readiness.signerCountKnown} onChange={(v) => toggle("signerCountKnown", v)} /><BooleanCheck label="Dates complete" checked={readiness.datesComplete} onChange={(v) => toggle("datesComplete", v)} /><BooleanCheck label="Venue present" checked={readiness.venuePresent} onChange={(v) => toggle("venuePresent", v)} /><BooleanCheck label="Notarial wording confirmed" checked={readiness.notarialWordingConfirmed} onChange={(v) => toggle("notarialWordingConfirmed", v)} /><BooleanCheck label="Missing pages" checked={readiness.missingPages} onChange={(v) => toggle("missingPages", v)} /><BooleanCheck label="Duplicate pages" checked={readiness.duplicatePages} onChange={(v) => toggle("duplicatePages", v)} /><BooleanCheck label="Scan usable" checked={readiness.scanUsable} onChange={(v) => toggle("scanUsable", v)} /><BooleanCheck label="Foreign language" checked={readiness.foreignLanguage} onChange={(v) => toggle("foreignLanguage", v)} /><BooleanCheck label="Destination confirmed" checked={readiness.destinationConfirmed} onChange={(v) => toggle("destinationConfirmed", v)} /><BooleanCheck label="Authentication path confirmed" checked={readiness.authenticationPathConfirmed} onChange={(v) => toggle("authenticationPathConfirmed", v)} />
          </div>
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            {readinessResult.blockers.length > 0 && <div><div style={{ color: "#E5A3A3", fontSize: 11, fontWeight: 700, marginBottom: 5 }}>BLOCKERS</div>{readinessResult.blockers.map((item) => <div key={item} style={{ color: "#D7B4B4", fontSize: 12, marginTop: 4 }}>• {item}</div>)}</div>}
            {readinessResult.reviewItems.length > 0 && <div><div style={{ color: "#E5C978", fontSize: 11, fontWeight: 700, marginBottom: 5 }}>REVIEW REQUIRED</div>{readinessResult.reviewItems.map((item) => <div key={item} style={{ color: "#D8C69B", fontSize: 12, marginTop: 4 }}>• {item}</div>)}</div>}
            {readinessResult.status === "READY" && <div style={{ color: "#A7D7B2", fontSize: 12, lineHeight: 1.55 }}>Required preflight facts are presently satisfied. Final execution remains governed by the canonical Milano Seal Matter, compliance, payment, and execution gates.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
