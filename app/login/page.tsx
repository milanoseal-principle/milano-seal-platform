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
    rawNext.startsWith("/portal")
      ? rawNext
      : "/portal";

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_failed") {
      setError(
        "That access link has expired or is invalid. Please request a new one.",
      );
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
        @keyframes ms-fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ms-spin { to{transform:rotate(360deg)} }
        @keyframes ms-goldPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        .ms-login-bg { position: fixed; inset: 0; background: var(--black, #0a0a0a); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .ms-login-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(198,165,90,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(198,165,90,.05) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%); opacity: .6; }
        .ms-login-glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(198,165,90,.10), transparent 60%); filter: blur(40px); animation: ms-goldPulse 6s ease-in-out infinite; }
        .ms-login-card { position: relative; width: 100%; max-width: 420px; background: rgba(15,15,15,.92); border: 1px solid rgba(198,165,90,.14); padding: 44px 44px 36px; border-radius: 4px; backdrop-filter: blur(12px); box-shadow: 0 24px 80px rgba(0,0,0,.6); animation: ms-fadeUp .6s cubic-bezier(.25,.46,.45,.94) both; }
        .ms-login-card::before { content: ''; position: absolute; top: 0; left: 52px; right: 52px; height: 1px; background: linear-gradient(90deg, transparent, #C6A55A, transparent); }
        .ms-login-ring { width: 80px; height: 80px; border-radius: 50%; border: 1.5px solid #C6A55A; display: flex; align-items: center; justify-content: center; margin: 0 auto 28px; animation: ms-goldPulse 3s ease-in-out infinite; box-shadow: 0 0 40px rgba(198,165,90,.18); }
        .ms-login-title { font-family: var(--font-playfair, 'Playfair Display'), Georgia, serif; font-size: 13px; letter-spacing: .28em; text-transform: uppercase; color: #fff; text-align: center; margin-bottom: 6px; }
        .ms-login-tag { font-size: 9.5px; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.45); text-align: center; margin-bottom: 32px; }
        .ms-flbl { display: block; font-size: 9px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.55); margin-bottom: 7px; }
        .ms-fi { width: 100%; background: rgba(255,255,255,.04); border: 1px solid rgba(198,165,90,.14); padding: 11px 12px; color: #fff; font-family: var(--font-geist, system-ui), sans-serif; font-size: 13px; outline: none; transition: all .2s ease; border-radius: 2px; }
        .ms-fi::placeholder { color: rgba(255,255,255,.32); }
        .ms-fi:focus { border-color: #C6A55A; background: rgba(198,165,90,.04); }
        .ms-submit-btn { width: 100%; padding: 13px; background: #C6A55A; color: #0a0a0a; border: none; font-family: var(--font-geist, system-ui), sans-serif; font-size: 9.5px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; cursor: pointer; transition: background .2s ease; border-radius: 2px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
        .ms-submit-btn:hover:not(:disabled) { background: #d4b76a; }
        .ms-submit-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ms-spinner { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,.25); border-top-color: #0a0a0a; animation: ms-spin .8s linear infinite; }
        .ms-foot { text-align: center; margin-top: 24px; font-size: 9px; color: rgba(255,255,255,.35); letter-spacing: .12em; }
        .ms-err { font-size: 10.5px; color: #f87171; margin-bottom: 12px; padding: 8px 10px; background: rgba(248,113,113,.06); border: 1px solid rgba(248,113,113,.2); border-radius: 2px; }
        .ms-hint { font-size: 9px; color: rgba(255,255,255,.35); margin-bottom: 14px; line-height: 1.5; }
        .ms-hint span { color: #C6A55A; }
        .ms-success { padding: 16px; background: rgba(74,158,107,.08); border: 1px solid rgba(74,158,107,.28); border-radius: 2px; text-align: center; }
        .ms-success-h { font-family: var(--font-playfair), Georgia, serif; font-size: 16px; color: #fff; margin-bottom: 6px; }
        .ms-success-p { font-size: 11px; color: rgba(255,255,255,.65); line-height: 1.6; }
        .ms-success-em { color: #C6A55A; }
        .ms-link-btn { background: none; border: none; color: #C6A55A; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; padding: 8px; margin-top: 8px; }
        .ms-link-btn:hover { color: #d4b76a; }
        .ms-matter-badge { font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: #C6A55A; background: rgba(198,165,90,.08); border: 1px solid rgba(198,165,90,.2); border-radius: 2px; padding: 6px 10px; margin-bottom: 16px; display: inline-block; }
      `}</style>

      <div className="ms-login-bg">
        <div className="ms-login-grid" />
        <div className="ms-login-glow" />

        <div className="ms-login-card">
          <div className="ms-login-ring">
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

          <div className="ms-foot">FL Notary #668288 · EIN 41-5272965</div>
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
            background: "#0a0a0a",
            color: "#888",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            letterSpacing: ".18em",
            textTransform: "uppercase",
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
