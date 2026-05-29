"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { detectAccessIntent } from "@/lib/access-intent";

function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size * 0.55}
      height={size * 0.55}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 20L3 6L12 15L21 6L21 20"
        stroke="#C6A55A"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 6C14 2,19 3,20 8C17 5,13 6,12 10Z"
        fill="#C6A55A"
        opacity="0.88"
      />
    </svg>
  );
}

type Phase = "input" | "matter-email" | "sent";
type Role = "operator" | "client" | "alliance" | "va";

const ROLE_HINTS: Record<Role, {
  email: string;
  label: string;
  sub: string;
  method: "password" | "magic";
  cta: string;
  hint: string;
}> = {
  operator: {
    email: "nick@themilanoseal.com",
    label: "Operator",
    sub: "Nicholas Milano / Authorized Staff",
    method: "password",
    cta: "Continue Securely",
    hint: "Operator access — use your Milano Seal credentials.",
  },
  client: {
    email: "",
    label: "Matter Control Portal",
    sub: "Track Your Matter",
    method: "magic",
    cta: "Send Access Link",
    hint: "Enter the email address associated with your matter. We'll send a one-time access link — no password required.",
  },
  alliance: {
    email: "",
    label: "Alliance Portal",
    sub: "Assigned Execution Network",
    method: "password",
    cta: "Continue to Alliance Portal",
    hint: "Alliance partner access — use your assigned execution network credentials.",
  },
  va: {
    email: "",
    label: "Virtual Assistant",
    sub: "Restricted Task Workspace",
    method: "password",
    cta: "Continue to VA Workspace",
    hint: "Virtual Assistant access — use your assigned workspace credentials.",
  },
};

/* ── Routing line SVG — abstract Hague jurisdiction grid ── */
function RoutingLines() {
  return (
    <svg
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="routeFade" cx="50%" cy="50%" r="50%">
          <stop offset="20%" stopColor="rgba(198,165,90,1)" />
          <stop offset="100%" stopColor="rgba(198,165,90,0)" />
        </radialGradient>
        <mask id="routeMask">
          <rect width="100%" height="100%" fill="url(#routeFade)" />
        </mask>
      </defs>
      <g mask="url(#routeMask)" style={{ animation: "ms-route-drift 18s ease-in-out infinite" }}>
        {/* Jurisdiction nodes */}
        <circle cx="11%" cy="18%" r="1.5" fill="rgba(198,165,90,0.18)" />
        <circle cx="87%" cy="22%" r="1.5" fill="rgba(198,165,90,0.14)" />
        <circle cx="22%" cy="78%" r="1.5" fill="rgba(198,165,90,0.12)" />
        <circle cx="82%" cy="74%" r="1.5" fill="rgba(198,165,90,0.14)" />
        <circle cx="50%" cy="12%" r="1" fill="rgba(198,165,90,0.1)" />
        <circle cx="50%" cy="88%" r="1" fill="rgba(198,165,90,0.1)" />
        {/* Routing vectors */}
        <line x1="11%" y1="18%" x2="87%" y2="22%" stroke="rgba(198,165,90,0.06)" strokeWidth="0.5" />
        <line x1="11%" y1="18%" x2="22%" y2="78%" stroke="rgba(198,165,90,0.05)" strokeWidth="0.5" />
        <line x1="87%" y1="22%" x2="82%" y2="74%" stroke="rgba(198,165,90,0.05)" strokeWidth="0.5" />
        <line x1="22%" y1="78%" x2="82%" y2="74%" stroke="rgba(198,165,90,0.05)" strokeWidth="0.5" />
        <line x1="50%" y1="12%" x2="87%" y2="22%" stroke="rgba(198,165,90,0.04)" strokeWidth="0.4" />
        <line x1="50%" y1="12%" x2="11%" y2="18%" stroke="rgba(198,165,90,0.04)" strokeWidth="0.4" />
        <line x1="50%" y1="88%" x2="22%" y2="78%" stroke="rgba(198,165,90,0.04)" strokeWidth="0.4" />
        <line x1="50%" y1="88%" x2="82%" y2="74%" stroke="rgba(198,165,90,0.04)" strokeWidth="0.4" />
      </g>
    </svg>
  );
}

