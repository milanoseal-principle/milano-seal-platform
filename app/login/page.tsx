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

type Role = "operator" | "client";

const ROLE_HINTS: Record<
  Role,
  { email: string; label: string; sub: string; method: "password" | "magic" }
> = {
  operator: {
    email: "nick@themilanoseal.com",
    label: "Operator",
    sub: "Nicholas Milano",
    method: "password",
  },
  client: {
    email: "you@example.com",
    label: "Matter Control Portal",
    sub: "Track your matter",
    method: "magic",
  },
};

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
    rawNext.startsWith("/portal")
      ? rawNext
      : "/dashboard";

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_failed") {
      setError(
        "That magic link has expired or is invalid. Please request a new one.",
      );
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

    const supabase = createClient();

    if (ROLE_HINTS[role].method === "magic") {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const redirect = `${origin}/auth/callback?role=client`;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirect,
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        setError(otpError.message);
        setIsLoading(false);
        return;
      }
      setMagicSent(true);
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required.");
      setIsLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  const isClient = role === "client";

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
        .ms-role-btn { padding: 11px 14px; background: rgba(255,255,255,.03); border: 1px solid rgba(198,165,90,.14); cursor: pointer; text-align: left; transition: all .2s ease; border-radius: 2px; }
        .ms-role-btn:hover { border-color: rgba(198,165,90,.32); background: rgba(198,165,90,.04); }
        .ms-role-btn[data-active="true"] { background: rgba(198,165,90,.10); border-color: #C6A55A; }
        .ms-role-btn-l { font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
        .ms-role-btn-s { font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.35); margin-top: 3px; }
        .ms-submit-btn { width: 100%; padding: 13px; background: #C6A55A; color: #0a0a0a; border: none; font-family: var(--font-geist, system-ui), sans-serif; font-size: 9.5px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; cursor: pointer; transition: background .2s ease; border-radius: 2px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
        .ms-submit-btn:hover:not(:disabled) { background: #d4b76a; }
        .ms-submit-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ms-spinner { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,.25); border-top-color: #0a0a0a; animation: ms-spin .8s linear infinite; }
        .ms-show-pwd { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,.45); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; padding: 4px 6px; }
        .ms-show-pwd:hover { color: #C6A55A; }
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
      `}</style>

      <div className="ms-login-bg">
        <div className="ms-login-grid" />
        <div className="ms-login-glow" />

        <div className="ms-login-card">
          <div className="ms-login-ring">
            <LogoMark size={44} />
          </div>

          <div className="ms-login-title">The Milano Seal™</div>
          <div className="ms-login-tag">Sealing Trust in Every Signature</div>

          <div style={{ marginBottom: 18 }}>
            <div className="ms-flbl">Access Level</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {(Object.keys(ROLE_HINTS) as Role[]).map((r) => {
                const o = ROLE_HINTS[r];
                const active = role === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className="ms-role-btn"
                    data-active={active}
                  >
                    <div
                      className="ms-role-btn-l"
                      style={{ color: active ? "#C6A55A" : "#fff" }}
                    >
                      {o.label}
                    </div>
                    <div className="ms-role-btn-s">{o.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {role && magicSent && (
            <div
              className="ms-success"
              style={{ animation: "ms-fadeUp .4s ease both" }}
            >
              <div className="ms-success-h">Check your email</div>
              <div className="ms-success-p">
                We sent a sign-in link to{" "}
                <span className="ms-success-em">{email}</span>. Click it to view
                your matter — no password needed.
              </div>
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

          {role && !magicSent && (
            <form
              onSubmit={submit}
              style={{ animation: "ms-fadeUp .4s ease both" }}
            >
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="email" className="ms-flbl">
                  Email
                </label>
                <input
                  id="email"
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
                  <label htmlFor="password" className="ms-flbl">
                    Password
                  </label>
                  <input
                    id="password"
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              )}

              <div className="ms-hint">
                {isClient ? (
                  <>
                    Use the email associated with your matter. We&rsquo;ll send
                    a one-time sign-in link — <span>no password required</span>.
                  </>
                ) : (
                  <>
                    Operator access — use your <span>Milano Seal</span>{" "}
                    credentials.
                  </>
                )}
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
                    {isClient ? "Sending link…" : "Signing in…"}
                  </>
                ) : isClient ? (
                  "Send Magic Link"
                ) : (
                  "Continue"
                )}
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
