"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";

/* ─── Geographic nodes ──────────────────────────────────────── */
const NODES: [number, number][] = [
  [-80.19,  25.77],  // 0  Miami — execution origin
  [-74.01,  40.71],  // 1  New York
  [ 12.49,  41.90],  // 2  Rome (Hague)
  [  2.35,  48.86],  // 3  Paris (Hague)
  [ 55.30,  25.20],  // 4  Dubai
  [139.69,  35.69],  // 5  Tokyo
  [-46.63, -23.55],  // 6  São Paulo
  [-74.07,   4.71],  // 7  Bogotá
  [-99.13,  19.43],  // 8  Mexico City
  [ -3.70,  40.42],  // 9  Madrid (Hague)
  [103.82,   1.35],  // 10 Singapore
  [ 28.98,  41.01],  // 11 Istanbul
  [151.21, -33.87],  // 12 Sydney
];

const ARC_PAIRS: [number, number][] = [
  [0, 1], [0, 3], [0, 2], [0, 6], [0, 7], [0, 8], [0, 9],
  [3, 4], [2, 11], [4, 10], [3, 9], [1, 5], [5, 12],
];

const STEPS = [
  "Verifying secure workspace",
  "Preparing Global Document Intelligence",
  "Reviewing execution pathway",
  "Checking payment-gated scheduling",
  "Structuring chain-of-custody visibility",
  "Ready for review",
] as const;

/* ─── Timing (ms) — ceremonial cadence ─────────────────────── */
const T = {
  rings:    1800,   // vault rings form
  seal:     2250,   // M seal assembly begins (blur → sharpen)
  brand:    3000,   // wordmark resolves (150ms buffer after assembly)
  progress: 3900,   // progress bar fills
  section:  4200,   // checklist section label
  checks:   [4500, 4780, 5060, 5300, 5560, 5780] as number[],
  vault:    5950,   // rings click to home + seal flash
  ready:    6250,   // SECURE WORKSPACE READY lit + click enabled
  exit:     7550,   // auto-fade (1300ms hold after ready)
  gone:     8400,   // unmount
};

/* ─── Canvas helpers ────────────────────────────────────────── */
function project(lon: number, lat: number, w: number, h: number): [number, number] {
  // Maintain 2:1 world-map aspect ratio, centered in the canvas.
  // Prevents vertical stretch on portrait mobile screens.
  const scale = Math.min(w / 360, h / 180);
  const ox = (w - 360 * scale) / 2;
  const oy = (h - 180 * scale) / 2;
  return [ox + (lon + 180) * scale, oy + (90 - lat) * scale];
}

function quad(t: number, a: number, b: number, c: number) {
  return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
}

const idle = (cb: () => void) =>
  typeof requestIdleCallback !== "undefined"
    ? requestIdleCallback(cb, { timeout: 2000 })
    : setTimeout(cb, 100);

/* ─── Component ─────────────────────────────────────────────── */
type Phase = "enter" | "rings" | "active" | "vault" | "ready" | "exit" | "gone";