function LoginInner() {
  const [phase, setPhase] = useState<Phase>("input");
  const [identifier, setIdentifier] = useState("");
  const [matterId, setMatterId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const rawNext = searchParams.get("next") || "";
  const nextPath =
    rawNext.startsWith("/dashboard") ||
    rawNext.startsWith("/admin") ||
    rawNext.startsWith("/portal") ||
    rawNext.startsWith("/alliance") ||
    rawNext.startsWith("/va")
      ? rawNext
      : "/portal";

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_failed" || err === "otp_expired") {
      setError("That access link has expired or was already used. Please request a new one.");
    }
    if (err === "invalid_role") {
      setError("Your account role is not authorized for this workspace. Contact your administrator.");
    }
    if (err === "access_denied") {
      setError("Access denied. Your session may have expired — please sign in again.");
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(nextPath);
    });
  }, [nextPath, router]);

  const submitIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const intent = detectAccessIntent(identifier);

    if (intent.lane === "UNKNOWN") {
      setError(
        "Access code not recognized. Enter your email address or matter reference number.",
      );
      return;
    }

    if (intent.lane === "ALLIANCE") {
      router.push("/alliance");
      return;
    }

    if (intent.lane === "CLIENT") {
      setMatterId(intent.matterId);
      setPhase("matter-email");
      return;
    }

    // EMAIL lane — send magic link
    await sendMagicLink(intent.email);
  };

  const submitMatterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // TODO: backend must validate email ↔ matter entitlement before granting portal access
    await sendMagicLink(email, matterId ?? undefined);
  };

  const sendMagicLink = async (addr: string, matter?: string) => {
    setIsLoading(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const callbackParams = new URLSearchParams();
    if (matter) callbackParams.set("matter", matter);
    const redirect = `${origin}/auth/callback${callbackParams.toString() ? "?" + callbackParams.toString() : ""}`;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: addr,
      options: {
        emailRedirectTo: redirect,
        shouldCreateUser: false,
      },
    });

    setIsLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }
    setPhase("sent");
  };

  const reset = () => {
    setPhase("input");
    setIdentifier("");
    setEmail("");
    setMatterId(null);
    setError(null);
  };

  return (
    <>
      <style>{`
        @keyframes ms-fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ms-spin { to { transform: rotate(360deg); } }
        @keyframes ms-goldPulse { 0%,100% { opacity:.45 } 50% { opacity:.9 } }
        @keyframes ms-route-drift {
          0%,100% { transform: translate(0,0); }
          33%      { transform: translate(5px,-3px); }
          66%      { transform: translate(-3px,4px); }
        }
        @keyframes ms-shimmer {
          from { background-position: -200% center; }
          to   { background-position: 200% center; }
        }
        @keyframes ms-card-in {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .ms-bg {
          position: fixed; inset: 0;
          background: #070504;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          padding-top: var(--sa-top, env(safe-area-inset-top, 0px));
          padding-bottom: var(--sa-bottom, env(safe-area-inset-bottom, 0px));
        }
        .ms-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(198,165,90,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(198,165,90,.04) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 72%);
        }
        .ms-glow {
          position: absolute; width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(198,165,90,.09), transparent 58%);
          filter: blur(48px);
          animation: ms-goldPulse 7s ease-in-out infinite;
          pointer-events: none;
        }

        /* Card */
        .ms-card {
          position: relative; z-index: 1;
          width: calc(100% - 32px); max-width: 440px;
          background: rgba(12,9,4,0.94);
          border: 1px solid rgba(198,165,90,.18);
          padding: 48px 44px 38px;
          border-radius: 3px;
          backdrop-filter: blur(16px);
          box-shadow: 0 32px 96px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,0.02) inset;
          animation: ms-card-in .55s cubic-bezier(0.16,1,0.3,1) both;
        }
        /* Champagne top-line */
        .ms-card::before {
          content: '';
          position: absolute; top: 0; left: 56px; right: 56px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(198,165,90,.7), transparent);
        }
        /* Subtle side glow on hover */
        .ms-card::after {
          content: '';
          position: absolute; inset: 0; border-radius: 3px;
          box-shadow: 0 0 48px rgba(198,165,90,.04);
          pointer-events: none;
          transition: box-shadow .6s ease;
        }
        .ms-card:hover::after { box-shadow: 0 0 56px rgba(198,165,90,.08); }

        /* Logo ring */
        .ms-ring {
          width: 72px; height: 72px; border-radius: 50%;
          border: 1px solid rgba(198,165,90,.35);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          animation: ms-goldPulse 4s ease-in-out infinite;
          box-shadow: 0 0 32px rgba(198,165,90,.12);
        }

        /* Header */
        .ms-login-title {
          font-family: var(--font-playfair, 'Playfair Display'), Georgia, serif;
          font-size: 13px; letter-spacing: .28em; text-transform: uppercase;
          color: #fff; text-align: center; margin-bottom: 6px;
        }
        .ms-login-tag {
          font-size: 9.5px; letter-spacing: .2em; text-transform: uppercase;
          color: rgba(255,255,255,.45); text-align: center; margin-bottom: 32px;
        }

        /* Inputs */
        .ms-flbl {
          display: block; font-size: 9px; font-weight: 600;
          letter-spacing: .18em; text-transform: uppercase;
          color: rgba(255,255,255,.55); margin-bottom: 7px;
        }
        .ms-fi {
          width: 100%;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(198,165,90,.14);
          padding: 11px 12px;
          color: #fff;
          font-family: var(--font-geist, system-ui), sans-serif;
          font-size: 13px; outline: none;
          transition: all .2s ease;
          border-radius: 2px;
        }
        .ms-fi::placeholder { color: rgba(255,255,255,.32); }
        .ms-fi:focus { border-color: #C6A55A; background: rgba(198,165,90,.04); }

        /* Submit */
        .ms-submit-btn {
          width: 100%; padding: 13px;
          background: #C6A55A; color: #0a0a0a;
          border: none;
          font-family: var(--font-geist, system-ui), sans-serif;
          font-size: 9.5px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase;
          cursor: pointer; transition: background .2s ease; border-radius: 2px;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
        }
        .ms-submit-btn:hover:not(:disabled) { background: #d4b76a; }
        .ms-submit-btn:disabled { opacity: .5; cursor: not-allowed; }

        .ms-spinner {
          width: 12px; height: 12px; border-radius: 50%;
          border: 1.5px solid rgba(0,0,0,.25);
          border-top-color: #0a0a0a;
          animation: ms-spin .8s linear infinite;
        }

        /* Messages */
        .ms-err {
          font-size: 10.5px; color: #f87171; margin-bottom: 12px;
          padding: 8px 10px;
          background: rgba(248,113,113,.06);
          border: 1px solid rgba(248,113,113,.2); border-radius: 2px;
        }
        .ms-hint {
          font-size: 9px; color: rgba(255,255,255,.35); margin-bottom: 14px; line-height: 1.5;
        }
        .ms-hint span { color: #C6A55A; }

        .ms-success {
          padding: 16px; border-radius: 2px; text-align: center;
          background: rgba(74,158,107,.08);
          border: 1px solid rgba(74,158,107,.28);
        }
        .ms-success-h {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: 16px; color: #fff; margin-bottom: 6px;
        }
        .ms-success-p { font-size: 11px; color: rgba(255,255,255,.65); line-height: 1.6; }
        .ms-success-em { color: #C6A55A; }
        .ms-link-btn {
          background: none; border: none;
          color: rgba(198,165,90,.65); font-size: 9.5px; letter-spacing: .14em;
          text-transform: uppercase; cursor: pointer; padding: 8px; margin-top: 8px;
          transition: color .15s ease;
        }
        .ms-link-btn:hover { color: rgba(198,165,90,1); }

        .ms-matter-badge {
          font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
          color: #C6A55A; background: rgba(198,165,90,.08);
          border: 1px solid rgba(198,165,90,.2); border-radius: 2px;
          padding: 6px 10px; margin-bottom: 16px; display: inline-block;
        }

        /* Footer */
        .ms-foot {
          text-align: center; margin-top: 26px;
          font-size: 8.5px; color: rgba(255,255,255,.2);
          letter-spacing: .1em; line-height: 1.7;
        }
        .ms-foot-reg {
          margin-top: 4px; font-size: 8px;
          color: rgba(255,255,255,.14); letter-spacing: .12em;
        }
      `}</style>

      <div className="ms-bg">
        {/* Background layers */}
        <div className="ms-grid" />
        <div className="ms-glow" />
        <RoutingLines />

        {/* Login card */}
        <div className="ms-card">
          {/* Logo */}
          <div className="ms-ring">
            <LogoMark size={44} />
          </div>

          <div className="ms-login-title">The Milano Seal™</div>
          <div className="ms-login-tag">Secure Access Gateway</div>

          {phase === "sent" && (
            <div
              className="ms-success"
              style={{ animation: "ms-fadeUp .4s ease both" }}
            >
              <div className="ms-success-h">Check your email</div>
              <div className="ms-success-p">
                We sent a one-time access link to{" "}
                <span className="ms-success-em">{email || identifier}</span>.
                {matterId && (
                  <>
                    {" "}
                    Once verified, your matter{" "}
                    <span className="ms-success-em">{matterId}</span> will be
                    available if entitlement is confirmed.
                  </>
                )}
              </div>
              <button type="button" className="ms-link-btn" onClick={reset}>
                Use a different address
              </button>
            </div>
          )}

          {phase === "input" && (
            <form
              onSubmit={submitIdentifier}
              style={{ animation: "ms-fadeUp .4s ease both" }}
            >
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="identifier" className="ms-flbl">
                  Access Code or Email
                </label>
                <input
                  id="identifier"
                  className="ms-fi"
                  type="text"
                  autoComplete="off"
                  placeholder="your@email.com or MS-2024-XXXX"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError(null);
                  }}
                  required
                />
              </div>

              <div className="ms-hint">
                Enter your email address, matter reference, or access token. No
                account creation — <span>access is by invitation only</span>.
              </div>

              {error && <div className="ms-err">{error}</div>}

              <button
                type="submit"
                className="ms-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="ms-spinner" />
                    Verifying…
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          )}

          {phase === "matter-email" && (
            <form
              onSubmit={submitMatterEmail}
              style={{ animation: "ms-fadeUp .4s ease both" }}
            >
              <div style={{ marginBottom: 14 }}>
                <span className="ms-matter-badge">{matterId}</span>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,.55)",
                    lineHeight: 1.6,
                    margin: "0 0 16px",
                    letterSpacing: ".04em",
                  }}
                >
                  Matter reference recognized. Enter the email address
                  associated with this matter to receive your access link.
                </p>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="matter-email" className="ms-flbl">
                  Email Address
                </label>
                <input
                  id="matter-email"
                  className="ms-fi"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  required
                />
              </div>

              {error && <div className="ms-err">{error}</div>}

              <button
                type="submit"
                className="ms-submit-btn"
                disabled={isLoading}
                style={{ marginBottom: 10 }}
              >
                {isLoading ? (
                  <>
                    <span className="ms-spinner" />
                    Sending link…
                  </>
                ) : (
                  "Send Access Link"
                )}
              </button>

              <button type="button" className="ms-link-btn" onClick={reset}>
                Back
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="ms-foot">
            Protected access · Matter-level controls · Audit-aware workspace
            <br />
            International execution infrastructure
          </div>
          <div className="ms-foot-reg">
            FL Notary #668288 · EIN 41-5272965
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#070504",
            color: "rgba(255,255,255,.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
        >
          Loading…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
