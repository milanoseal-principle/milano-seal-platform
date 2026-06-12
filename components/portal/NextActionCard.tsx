"use client";

import { getClientNextAction } from "@/lib/intelligence/client-guidance";
import { getClientSafeCountrySummaryBySlug, countryNameToSlug } from "@/lib/atlas/atlas-pathway";
import { LEGACY_CLIENT_INTAKE_HREF } from "@/lib/pricing/legacy-client-credit";
import type { PortalClientMatter } from "@/components/portal/portal-context";

interface NextActionCardProps {
  matter: PortalClientMatter;
}

export function NextActionCard({ matter }: NextActionCardProps) {
  const action = getClientNextAction({
    matter_status: matter.matter_status,
    payment_confirmed: matter.payment_confirmed,
    is_platform_fee_only: matter.is_platform_fee_only,
    courier_tracking_id: matter.courier_tracking_id,
  });

  // Client-safe destination pathway note — never exposes operator intelligence
  const destinationSlug = matter.destination_country
    ? countryNameToSlug(matter.destination_country)
    : undefined;
  const destinationNote = destinationSlug
    ? getClientSafeCountrySummaryBySlug(destinationSlug)
    : undefined;

  return (
    <div
      style={{
        background: "rgba(10,10,10,0.7)",
        border: "1px solid rgba(198,165,90,0.28)",
        borderRadius: 8,
        padding: "16px 20px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.6)",
          marginBottom: 10,
          fontFamily: "Georgia, serif",
        }}
      >
        Required Action
      </div>
      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.88)",
          lineHeight: 1.55,
          fontFamily: "Georgia, serif",
        }}
      >
        {action}
      </div>
      {destinationNote && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid rgba(198,165,90,0.12)",
            fontSize: 12,
            color: "rgba(255,255,255,0.42)",
            lineHeight: 1.6,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {destinationNote}
        </div>
      )}

      {matter.legacy_client_credit?.status === "active" && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid rgba(198,165,90,0.15)",
          }}
        >
          <div
            style={{
              background: "rgba(198,165,90,0.06)",
              border: "1px solid rgba(198,165,90,0.22)",
              borderRadius: 6,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "rgba(198,165,90,0.7)",
                fontFamily: "monospace",
                marginBottom: 6,
              }}
            >
              First Client Legacy Courtesy Credit Available
            </p>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.82)",
                lineHeight: 1.55,
                fontFamily: "Georgia, serif",
                marginBottom: 10,
              }}
            >
              {matter.legacy_client_credit.client_safe_note}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1.5,
                fontFamily: "system-ui, sans-serif",
                marginBottom: 12,
              }}
            >
              Third-party, platform, courier, state, government, and filing fees remain separate.
            </p>
            <a
              href={LEGACY_CLIENT_INTAKE_HREF}
              style={{
                display: "inline-block",
                background: "rgba(198,165,90,0.12)",
                border: "1px solid rgba(198,165,90,0.35)",
                color: "rgba(198,165,90,0.9)",
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "7px 14px",
                textDecoration: "none",
              }}
            >
              Start Next Matter
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
