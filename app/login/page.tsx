"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const rawNext = searchParams.get("next") || "/dashboard";
  const nextPath =
    rawNext.startsWith("/dashboard") ||
    rawNext.startsWith("/admin") ||
    rawNext.startsWith("/portal") ||
    rawNext.startsWith("/alliance") ||
    rawNext.startsWith("/va")
      ? rawNext
      : "/dashboard";

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

  useEffect(() => {
    setError(null);
    setMagicSent(false);
    setPassword("");
  }, [role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Select your access level.");
      return;
    }
    if (!email) {
      setError("Email is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Safe env presence check — never logs values
    const urlPresent = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const keyPresent = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const sitePresent = !!process.env.NEXT_PUBLIC_SITE_URL;
    if (!urlPresent || !keyPresent) {
      console.error("[milano/login] Supabase env missing:", {
        NEXT_PUBLIC_SUPABASE_URL: urlPresent,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: keyPresent,
        NEXT_PUBLIC_SITE_URL: sitePresent,
      });
    }

    try {
      const supabase = createClient();

      if (ROLE_HINTS[role].method === "magic") {
        // Use NEXT_PUBLIC_SITE_URL for reliable production redirect
        const base =
          process.env.NEXT_PUBLIC_SITE_URL ||
          (typeof window !== "undefined" ? window.location.origin : "");
        const redirect = `${base}/auth/callback?role=client`;

        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirect,
            shouldCreateUser: true,
          },
        });

        if (otpError) {
          // UI message stays clean — log safe diagnostic info for operator review
          console.error("[milano/login] OTP error:", {
            method: "magic",
            code: otpError.code,
            status: otpError.status,
            name: otpError.name,
          });
          setError("Unable to send sign-in link. Please try again.");
          return;
        }
        setMagicSent(true);
        return;
      }

      if (!password) {
        setError("Password is required.");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // UI message stays clean — log safe diagnostic info for operator review
        console.error("[milano/login] Password auth error:", {
          method: "password",
          code: authError.code,
          status: authError.status,
          name: authError.name,
        });
        if (
          authError.status === 400 ||
          authError.status === 401 ||
          authError.status === 422
        ) {
          setError("Invalid credentials. Please check your email and password.");
        } else {
          setError("Sign-in unavailable. Please try again in a moment.");
        }
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      // Catches thrown network errors, SDK failures, undefined env vars.
      // Log safe info only — never log passwords or key values.
      console.error("[milano/login] Caught exception:", {
        name: err instanceof Error ? err.name : typeof err,
        message: err instanceof Error ? err.message : String(err),
        envPresent: { url: urlPresent, key: keyPresent, site: sitePresent },
      });
      setError("Sign-in unavailable. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const isClient = role === "client";

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
        .ms-eyebrow {
          font-size: 9px; font-family: var(--font-geist-mono, monospace);
          letter-spacing: .28em; text-transform: uppercase;
          color: rgba(198,165,90,.55); text-align: center; margin-bottom: 4px;
        }
        .ms-title {
          font-family: var(--font-playfair, 'Playfair Display'), Georgia, serif;
          font-size: 20px; letter-spacing: .04em;
          color: rgba(255,255,255,.92); text-align: center; margin-bottom: 6px;
          font-weight: 400;
        }
        .ms-subtitle {
          font-size: 10.5px; color: rgba(255,255,255,.32);
          text-align: center; line-height: 1.6; margin-bottom: 6px;
          letter-spacing: .01em;
        }
        .ms-badge {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 28px;
        }
        .ms-badge span {
          font-size: 8.5px; font-family: var(--font-geist-mono, monospace);
          letter-spacing: .2em; text-transform: uppercase;
          color: rgba(198,165,90,.45);
          border: 1px solid rgba(198,165,90,.14);
          padding: 3px 10px; border-radius: 2px;
          background: rgba(198,165,90,.03);
        }

        /* Role selector */
        .ms-lbl {
          display: block; font-size: 9px; font-weight: 600;
          letter-spacing: .18em; text-transform: uppercase;
          color: rgba(255,255,255,.4); margin-bottom: 7px;
        }
        .ms-role {
          padding: 11px 14px;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(198,165,90,.12);
          cursor: pointer; text-align: left; border-radius: 2px;
          transition: border-color .2s ease, background .2s ease;
        }
        .ms-role:hover { border-color: rgba(198,165,90,.3); background: rgba(198,165,90,.04); }
        .ms-role[data-active="true"] {
          background: rgba(198,165,90,.08);
          border-color: rgba(198,165,90,.55);
        }
        .ms-role-l {
          font-size: 11px; font-weight: 600; letter-spacing: .12em;
          text-transform: uppercase;
        }
        .ms-role-s {
          font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
          color: rgba(255,255,255,.3); margin-top: 3px;
        }

        /* Inputs */
        .ms-fi {
          width: 100%;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(198,165,90,.12);
          padding: 11px 13px;
          color: rgba(255,255,255,.9);
          font-family: var(--font-geist, system-ui), sans-serif;
          font-size: 13px; outline: none;
          transition: border-color .25s ease, background .25s ease, box-shadow .25s ease;
          border-radius: 2px;
        }
        .ms-fi::placeholder { color: rgba(255,255,255,.28); }
        .ms-fi:focus {
          border-color: rgba(198,165,90,.6);
          background: rgba(198,165,90,.03);
          box-shadow: 0 0 0 3px rgba(198,165,90,.07);
        }

        /* Submit */
        .ms-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #C6A55A 0%, #d4b76a 50%, #C6A55A 100%);
          background-size: 200% auto;
          color: #06040200;
          border: none; border-radius: 2px;
          font-family: var(--font-geist, system-ui), sans-serif;
          font-size: 9.5px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase;
          cursor: pointer;
          transition: transform .25s cubic-bezier(0.16,1,0.3,1), box-shadow .25s ease, background-position .4s ease;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          color: rgba(6,4,2,0.88);
        }
        .ms-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(198,165,90,.28);
          background-position: right center;
        }
        .ms-btn:active:not(:disabled) { transform: translateY(0); }
        .ms-btn:disabled { opacity: .45; cursor: not-allowed; }

        .ms-spinner {
          width: 12px; height: 12px; border-radius: 50%;
          border: 1.5px solid rgba(0,0,0,.2);
          border-top-color: rgba(6,4,2,0.7);
          animation: ms-spin .75s linear infinite;
        }
        .ms-show-pwd {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          background: none; border: none;
          color: rgba(255,255,255,.35); font-size: 9px; letter-spacing: .14em;
          text-transform: uppercase; cursor: pointer; padding: 4px 6px;
          transition: color .15s ease;
        }
        .ms-show-pwd:hover { color: rgba(198,165,90,.8); }

        /* Messages */
        .ms-err {
          font-size: 10.5px; color: #f87171; margin-bottom: 12px;
          padding: 8px 10px;
          background: rgba(248,113,113,.05);
          border: 1px solid rgba(248,113,113,.18); border-radius: 2px;
        }
        .ms-hint {
          font-size: 9.5px; color: rgba(255,255,255,.28); margin-bottom: 14px; line-height: 1.55;
        }
        .ms-hint span { color: rgba(198,165,90,.75); }

        .ms-success {
          padding: 18px; border-radius: 2px; text-align: center;
          background: rgba(52,211,153,.06);
          border: 1px solid rgba(52,211,153,.22);
          animation: ms-fadeUp .4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .ms-success-h {
          font-family: var(--font-playfair), Georgia, serif;
          font-size: 16px; color: rgba(255,255,255,.9); margin-bottom: 6px;
        }
        .ms-success-p { font-size: 11px; color: rgba(255,255,255,.55); line-height: 1.65; }
        .ms-success-em { color: rgba(198,165,90,.85); }
        .ms-link-btn {
          background: none; border: none;
          color: rgba(198,165,90,.65); font-size: 9.5px; letter-spacing: .14em;
          text-transform: uppercase; cursor: pointer; padding: 8px; margin-top: 8px;
          transition: color .15s ease;
        }
        .ms-link-btn:hover { color: rgba(198,165,90,1); }

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

          {/* Header */}
          <div className="ms-eyebrow">The Milano Seal™</div>
          <h1 className="ms-title">Secure Workspace Access</h1>
          <p className="ms-subtitle">
            Private access for international document execution,
            Hague routing, and protected matter coordination.
          </p>
          <div className="ms-badge">
            <span>Hague-aware document coordination</span>
          </div>

          {/* Role selector */}
          <div style={{ marginBottom: 18 }}>
            <div className="ms-lbl">Access Level</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(Object.keys(ROLE_HINTS) as Role[]).map((r) => {
                const o = ROLE_HINTS[r];
                const active = role === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className="ms-role"
                    data-active={active}
                  >
                    <div
                      className="ms-role-l"
                      style={{ color: active ? "#C6A55A" : "rgba(255,255,255,.75)" }}
                    >
                      {o.label}
                    </div>
                    <div className="ms-role-s">{o.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Magic link success */}
          {role && magicSent && (
            <div className="ms-success">
              <div className="ms-success-h">Check your email</div>
              <div className="ms-success-p">
                We sent a secure access link to{" "}
                <span className="ms-success-em">{email}</span>. Click it to
                enter your matter workspace — no password required.
              </div>
              {role === "client" && (
                <div className="ms-success-p" style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,.38)" }}>
                  If the link doesn&rsquo;t open — try opening it in Safari or your default browser.
                </div>
              )}
              <button
                type="button"
                className="ms-link-btn"
                onClick={() => {
                  setMagicSent(false);
                  setEmail("");
                }}
              >
                Use a different email
              </button>
            </div>
          )}

          {/* Form */}
          {role && !magicSent && (
            <form
              onSubmit={submit}
              style={{ animation: "ms-fadeUp .4s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="ms-email" className="ms-lbl">
                  Email
                </label>
                <input
                  id="ms-email"
                  className="ms-fi"
                  type="email"
                  autoComplete="email"
                  placeholder={ROLE_HINTS[role].email}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  required
                />
              </div>

              {!isClient && (
                <div style={{ marginBottom: 14, position: "relative" }}>
                  <label htmlFor="ms-password" className="ms-lbl">
                    Password
                  </label>
                  <input
                    id="ms-password"
                    className="ms-fi"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    minLength={6}
                    required={!isClient}
                    style={{ paddingRight: 56 }}
                  />
                  <button
                    type="button"
                    className="ms-show-pwd"
                    style={{ top: "calc(50% + 9px)" }}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              )}

              <div className="ms-hint">
                {ROLE_HINTS[role].hint}
              </div>

              {error && <div className="ms-err">{error}</div>}

              {isClient && error && (
                <button
                  type="button"
                  className="ms-link-btn"
                  style={{ display: "block", marginBottom: 8 }}
                  onClick={() => {
                    setError(null);
                    setEmail("");
                    setMagicSent(false);
                  }}
                >
                  Request new access link
                </button>
              )}

              <button
                type="submit"
                className="ms-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="ms-spinner" />
                    {isClient ? "Sending link…" : "Verifying…"}
                  </>
                ) : (
                  ROLE_HINTS[role].cta
                )}
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
