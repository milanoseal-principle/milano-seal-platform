"use client";

import { useEffect, useState } from "react";
import ShippoCourierMotionRail from "@/components/shipping/ShippoCourierMotionRail";
import ShippoStatusBadge from "@/components/shipping/ShippoStatusBadge";
import type { MilanoCourierStatus } from "@/lib/shippo/types";

interface PortalCourierCustodyProps {
  matterId: string;
}

interface CourierEvent {
  status: string | null;
  status_details: string | null;
  status_date: string | null;
  city?: string | null;
  country?: string | null;
}

interface CourierApiResponse {
  courier_status: string | null;
  carrier: string | null;
  tracking_number_display: string | null;
  tracking_url: string | null;
  events: CourierEvent[];
}

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";

function fmt(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PortalCourierCustody({ matterId }: PortalCourierCustodyProps) {
  const [data, setData] = useState<CourierApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/me/courier?matter_id=${matterId}`)
      .then((r) => (r.ok ? (r.json() as Promise<CourierApiResponse>) : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [matterId]);

  const rawStatus = data?.courier_status?.toUpperCase() ?? "UNKNOWN";
  const status = rawStatus as MilanoCourierStatus;
  const isDelivered = rawStatus === "DELIVERED";
  const isException = rawStatus === "EXCEPTION" || rawStatus === "RETURNED";
  const hasData =
    data != null &&
    (data.courier_status != null ||
      (Array.isArray(data.events) && data.events.length > 0));

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.01)",
        border: "1px solid rgba(198,165,90,0.14)",
        borderRadius: 6,
        padding: "24px 28px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Courier &amp; Delivery
      </div>

      {loading && (
        <div
          style={{
            height: 32,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 4,
          }}
        />
      )}

      {!loading && !hasData && (
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            lineHeight: 1.6,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          Courier tracking will appear once your document is released to carrier
          custody.
        </p>
      )}

      {!loading && hasData && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <ShippoCourierMotionRail
              status={status}
              carrier={data?.carrier}
              trackingNumberDisplay={data?.tracking_number_display}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <ShippoStatusBadge status={status} size="md" />
          </div>

          {isDelivered && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 4,
                background: "rgba(63,164,122,0.06)",
                border: "1px solid rgba(63,164,122,0.2)",
                marginBottom: 14,
              }}
            >
              <p
                style={{ margin: 0, fontSize: 12, color: EMERALD, lineHeight: 1.5 }}
              >
                Your document has been delivered. Final release review is
                pending.
              </p>
            </div>
          )}

          {isException && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 4,
                background: "rgba(184,92,92,0.06)",
                border: "1px solid rgba(184,92,92,0.2)",
                marginBottom: 14,
              }}
            >
              <p
                style={{ margin: 0, fontSize: 12, color: "#B85C5C", lineHeight: 1.5 }}
              >
                A delivery exception has been flagged. Your coordinator has been
                alerted.
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px 24px",
              marginBottom: 16,
            }}
          >
            {data?.carrier && (
              <div>
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 2,
                  }}
                >
                  Carrier
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.65)",
                    textTransform: "uppercase",
                  }}
                >
                  {data.carrier}
                </div>
              </div>
            )}

            {data?.tracking_number_display && (
              <div>
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 2,
                  }}
                >
                  Tracking
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.65)",
                    fontFamily: "monospace",
                    letterSpacing: "0.05em",
                  }}
                >
                  {data.tracking_number_display}
                </div>
              </div>
            )}

            {data?.tracking_url && (
              <div>
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 2,
                  }}
                >
                  Track Online
                </div>
                <a
                  href={data.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: GOLD,
                    textDecoration: "none",
                    borderBottom: `1px solid rgba(198,165,90,0.3)`,
                  }}
                >
                  Open carrier tracking ↗
                </a>
              </div>
            )}
          </div>

          {Array.isArray(data?.events) && data.events.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 10,
                }}
              >
                Tracking Events
              </div>
              {data.events.slice(0, 8).map((ev, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(198,165,90,0.06)",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: i === 0 ? GOLD : "rgba(255,255,255,0.2)",
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.65)",
                        marginBottom: 2,
                      }}
                    >
                      {ev.status_details ?? ev.status ?? "Update"}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "monospace",
                      }}
                    >
                      {ev.status_date ? fmt(ev.status_date) : ""}
                      {ev.city ? ` · ${ev.city}` : ""}
                      {ev.country ? `, ${ev.country}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
