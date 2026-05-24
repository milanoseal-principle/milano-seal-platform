"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePortal } from "@/components/portal/portal-context";

interface TrackingResponse {
  tracking: null | {
    carrier: string;
    tracking_number: string;
    delivery_status: string | null;
    delivery_eta: string | null;
    delivery_timestamp: string | null;
    signed_by: string | null;
    evidence_url?: string | null;
    evidence_generated_at?: string | null;
    live: {
      tracking_status?: {
        status?: string;
        status_details?: string;
        location?: { city?: string; state?: string; country?: string };
        status_date?: string;
      };
      eta?: string;
    } | null;
  };
}

const STATUS_LABEL: Record<string, string> = {
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Delivery Issue",
  unknown: "Unknown",
};

const STATUS_COLOR: Record<string, string> = {
  in_transit: "#9b7ed4",
  out_for_delivery: "#c8973a",
  delivered: "#4a9e6b",
  failed: "#c05050",
  unknown: "#888",
};

const CHECKPOINTS = [
  { label: "Origin", pct: 0 },
  { label: "In Transit", pct: 0.38 },
  { label: "Out for Delivery", pct: 0.73 },
  { label: "Delivered", pct: 1.0 },
];

const PATH_D = "M 30 55 Q 150 22 270 55 Q 390 88 510 55";

function statusToProgress(status: string | null | undefined): number {
  if (!status || status === "unknown") return 8;
  if (status === "in_transit") return 42;
  if (status === "out_for_delivery") return 76;
  if (status === "delivered") return 100;
  return 8;
}

function CourierViz({ status }: { status: string | null | undefined }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progressPct = statusToProgress(status);
  const isDelivered = status === "delivered";
  const goldColor = "#C6A55A";
  const emeraldColor = "#4a9e6b";
  const activeColor = isDelivered ? emeraldColor : goldColor;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const pathEl = svg.querySelector<SVGPathElement>("#cv-path-bg");
    const activePathEl = svg.querySelector<SVGPathElement>("#cv-path-active");
    const movingDot = svg.querySelector<SVGCircleElement>("#cv-moving-dot");

    if (!pathEl || !activePathEl || !movingDot) return;

    const totalLength = pathEl.getTotalLength();

    // Position checkpoint dots and labels via getPointAtLength
    CHECKPOINTS.forEach((cp, i) => {
      const t = cp.pct;
      const pt = pathEl.getPointAtLength(t * totalLength);

      const dot = svg.querySelector<SVGCircleElement>(`#cv-dot-${i}`);
      const label = svg.querySelector<SVGTextElement>(`#cv-label-${i}`);

      if (dot) {
        dot.setAttribute("cx", String(pt.x));
        dot.setAttribute("cy", String(pt.y));
        dot.style.opacity = "1";
      }
      if (label) {
        label.setAttribute("x", String(pt.x));
        // Alternate above/below: i%2===1 → above (y-14), else below (y+18)
        const yOffset = i % 2 === 1 ? pt.y - 14 : pt.y + 18;
        label.setAttribute("y", String(yOffset));
        label.style.opacity = "1";
      }
    });

    // Animate active path draw-in via stroke-dashoffset
    const progressLength = (progressPct / 100) * totalLength;
    activePathEl.setAttribute("stroke-dasharray", String(totalLength));
    activePathEl.setAttribute("stroke-dashoffset", String(totalLength));

    const duration = 1500; // 1.5s
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const frac = Math.min(elapsed / duration, 1);
      // ease: cubicOut approximation
      const ease = 1 - Math.pow(1 - frac, 3);
      const currentOffset = totalLength - progressLength * ease;
      if (activePathEl) {
        activePathEl.setAttribute("stroke-dashoffset", String(currentOffset));
      }
      if (frac < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    // Show moving dot after path draws (1300ms)
    timerRef.current = setTimeout(() => {
      if (!movingDot || !pathEl) return;
      const pt = pathEl.getPointAtLength(progressLength);
      movingDot.setAttribute("cx", String(pt.x));
      movingDot.setAttribute("cy", String(pt.y));
      movingDot.style.opacity = "1";
    }, 1300);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [progressPct]);

  const glowId = "cv-glow";
  const emeraldGlowId = "cv-glow-emerald";

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox="0 0 540 90"
        className="ct-viz-svg"
        aria-hidden="true"
      >
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id={emeraldGlowId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background path */}
        <path
          id="cv-path-bg"
          d={PATH_D}
          fill="none"
          stroke="rgba(198,165,90,0.12)"
          strokeWidth="2"
        />

        {/* Active (animated) path */}
        <path
          id="cv-path-active"
          d={PATH_D}
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter={`url(#${isDelivered ? emeraldGlowId : glowId})`}
          strokeDasharray="0"
          strokeDashoffset="0"
        />

        {/* Checkpoint dots — positioned in useEffect */}
        {CHECKPOINTS.map((cp, i) => {
          const isPassed =
            progressPct / 100 >= cp.pct - 0.01;
          const dotColor = isPassed
            ? isDelivered && cp.pct === 1.0
              ? emeraldColor
              : goldColor
            : "rgba(198,165,90,0.2)";
          return (
            <circle
              key={i}
              id={`cv-dot-${i}`}
              r={isPassed ? 5 : 3.5}
              fill={dotColor}
              filter={
                isPassed
                  ? `url(#${isDelivered && cp.pct === 1.0 ? emeraldGlowId : glowId})`
                  : undefined
              }
              style={{ opacity: 0, transition: "opacity 0.2s" }}
            />
          );
        })}

        {/* Checkpoint labels */}
        {CHECKPOINTS.map((_, i) => (
          <text
            key={i}
            id={`cv-label-${i}`}
            textAnchor="middle"
            fontSize="7"
            fontFamily="monospace"
            letterSpacing="0.1em"
            fill="rgba(255,255,255,0.45)"
            style={{ opacity: 0, transition: "opacity 0.2s", textTransform: "uppercase" }}
          >
            {CHECKPOINTS[i].label}
          </text>
        ))}

        {/* Moving gold dot — positioned + shown in useEffect */}
        <circle
          id="cv-moving-dot"
          r={6}
          fill={activeColor}
          filter={`url(#${isDelivered ? emeraldGlowId : glowId})`}
          style={{ opacity: 0, transition: "opacity 0.3s" }}
        />
      </svg>

      <div className="ct-viz-meta">
        <span className="ct-viz-pct">{progressPct}%</span>
        <span className="ct-viz-divider">·</span>
        <span className="ct-viz-status">
          {STATUS_LABEL[status ?? "unknown"] ?? "Pre-Shipment"}
        </span>
      </div>
    </div>
  );
}

