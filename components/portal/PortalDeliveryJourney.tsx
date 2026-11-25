"use client";

import { useEffect, useState } from "react";
import type { ClientDeliveryJourney } from "@/lib/shippo/deliveryJourney";

const GOLD = "#C6A55A";
const IVORY = "rgba(246,241,230,0.86)";
const MUTED = "rgba(255,255,255,0.42)";
const EMERALD = "#4a9e6b";
const AMBER = "#d9a441";

const eyebrow = {
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  fontFamily: "monospace",
  color: "rgba(198,165,90,0.6)",
};

function formatDate(value: string | null, withTime = false): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return withTime
    ? date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <dt style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, marginBottom: 2 }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 13, color: IVORY, overflowWrap: "anywhere" }}>{children}</dd>
    </div>
  );
}

/**
 * DOCUMENT DELIVERY — the client's single shipment journey for a Matter.
 * Reads the portal-safe courier endpoint (ownership-checked server-side) and
 * renders only evidence-backed milestones. No costs, label URLs, provider ids
 * or internal authority tracking are ever shown.
 */
export function PortalDeliveryJourney({ matterId }: { matterId: string }) {
  const [journey, setJourney] = useState<ClientDeliveryJourney | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    fetch(`/api/portal/me/courier?matter_id=${encodeURIComponent(matterId)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        const payload = (await response.json()) as { journey?: ClientDeliveryJourney };
        setJourney(payload.journey ?? null);
        setState("ready");
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name === "AbortError") return;
        setState("error");
      });
    return () => controller.abort();
  }, [matterId]);

  return (
    <section
      aria-labelledby="document-delivery-heading"
      data-testid="portal-delivery-journey"
      style={{
        background: "rgba(255,255,255,0.01)",
        border: "1px solid rgba(198,165,90,0.14)",
        borderRadius: 6,
        padding: "20px clamp(16px, 4vw, 28px)",
        marginBottom: 24,
      }}
    >
      <div style={eyebrow}>Document Delivery</div>
      <h2 id="document-delivery-heading" style={{ fontFamily: "serif", fontSize: 20, fontWeight: 400, color: IVORY, margin: "8px 0 6px" }}>
        {state === "ready" && journey ? journey.headline : "Your secure, tracked delivery"}
      </h2>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: MUTED, margin: "0 0 16px" }}>
        Your documents are coordinated through a secure, tracked delivery process. Updates appear as each step is verified.
      </p>

      {state === "loading" && <div aria-busy="true" aria-label="Loading delivery status" style={{ height: 40, background: "rgba(255,255,255,0.03)", borderRadius: 4 }} />}

      {state === "error" && (
        <p role="status" style={{ fontSize: 13, color: MUTED, margin: 0 }}>
          Delivery status is temporarily unavailable. Please check again shortly.
        </p>
      )}

      {state === "ready" && journey && (
        <>
          <ol aria-label="Delivery milestones" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {journey.milestones.map((milestone, index) => {
              const done = milestone.state === "complete";
              const current = milestone.state === "current";
              const dot = done ? (milestone.key === "delivered" ? EMERALD : GOLD) : current ? (journey.status === "attention" ? AMBER : GOLD) : "rgba(255,255,255,0.18)";
              return (
                <li
                  key={milestone.key}
                  aria-current={current ? "step" : undefined}
                  style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 12, alignItems: "start", minHeight: 34 }}
                >
                  <span aria-hidden style={{ position: "relative", display: "flex", justifyContent: "center", height: "100%" }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        marginTop: 4,
                        borderRadius: "50%",
                        background: done || current ? dot : "transparent",
                        border: `1px solid ${dot}`,
                        flexShrink: 0,
                      }}
                    />
                    {index < journey.milestones.length - 1 && (
                      <span style={{ position: "absolute", top: 18, bottom: -2, width: 1, background: done ? "rgba(198,165,90,0.35)" : "rgba(255,255,255,0.08)" }} />
                    )}
                  </span>
                  <span style={{ fontSize: 14, color: done || current ? IVORY : "rgba(255,255,255,0.32)", fontWeight: current ? 500 : 400, paddingBottom: 12 }}>
                    {milestone.label}
                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                      {done ? " — complete" : current ? " — current step" : " — upcoming"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          {journey.exception_message && (
            <p role="status" style={{ margin: "8px 0 0", padding: "10px 14px", borderRadius: 4, fontSize: 13, lineHeight: 1.5, color: IVORY, background: "rgba(217,164,65,0.06)", border: "1px solid rgba(217,164,65,0.25)" }}>
              {journey.exception_message}
            </p>
          )}

          {(journey.carrier || journey.destination_summary || journey.last_verified_update) && (
            <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px 24px", margin: "16px 0 0" }}>
              {journey.carrier && <Detail label="Carrier">{journey.carrier}</Detail>}
              {journey.tracking_number && (
                <Detail label="Tracking">
                  {journey.tracking_url ? (
                    <a
                      href={journey.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: GOLD, fontFamily: "monospace", textDecoration: "underline", textUnderlineOffset: 3 }}
                    >
                      {journey.tracking_number}
                      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}> (opens carrier site)</span>
                    </a>
                  ) : (
                    <span style={{ fontFamily: "monospace" }}>{journey.tracking_number}</span>
                  )}
                </Detail>
              )}
              {journey.destination_summary && <Detail label="Destination">{journey.destination_summary}</Detail>}
              {journey.delivered_at && <Detail label="Delivered">{formatDate(journey.delivered_at)}</Detail>}
              {!journey.delivered_at && journey.provider_eta && <Detail label="Carrier estimate">{formatDate(journey.provider_eta)}</Detail>}
              {journey.last_verified_update && <Detail label="Last carrier update">{formatDate(journey.last_verified_update, true)}</Detail>}
            </dl>
          )}

          {journey.authority_stages.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ ...eyebrow, fontSize: 10, marginBottom: 6 }}>Authentication courier</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {journey.authority_stages.map((step) => (
                  <li key={step.stage} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, color: MUTED, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span>{step.stage}</span>
                    <span style={{ color: IVORY }}>{step.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {journey.status !== "not_started" && (
            <p style={{ fontSize: 11, lineHeight: 1.6, color: "rgba(198,165,90,0.5)", margin: "14px 0 0" }}>{journey.release_note}</p>
          )}
        </>
      )}
    </section>
  );
}