export function RitualOverlay() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef       = useRef<number>(0);
  const t0Ref        = useRef<number>(0);
  const dismissRef   = useRef<(() => void) | null>(null);

  const [checked,       setChecked]       = useState<number[]>([]);
  const [phase,         setPhase]         = useState<Phase>("enter");
  const [showSeal,      setShowSeal]      = useState(false);
  const [discBorn,      setDiscBorn]      = useState(false);
  const [discBreathe,   setDiscBreathe]   = useState(false);
  const [showContent,   setShowContent]   = useState(false);
  const [showProgress,  setShowProgress]  = useState(false);
  const [showSection,   setShowSection]   = useState(false);
  const [readyForExit,  setReadyForExit]  = useState(false);

  /* ── Canvas render loop ─────────────────────────────────── */
  const render = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!t0Ref.current) t0Ref.current = now;
    const s = (now - t0Ref.current) / 1000; // elapsed seconds

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    /* World map — fades in 0.35s → 1.35s, max alpha 0.22
       Offscreen pre-render keeps main thread free (single blit) */
    if (offscreenRef.current && s > 0.35) {
      const alpha = Math.min((s - 0.35) / 1.0, 1) * 0.22;
      if (alpha > 0) {
        ctx.globalAlpha = alpha;
        ctx.drawImage(offscreenRef.current, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    /* Arc lines — draw starting at 1.05s (lines before nodes) */
    if (s > 1.05) {
      ARC_PAIRS.forEach(([ai, bi], idx) => {
        const delay    = 1.05 + idx * 0.1;
        const progress = Math.min(Math.max((s - delay) / 0.65, 0), 1);
        if (progress <= 0) return;

        const [x1, y1] = project(NODES[ai][0], NODES[ai][1], W, H);
        const [x2, y2] = project(NODES[bi][0], NODES[bi][1], W, H);
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.28 - 30;

        ctx.save();
        ctx.strokeStyle = `rgba(212,175,55,${Math.min(progress, 0.85) * 0.38})`;
        ctx.lineWidth = 0.75;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        const steps = 60;
        for (let k = 0; k <= Math.floor(steps * progress); k++) {
          const t  = k / steps;
          const bx = quad(t, x1, cx, x2);
          const by = quad(t, y1, cy, y2);
          k === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        /* Traveling pulse bead */
        if (progress < 1) {
          const dx = quad(progress, x1, cx, x2);
          const dy = quad(progress, y1, cy, y2);
          const g  = ctx.createRadialGradient(dx, dy, 0, dx, dy, 5);
          g.addColorStop(0, "rgba(244,229,184,0.95)");
          g.addColorStop(1, "rgba(212,175,55,0)");
          ctx.beginPath();
          ctx.arc(dx, dy, 5, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
        ctx.restore();
      });
    }

    /* Miami origin — ignites at 0.75s with expanding ring burst */
    if (s > 0.75) {
      const [x, y] = project(NODES[0][0], NODES[0][1], W, H);
      const alpha  = Math.min((s - 0.75) / 0.35, 1);
      const pulse  = Math.sin(s * 2.5) * 0.5 + 0.5;

      /* Expanding ignition ring (first 0.5s only) */
      if (s < 1.25) {
        const ignProg  = Math.min((s - 0.75) / 0.5, 1);
        const ignR     = 50 * ignProg;
        const ignAlpha = (1 - ignProg) * 0.55 * alpha;
        if (ignAlpha > 0) {
          ctx.beginPath();
          ctx.arc(x, y, ignR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(212,175,55,${ignAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      /* Halo */
      const g = ctx.createRadialGradient(x, y, 0, x, y, 28 + pulse * 10);
      g.addColorStop(0, `rgba(244,229,184,${0.88 * alpha})`);
      g.addColorStop(0.3, `rgba(212,175,55,${0.45 * alpha})`);
      g.addColorStop(1, "rgba(212,175,55,0)");
      ctx.beginPath();
      ctx.arc(x, y, 28 + pulse * 10, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      /* Core dot */
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244,229,184,${alpha})`;
      ctx.fill();
    }

    /* Destination nodes — glow at 1.45s (after arc lines start drawing) */
    if (s > 1.45) {
      for (let i = 1; i < NODES.length; i++) {
        const delay = 1.45 + (i - 1) * 0.06;
        const alpha = Math.min(Math.max((s - delay) / 0.4, 0), 1);
        if (alpha <= 0) continue;

        const [x, y] = project(NODES[i][0], NODES[i][1], W, H);
        const pulse  = Math.sin(s * 1.8 + i * 0.9) * 0.5 + 0.5;

        const gr = ctx.createRadialGradient(x, y, 0, x, y, 11 + pulse * 3);
        gr.addColorStop(0, `rgba(212,175,55,${0.5 * alpha})`);
        gr.addColorStop(1, "rgba(212,175,55,0)");
        ctx.beginPath();
        ctx.arc(x, y, 11 + pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244,229,184,${alpha * 0.9})`;
        ctx.fill();
      }
    }

    rafRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    /* Reduced motion — skip to final state, auto-dismiss in 2s */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setChecked([0, 1, 2, 3, 4, 5]);
      setPhase("ready");
      setShowSeal(true);
      setDiscBreathe(true);
      setShowContent(true);
      setShowProgress(true);
      setShowSection(true);
      setReadyForExit(true);
      const t = setTimeout(() => {
        setPhase("exit");
        setTimeout(() => {
          setPhase("gone");
          sessionStorage.setItem("ms_ritual_seen", "1");
        }, 700);
      }, 2000);
      return () => clearTimeout(t);
    }

    if (sessionStorage.getItem("ms_ritual_seen")) {
      setPhase("gone");
      return;
    }

    /* Size canvas to full viewport */
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    /* Fetch + pre-render world map during idle — warmer gold stroke */
    idle(() => {
      fetch("/world.geojson")
        .then((r) => r.json())
        .then((data) => {
          idle(() => {
            const W2 = window.innerWidth;
            const H2 = window.innerHeight;
            const oc  = document.createElement("canvas");
            oc.width  = W2;
            oc.height = H2;
            const c   = oc.getContext("2d");
            if (!c) return;
            c.strokeStyle = "rgba(212,175,55,1)";
            c.lineWidth   = 0.6;
            c.beginPath();
            for (const f of data.features) {
              const { type, coordinates } = f.geometry;
              const polys = type === "Polygon" ? [coordinates] : coordinates;
              for (const poly of polys) {
                for (const ring of poly) {
                  let first = true;
                  for (const [lon, lat] of ring) {
                    const [x, y] = project(lon, lat, W2, H2);
                    first ? c.moveTo(x, y) : c.lineTo(x, y);
                    first = false;
                  }
                }
              }
            }
            c.stroke();
            offscreenRef.current = oc;
          });
        })
        .catch(() => {});
    });

    rafRef.current = requestAnimationFrame(render);

    const ts: ReturnType<typeof setTimeout>[] = [];

    ts.push(setTimeout(() => { setPhase("rings"); setShowSeal(true); }, T.rings));
    ts.push(setTimeout(() => setDiscBorn(true),                        T.seal));
    ts.push(setTimeout(() => {
      setPhase("active");
      setDiscBorn(false);
      setDiscBreathe(true);
      setShowContent(true);
    }, T.brand));
    ts.push(setTimeout(() => setShowProgress(true),                    T.progress));
    ts.push(setTimeout(() => setShowSection(true),                     T.section));
    T.checks.forEach((delay, i) => {
      ts.push(setTimeout(() => setChecked((p) => [...p, i]), delay));
    });
    ts.push(setTimeout(() => setPhase("vault"),                        T.vault));
    ts.push(setTimeout(() => {
      setPhase("ready");
      setReadyForExit(true);
    }, T.ready));
    /* No auto-exit — overlay waits for user click or Escape */

    /* Dismiss — self-nulling to prevent double-call */
    const dismiss = () => {
      if (!dismissRef.current) return;
      dismissRef.current = null;
      ts.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
      sessionStorage.setItem("ms_ritual_seen", "1");
      setPhase("exit");
      setTimeout(() => setPhase("gone"), 900);
    };
    dismissRef.current = dismiss;

    return () => {
      ts.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  /* Escape key — active only once readyForExit */
  useEffect(() => {
    if (!readyForExit) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismissRef.current?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readyForExit]);

  if (phase === "gone") return null;

  const vaultLocked = phase === "vault" || phase === "ready" || phase === "exit";
  const ringsActive = phase === "rings" || phase === "active" || vaultLocked;

  /* Click/tap handler — fires only after readyForExit */
  const handleClick = () => {
    if (readyForExit) dismissRef.current?.();
  };

  return (
    <div
      className={[
        "ritual-overlay",
        phase === "exit"  ? "ritual-overlay--exit"  : "",
        readyForExit      ? "ritual-overlay--ready"  : "",
      ].filter(Boolean).join(" ")}
      onClick={handleClick}
      aria-hidden="true"
    >
      {/* Cinematic world map canvas */}
      <canvas ref={canvasRef} className="ritual-overlay__canvas" />

      {/* Radial atmosphere glow */}
      <div className="ritual-overlay__glow" />

      <div className="ritual-overlay__inner">

        {/* ── Seal area — appears at 1.80s ───────────────────── */}
        <div className={`ritual-overlay__seal-area${showSeal ? " ritual-overlay__seal-area--show" : ""}`}>
          <div className={[
            "ritual-overlay__seal-wrap",
            ringsActive ? "rings-active" : "",
            vaultLocked ? "vault-locked" : "",
          ].filter(Boolean).join(" ")}>

            {/* Warm gold bloom behind seal */}
            <span className="ritual-overlay__seal-bloom" aria-hidden="true" />

            {/* Rings D → A (outer → inner) */}
            <span className="ritual-overlay__ring ro-ring-d" />
            <span className="ritual-overlay__ring ro-ring-c" />
            <span className="ritual-overlay__ring ro-ring-b" />
            <span className="ritual-overlay__ring ro-ring-a" />

            {/* Orbital node + spark SVG — centered over the 290px wrap */}
            <svg
              aria-hidden="true"
              viewBox="0 0 380 380"
              fill="none"
              style={{
                position: "absolute",
                width: 380,
                height: 380,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 1,
                opacity: ringsActive ? 1 : 0,
                transition: "opacity 0.9s ease",
              }}
            >
              {/* Outer ring node beads (ring-d radius 189) */}
              {Array.from({ length: 8 }, (_, i) => {
                const a = -Math.PI / 2 + i * (Math.PI / 4);
                const x = 190 + 189 * Math.cos(a);
                const y = 190 + 189 * Math.sin(a);
                return (
                  <g key={`on-${i}`} style={{ transformOrigin: `${x}px ${y}px` }} className={`ro-node ro-node-o${i}`}>
                    <circle cx={x} cy={y} r={10} fill="rgba(212,175,55,0.10)" />
                    <circle cx={x} cy={y} r={5.5} fill="rgba(212,175,55,0.45)" />
                    <circle cx={x} cy={y} r={3} fill="rgba(244,229,184,0.92)" />
                  </g>
                );
              })}

              {/* Inner ring node beads (ring-a radius 107) */}
              {Array.from({ length: 6 }, (_, i) => {
                const a = -Math.PI / 2 + i * (Math.PI / 3);
                const x = 190 + 107 * Math.cos(a);
                const y = 190 + 107 * Math.sin(a);
                return (
                  <g key={`in-${i}`} style={{ transformOrigin: `${x}px ${y}px` }} className={`ro-node ro-node-i${i}`}>
                    <circle cx={x} cy={y} r={7} fill="rgba(212,175,55,0.08)" />
                    <circle cx={x} cy={y} r={3.5} fill="rgba(212,175,55,0.38)" />
                    <circle cx={x} cy={y} r={2} fill="rgba(244,229,184,0.85)" />
                  </g>
                );
              })}

              {/* Vault-lock spark bursts — outer ring positions */}
              {vaultLocked && Array.from({ length: 8 }, (_, i) => {
                const a = -Math.PI / 2 + i * (Math.PI / 4);
                const x = 190 + 189 * Math.cos(a);
                const y = 190 + 189 * Math.sin(a);
                return (
                  <circle
                    key={`sp-${i}`}
                    cx={x}
                    cy={y}
                    r={22}
                    stroke="rgba(244,229,184,0.85)"
                    strokeWidth={1.2}
                    fill="none"
                    style={{ transformOrigin: `${x}px ${y}px` }}
                    className={`ro-spark ro-spark-${i}`}
                  />
                );
              })}

              {/* Star flares at 3 outer nodes when vault-locked */}
              {vaultLocked && [0, 3, 6].map((i) => {
                const a = -Math.PI / 2 + i * (Math.PI / 4);
                const x = 190 + 189 * Math.cos(a);
                const y = 190 + 189 * Math.sin(a);
                const d = `M${x},${y - 14} L${x + 1.5},${y - 3} L${x + 14},${y} L${x + 1.5},${y + 3} L${x},${y + 14} L${x - 1.5},${y + 3} L${x - 14},${y} L${x - 1.5},${y - 3} Z`;
                return (
                  <path
                    key={`fl-${i}`}
                    d={d}
                    fill="rgba(244,229,184,0.75)"
                    style={{ transformOrigin: `${x}px ${y}px` }}
                    className={`ro-flare ro-flare-${i}`}
                  />
                );
              })}
            </svg>

            {/* Seal disc */}
            <div className={[
              "ritual-overlay__seal-disc",
              discBorn                        ? "ro-disc-born"    : "",
              discBreathe && !vaultLocked     ? "ro-disc-breathe" : "",
              vaultLocked                     ? "vault-flash"     : "",
            ].filter(Boolean).join(" ")}>
              <span className="ritual-overlay__metallic-sweep" aria-hidden="true" />
            </div>

          </div>
        </div>

        {/* ── Text content — appears at 3.00s ────────────────── */}
        <div className={`ritual-overlay__text-area${showContent ? " ritual-overlay__text-area--show" : ""}`}>

          {/* Wordmark — "THE MILANO SEAL™" in serif, identical to mobile target */}
          <p className="ritual-overlay__wordmark">The Milano Seal™</p>

          {/* Decorative gem divider */}
          <div className="ritual-overlay__gem-divider" aria-hidden="true">
            <span className="ritual-overlay__gem-line" />
            <span className="ritual-overlay__gem-diamond">◆</span>
            <span className="ritual-overlay__gem-line" />
          </div>

          <p className="ritual-overlay__tagline">Sealing Trust With Every Signature™</p>

          <p className="ritual-overlay__status">
            Preparing your secure document execution environment.
          </p>

          {/* Progress bar — appears at 3.90s */}
          {showProgress && (
            <div className="ritual-overlay__progress-wrap" aria-hidden="true">
              <div className="ritual-overlay__progress-fill" />
              <span className="ritual-overlay__progress-bead" />
            </div>
          )}

          {/* Checklist — label at 4.20s, items unlock 4.50s+ */}
          <div className={`ritual-overlay__section${showSection ? " ritual-overlay__section--show" : ""}`}>
            <hr className="ritual-overlay__hr" />
            <p className="ritual-overlay__section-label">
              Structuring Secure Matter Environment
            </p>
            <ul className="ritual-overlay__list">
              {STEPS.map((step, i) => {
                const done = checked.includes(i);
                return (
                  <li
                    key={step}
                    className={`ritual-overlay__item${done ? " ritual-overlay__item--done" : ""}`}
                  >
                    {done
                      ? <CheckCircle2 className="ritual-overlay__item-icon ritual-overlay__item-icon--done" />
                      : <Circle       className="ritual-overlay__item-icon" />
                    }
                    <span>{step}</span>
                  </li>
                );
              })}
            </ul>
            <hr className="ritual-overlay__hr" />
          </div>

          {/* Footer — lights up at vault lock */}
          <div className={`ritual-overlay__footer${vaultLocked ? " ritual-overlay__footer--lit" : ""}`}>
            <ShieldCheck className="ritual-overlay__footer-icon" />
            <span>Secure Workspace Ready</span>
          </div>

          {/* Click/tap hint — visible during final hold only */}
          {readyForExit && (
            <p className="ritual-overlay__hint" aria-hidden="true">
              <span className="ritual-overlay__hint-click">Click to enter</span>
              <span className="ritual-overlay__hint-tap">Tap to enter</span>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
