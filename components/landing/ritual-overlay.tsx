"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";

/* ─── Geographic nodes (key international cities) ──────────── */
const NODES: [number, number][] = [
  [-80.19,  25.77],  // Miami — home base
  [-74.01,  40.71],  // New York
  [ -0.12,  51.51],  // London
  [  2.35,  48.86],  // Paris
  [ 55.30,  25.20],  // Dubai
  [139.69,  35.69],  // Tokyo
  [-46.63, -23.55],  // São Paulo
  [-74.07,   4.71],  // Bogotá
  [-99.13,  19.43],  // Mexico City
  [ -3.70,  40.42],  // Madrid
  [103.82,   1.35],  // Singapore
  [ 28.98,  41.01],  // Istanbul
  [151.21, -33.87],  // Sydney
];

const ARC_PAIRS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 6], [0, 7], [0, 8], [0, 9],
  [2, 4], [2, 11], [4, 10], [3, 9], [1, 5], [5, 12],
];

const STEPS = [
  "Verifying secure workspace",
  "Preparing Global Document Intelligence",
  "Reviewing execution pathway",
  "Checking payment-gated scheduling",
  "Structuring chain-of-custody visibility",
  "Ready for review",
] as const;

/* ─── Timing (ms) ──────────────────────────────────────────── */
const T = {
  showRings:   1200,
  showContent: 1600,
  checks:      [2000, 2450, 2850, 3200, 3500, 3750],
  vault:       4200,  // rings lock + flash
  exit:        4900,
  gone:        5800,
};

/* ─── Canvas helpers ────────────────────────────────────────── */
function project(lon: number, lat: number, w: number, h: number): [number, number] {
  return [(lon + 180) * (w / 360), (90 - lat) * (h / 180)];
}

function quad(t: number, a: number, b: number, c: number) {
  return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
}

/* ─── Idle scheduler (Safari compat) ───────────────────────── */
const idle = (cb: () => void) =>
  typeof requestIdleCallback !== "undefined"
    ? requestIdleCallback(cb, { timeout: 2000 })
    : setTimeout(cb, 100);

