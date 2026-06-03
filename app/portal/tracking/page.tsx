"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePortal } from "@/components/portal/portal-context";
import { PortalCourierCustody } from "@/components/portal/PortalCourierCustody";

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

const PATH_D = "M 50 110 C 120 30, 360 20, 590 110";

function statusToProgress(status: string | null | undefined): number {
  if (!status || status === "unknown") return 8;
  if (status === "in_transit") return 42;
  if (status === "out_for_delivery") return 76;
  if (status === "delivered") return 100;
  return 8;
}

function CourierViz({ status, carrier }: { status: string | null | undefined; carrier?: string | null }) {
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
      const ring = svg.querySelector<SVGCircleElement>(`#cv-ring-${i}`);
      if (ring) {
        ring.setAttribute("cx", String(pt.x));
        ring.setAttribute("cy", String(pt.y));
        ring.style.opacity = "0.3";
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

    // Set destination label
    const destLabel = svg.querySelector<SVGTextElement>("#cv-dest-label");
    if (destLabel && carrier) {
      destLabel.textContent = `${carrier.toUpperCase()} · IN TRANSIT`;
    }

    // Show moving dot and ring after path draws (1300ms)
    timerRef.current = setTimeout(() => {
      if (!movingDot || !pathEl) return;
      const pt = pathEl.getPointAtLength(progressLength);
      movingDot.setAttribute("cx", String(pt.x));
      movingDot.setAttribute("cy", String(pt.y));
      movingDot.style.opacity = "1";
      const movingRing = svg.querySelector<SVGCircleElement>("#cv-moving-dot-ring");
      if (movingRing) {
        movingRing.setAttribute("cx", String(pt.x));
        movingRing.setAttribute("cy", String(pt.y));
        movingRing.style.opacity = "0.2";
      }
    }, 1300);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [progressPct, carrier]);

  const glowId = "cv-glow";
  const emeraldGlowId = "cv-glow-emerald";

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox="0 0 640 160"
        className="ct-viz-svg"
        aria-hidden="true"
        style={{ width: "100%", display: "block" }}
      >
        <defs>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={emeraldGlowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1A1A1A" stopOpacity={0} />
            <stop offset="50%" stopColor="#D4AF37" stopOpacity={1} />
            <stop offset="100%" stopColor="#0A0A0A" stopOpacity={0.3} />
          </linearGradient>
        </defs>

        {/* Subtle grid — horizontal lines */}
        {[30, 60, 90, 120].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="640" y2={y} stroke="rgba(212,175,55,0.04)" strokeWidth="0.5" />
        ))}
        {/* Vertical lines */}
        {[80, 160, 240, 320, 400, 480, 560].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="160" stroke="rgba(212,175,55,0.04)" strokeWidth="0.5" />
        ))}

        {/* Equatorial reference line at y=110 */}
        <line x1="0" y1="110" x2="640" y2="110" stroke="rgba(212,175,55,0.06)" strokeWidth="0.5" strokeDasharray="4 6" />

        {/* Background path */}
        <path
          id="cv-path-bg"
          d={PATH_D}
          fill="none"
          stroke="rgba(212,175,55,0.08)"
          strokeWidth="1.5"
        />

        {/* Active (animated) path */}
        <path
          id="cv-path-active"
          d={PATH_D}
          fill="none"
          stroke={isDelivered ? emeraldColor : "url(#corridorGrad)"}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter={`url(#${isDelivered ? emeraldGlowId : glowId})`}
          strokeDasharray="0"
          strokeDashoffset="0"
        />

        {/* Checkpoint dots — positioned in useEffect */}
        {CHECKPOINTS.map((cp, i) => {
          const isPassed = progressPct / 100 >= cp.pct - 0.01;
          const isLastPassed = isPassed && (i === CHECKPOINTS.length - 1 || progressPct / 100 < CHECKPOINTS[i + 1].pct - 0.01);
          const dotColor = isPassed
            ? isDelivered && cp.pct === 1.0
              ? emeraldColor
              : goldColor
            : "rgba(212,175,55,0.15)";
          return (
            <g key={i}>
              {/* Pulsing outer ring on last passed checkpoint */}
              {isLastPassed && (
                <circle
                  id={`cv-ring-${i}`}
                  r={10}
                  fill="none"
                  stroke={isDelivered ? emeraldColor : goldColor}
                  strokeWidth="1"
                  style={{ opacity: 0, transition: "opacity 0.2s" }}
                  className="animate-ping"
                />
              )}
              <circle
                id={`cv-dot-${i}`}
                r={isPassed ? 5 : 3.5}
                fill={dotColor}
                stroke={isPassed ? (isDelivered && cp.pct === 1.0 ? emeraldColor : "rgba(212,175,55,0.3)") : "rgba(212,175,55,0.3)"}
                strokeWidth={isPassed ? 0 : 1}
                filter={isPassed ? `url(#${isDelivered && cp.pct === 1.0 ? emeraldGlowId : glowId})` : undefined}
                style={{ opacity: 0, transition: "opacity 0.2s" }}
              />
            </g>
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
          id="cv-moving-dot-ring"
          r={9}
          fill="none"
          stroke={isDelivered ? emeraldColor : goldColor}
          strokeWidth="1"
          style={{ opacity: 0, transition: "opacity 0.3s" }}
        />
        <circle
          id="cv-moving-dot"
          r={5}
          fill={activeColor}
          filter={`url(#${isDelivered ? emeraldGlowId : glowId})`}
          style={{ opacity: 0, transition: "opacity 0.3s" }}
        />

        {/* Origin label */}
        <text
          x="50"
          y="130"
          textAnchor="middle"
          fontSize="7.5"
          fontFamily="monospace"
          letterSpacing="0.08em"
          fill="rgba(255,255,255,0.5)"
        >
          Florida, USA
        </text>

        {/* Destination label — shown when tracking data present */}
        <text
          id="cv-dest-label"
          x="590"
          y="130"
          textAnchor="middle"
          fontSize="7.5"
          fontFamily="monospace"
          letterSpacing="0.06em"
          fill="rgba(255,255,255,0.5)"
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

const READINESS_STEPS = [
  {
    key: "identity",
    label: "Identity Verified",
    activeStatuses: [] as string[],
    doneStatuses: ["intake_received", "under_review", "compliance_review", "quoted", "awaiting_payment", "payment_confirmed", "scheduled", "in_execution", "apostille_processing", "courier_ready", "shipped", "delivered", "completed", "closed"],
  },
  {
    key: "authorized",
    label: "Execution Authorized",
    activeStatuses: ["quoted", "awaiting_payment"],
    doneStatuses: ["payment_confirmed", "scheduled", "in_execution", "apostille_processing", "courier_ready", "shipped", "delivered", "completed", "closed"],
  },
  {
    key: "apostille",
    label: "Apostille Eligible",
    activeStatuses: ["payment_confirmed", "scheduled"],
    doneStatuses: ["in_execution", "apostille_processing", "courier_ready", "shipped", "delivered", "completed", "closed"],
  },
  {
    key: "execution",
    label: "Documents Executed",
    activeStatuses: ["in_execution"],
    doneStatuses: ["apostille_processing", "courier_ready", "shipped", "delivered", "completed", "closed"],
  },
  {
    key: "courier",
    label: "Courier Prepared",
    activeStatuses: ["apostille_processing"],
    doneStatuses: ["courier_ready", "shipped", "delivered", "completed", "closed"],
  },
  {
    key: "release",
    label: "Awaiting Release",
    activeStatuses: ["courier_ready"],
    doneStatuses: ["shipped", "delivered", "completed", "closed"],
  },
  {
    key: "released",
    label: "Released",
    activeStatuses: ["shipped", "delivered"],
    doneStatuses: ["completed", "closed"],
  },
];

function ExecutionReadiness({ matterStatus }: { matterStatus: string }) {
  const doneCount = READINESS_STEPS.filter((s) =>
    s.doneStatuses.includes(matterStatus)
  ).length;
  const total = READINESS_STEPS.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid rgba(198,165,90,0.14)",
        borderRadius: 2,
        padding: "18px 20px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: 600,
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Execution Readiness</span>
        <span style={{ color: "#C6A55A", fontFamily: "monospace", fontSize: 10 }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 2,
          background: "rgba(198,165,90,0.12)",
          borderRadius: 1,
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: pct === 100 ? "#4a9e6b" : "#C6A55A",
            borderRadius: 1,
            transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>

      {READINESS_STEPS.map((step) => {
        const done = step.doneStatuses.includes(matterStatus);
        const active = step.activeStatuses.includes(matterStatus);
        const color = done ? "#4a9e6b" : active ? "#C6A55A" : "rgba(255,255,255,0.22)";
        const icon = done ? "✓" : active ? "●" : "○";

        return (
          <div
            key={step.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 0",
              borderBottom: "1px solid rgba(198,165,90,0.05)",
            }}
          >
            <span
              style={{
                color,
                fontSize: 9,
                fontWeight: 700,
                width: 12,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
            <span
              style={{
                fontSize: 11,
                color: done ? "#fff" : active ? "#C6A55A" : "rgba(255,255,255,0.32)",
                fontWeight: done || active ? 500 : 400,
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
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

      <ExecutionReadiness matterStatus={deal.matter_status ?? ""} />

      <PortalCourierCustody matterId={deal.id} />

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
          <div className="ct-viz-card" style={{ background: 'rgba(3,3,5,0.85)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 4, padding: '20px 20px 12px', backdropFilter: 'blur(12px)', boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.06)' }}>
            <div className="ct-card-h">Delivery Progress</div>
            <CourierViz status={t.delivery_status} carrier={t.carrier} />
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