export default function ClientTrackingPage() {
  const { deal, isLoading: dealLoading } = usePortal();
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deal) return;
    void (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/portal/me/tracking?deal_id=${deal.id}`, {
          cache: "no-store",
        });
        if (r.ok) setData((await r.json()) as TrackingResponse);
      } finally {
        setLoading(false);
      }
    })();
  }, [deal]);

  if (dealLoading || loading) {
    return (
      <div style={{ paddingTop: 8 }}>
        {[55, 100, 78].map((w, i) => (
          <div
            key={i}
            style={{
              height: i === 0 ? 20 : i === 1 ? 96 : 64,
              borderRadius: 2,
              marginBottom: 14,
              background: "rgba(198,165,90,0.05)",
              border: "1px solid rgba(198,165,90,0.08)",
              animation: "ppSkeleton 2s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
              width: `${w}%`,
            }}
          />
        ))}
      </div>
    );
  }
  if (!deal) {
    return (
      <div style={{ color: "rgba(255,255,255,.5)" }}>
        No matter linked to this account.
      </div>
    );
  }

  const t = data?.tracking;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="ct-eyebrow">Shipment Tracking</div>
      <h1 className="ct-h1">Carrier &amp; Delivery</h1>

      {!t ? (
        <div className="ct-empty">
          <div className="ct-empty-h">Not yet shipped</div>
          <div className="ct-empty-p">
            We&rsquo;ll show carrier, tracking number, and live delivery updates
            here once your matter is dispatched.
          </div>
        </div>
      ) : (
        <>
          <div className="ct-viz-card">
            <div className="ct-card-h">Delivery Progress</div>
            <CourierViz status={t.delivery_status} />
          </div>

          <div className="ct-card">
            <div className="ct-card-h">Shipment Summary</div>

            <div className="ct-kv">
              <span className="ct-kv-k">Carrier</span>
              <span className="ct-kv-v">{t.carrier.toUpperCase()}</span>
            </div>
            <div className="ct-kv">
              <span className="ct-kv-k">Tracking #</span>
              <span className="ct-kv-v ct-kv-v mono">{t.tracking_number}</span>
            </div>
            <div className="ct-kv">
              <span className="ct-kv-k">Status</span>
              <span
                className="ct-status-pill"
                style={{
                  color: STATUS_COLOR[t.delivery_status ?? "unknown"],
                  borderColor: STATUS_COLOR[t.delivery_status ?? "unknown"],
                }}
              >
                {STATUS_LABEL[t.delivery_status ?? "unknown"] ?? "—"}
              </span>
            </div>
            {t.delivery_eta && (
              <div className="ct-kv">
                <span className="ct-kv-k">Estimated Delivery</span>
                <span className="ct-kv-v">
                  {new Date(t.delivery_eta).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {t.signed_by && (
              <div className="ct-kv">
                <span className="ct-kv-k">Signed By</span>
                <span className="ct-kv-v">{t.signed_by}</span>
              </div>
            )}
            {t.delivery_timestamp && (
              <div className="ct-kv">
                <span className="ct-kv-k">Delivered At</span>
                <span className="ct-kv-v">
                  {new Date(t.delivery_timestamp).toLocaleString()}
                </span>
              </div>
            )}
            {t.live?.tracking_status?.location?.city && (
              <div className="ct-kv">
                <span className="ct-kv-k">Last Location</span>
                <span className="ct-kv-v">
                  {t.live.tracking_status.location.city}
                  {t.live.tracking_status.location.state
                    ? `, ${t.live.tracking_status.location.state}`
                    : ""}
                </span>
              </div>
            )}
            {t.live?.tracking_status?.status_details && (
              <div className="ct-kv">
                <span className="ct-kv-k">Latest Update</span>
                <span className="ct-kv-v ct-kv-v light">
                  {t.live.tracking_status.status_details}
                </span>
              </div>
            )}
          </div>

          {t.delivery_status === "delivered" && (
            <div className="ct-card">
              <div className="ct-card-h">Delivery Proof</div>
              <p className="ct-proof-desc">
                Your matter is closed. We&rsquo;ve generated a court-ready
                evidence packet that captures the entire chain of custody — from
                intake to signature — with a tamper-evident hash chain.
              </p>
              <a
                href={t.evidence_url ?? `/api/evidence/${deal.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ct-link ct-link-btn"
              >
                Download Evidence Packet (PDF)
              </a>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