/* ─── Component ─────────────────────────────────────────────── */
export function RitualOverlay() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null); // pre-baked world map
  const rafRef       = useRef<number>(0);
  const t0Ref        = useRef<number>(0);

  const [checked,     setChecked]     = useState<number[]>([]);
  const [phase,       setPhase]       = useState<"enter" | "rings" | "active" | "vault" | "exit" | "gone">("enter");
  const [showContent, setShowContent] = useState(false);

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

    /* World map — single drawImage blit (offscreen pre-rendered, no per-frame path work) */
    if (offscreenRef.current && s > 0.2) {
      const alpha = Math.min((s - 0.2) / 1.5, 1) * 0.11;
      if (alpha > 0) {
        ctx.globalAlpha = alpha;
        ctx.drawImage(offscreenRef.current, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    /* Arc paths — draw progressively */
    if (s > 0.6) {
      ARC_PAIRS.forEach(([ai, bi], idx) => {
        const delay    = 0.6 + idx * 0.18;
        const progress = Math.min(Math.max((s - delay) / 0.9, 0), 1);
        if (progress <= 0) return;

        const [x1, y1] = project(NODES[ai][0], NODES[ai][1], W, H);
        const [x2, y2] = project(NODES[bi][0], NODES[bi][1], W, H);
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.28 - 30;

        const alpha = Math.min(progress, 0.85) * 0.32;
        ctx.save();
        ctx.strokeStyle = `rgba(198,165,90,${alpha})`;
        ctx.lineWidth = 0.65;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        const steps = 60;
        for (let i = 0; i <= Math.floor(steps * progress); i++) {
          const t  = i / steps;
          const bx = quad(t, x1, cx, x2);
          const by = quad(t, y1, cy, y2);
          i === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        /* Traveling pulse along arc */
        if (progress < 1) {
          const t  = progress;
          const dx = quad(t, x1, cx, x2);
          const dy = quad(t, y1, cy, y2);
          const g  = ctx.createRadialGradient(dx, dy, 0, dx, dy, 5);
          g.addColorStop(0, "rgba(255,220,130,0.95)");
          g.addColorStop(1, "rgba(198,165,90,0)");
          ctx.beginPath();
          ctx.arc(dx, dy, 5, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
        ctx.restore();
      });
    }

    /* City nodes */
    if (s > 0.4) {
      NODES.forEach(([lon, lat], i) => {
        const delay = 0.4 + i * 0.09;
        const alpha = Math.min(Math.max((s - delay) / 0.45, 0), 1);
        if (alpha <= 0) return;

        const [x, y] = project(lon, lat, W, H);
        const pulse  = Math.sin(s * 1.8 + i * 0.9) * 0.5 + 0.5;
        const base   = i === 0 ? 4.5 : 2.5; // Miami bigger

        /* Halo */
        const gr = ctx.createRadialGradient(x, y, 0, x, y, base * 5 + pulse * 4);
        gr.addColorStop(0, `rgba(198,165,90,${0.45 * alpha})`);
        gr.addColorStop(1, "rgba(198,165,90,0)");
        ctx.beginPath();
        ctx.arc(x, y, base * 5 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();

        /* Core */
        ctx.beginPath();
        ctx.arc(x, y, base, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,220,130,${alpha})`;
        ctx.fill();
      });
    }

    rafRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("ms_ritual_seen")) {
      setPhase("gone");
      return;
    }

    /* Size canvas */
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    /* Load world GeoJSON during idle — pre-render to offscreen canvas so the
       render loop only does a single drawImage blit instead of stroking all
       polygon paths on every frame (eliminates the main-thread blocking). */
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
            c.strokeStyle = "rgba(198,165,90,1)"; // alpha applied at blit time
            c.lineWidth   = 0.5;
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

    /* Start render loop */
    rafRef.current = requestAnimationFrame(render);

    const ts: ReturnType<typeof setTimeout>[] = [];
    ts.push(setTimeout(() => setPhase("rings"),   T.showRings));
    ts.push(setTimeout(() => {
      setPhase("active");
      setShowContent(true);
    }, T.showContent));

    T.checks.forEach((delay, i) => {
      ts.push(setTimeout(() => setChecked((p) => [...p, i]), delay));
    });

    ts.push(setTimeout(() => setPhase("vault"), T.vault));
    ts.push(setTimeout(() => setPhase("exit"),  T.exit));
    ts.push(setTimeout(() => {
      setPhase("gone");
      sessionStorage.setItem("ms_ritual_seen", "1");
    }, T.gone));

    return () => {
      ts.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  if (phase === "gone") return null;

  const vaultLocked = phase === "vault" || phase === "exit";

  return (
    <div
      className={[
        "ritual-overlay",
        phase === "exit" ? "ritual-overlay--exit" : "",
      ].join(" ")}
      aria-hidden="true"
    >
      {/* Cinematic world map */}
      <canvas ref={canvasRef} className="ritual-overlay__canvas" />

      {/* Radial atmosphere glow */}
      <div className="ritual-overlay__glow" />

      {/* ── Content ─────────────────────────────────────────── */}
      <div className={`ritual-overlay__inner${showContent ? " ritual-overlay__inner--show" : ""}`}>

        {/* Vault rings + seal */}
        <div className={`ritual-overlay__seal-wrap${vaultLocked ? " vault-locked" : ""}${phase === "rings" || phase === "active" || vaultLocked ? " rings-active" : ""}`}>
          {/* Ring D — outermost large */}
          <span className="ritual-overlay__ring ro-ring-d" />
          {/* Ring C — dashed compass */}
          <span className="ritual-overlay__ring ro-ring-c" />
          {/* Ring B — tick-mark dial */}
          <span className="ritual-overlay__ring ro-ring-b" />
          {/* Ring A — tight around seal */}
          <span className="ritual-overlay__ring ro-ring-a" />

          {/* The seal */}
          <div className={`ritual-overlay__seal-disc${vaultLocked ? " vault-flash" : ""}`}>
            <Image
              src="/android-chrome-512x512.png"
              alt=""
              width={110}
              height={110}
              className="ritual-overlay__seal-img"
              priority
            />
          </div>
        </div>

        {/* Wordmark */}
        <h1 className="ritual-overlay__wordmark">THE MILANO SEAL™</h1>

        {/* Diamond rule */}
        <div className="ritual-overlay__rule" aria-hidden="true">
          <span className="ritual-overlay__rule-line" />
          <span className="ritual-overlay__rule-gem">◆</span>
          <span className="ritual-overlay__rule-line" />
        </div>

        {/* Tagline */}
        <p className="ritual-overlay__tagline">Sealing Trust With Every Signature™</p>

        {/* Status */}
        <p className="ritual-overlay__status">
          Preparing your secure document execution environment.
        </p>

        {/* Checklist */}
        <div className="ritual-overlay__section">
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

        {/* Footer */}
        <div className={`ritual-overlay__footer${vaultLocked ? " ritual-overlay__footer--lit" : ""}`}>
          <ShieldCheck className="ritual-overlay__footer-icon" />
          <span>Secure Workspace Ready</span>
        </div>
      </div>
    </div>
  );
}
