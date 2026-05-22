"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";

/* ─── Abstract telemetry matrix (no geographic routing) ────────── */
const HEX_LABELS = [
  "SYS_INIT_SECURE_VAULT_CORE_0x",
  "BLOCK_STATE_EXECUTION_PATH_0x",
  "AUTH_CHAIN_CUSTODY_VERIFY_0x",
  "DOCUMENT_INTEGRITY_HASH_0x",
  "APOSTILLE_TIMESTAMP_ANCHOR_0x",
  "CRYPTOGRAPHIC_SEAL_LOCKED_0x",
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

/* ─── Abstract visualization helpers ────────────────────────── */
function genHexString(): string {
  return Math.random().toString(16).slice(2, 10).toUpperCase();
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

    /* Abstract ambient particles — minimal telemetry background */
    if (s > 0.5) {
      const alpha = Math.min((s - 0.5) / 1.0, 1) * 0.12;
      if (alpha > 0) {
        for (let i = 0; i < 20; i++) {
          const x = (Math.sin(s * 0.3 + i) * 0.5 + 0.5) * W;
          const y = (Math.cos(s * 0.2 + i * 0.7) * 0.5 + 0.5) * H;
          const sz = 1 + Math.sin(s + i) * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, sz, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212,175,55,${alpha})`;
          ctx.fill();
        }
      }
    }

    /* Centered geometric accent — pulses gently 0.8s → 2.5s */
    if (s > 0.8 && s < 2.5) {
      const alpha = s < 1.0 ? (s - 0.8) / 0.2 : (2.5 - s) / 0.5;
      const pulse = Math.sin(s * 1.2) * 0.5 + 0.5;
      const cx = W / 2;
      const cy = H / 2;
      const r = 30 + pulse * 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(212,175,55,${Math.max(0, alpha) * 0.35})`;
      ctx.lineWidth = 1;
      ctx.stroke();
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

    /* No geographic assets needed — pure abstract telemetry */

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

  /* Click/tap handler — fires only after readyForExit; ignored before */
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

          {/* Tap/click hint — visible during final hold only */}
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
