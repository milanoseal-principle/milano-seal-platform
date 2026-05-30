"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = "operator" | "client" | "alliance" | "va";

const ROLES: { id: Role; label: string; sub: string; dest: string }[] = [
  { id: "operator", label: "Operator", sub: "Nicholas Milano / Authorized Staff", dest: "/dashboard" },
  { id: "client",   label: "Matter Control Portal", sub: "Track Your Matter", dest: "/portal" },
  { id: "alliance", label: "Alliance Portal", sub: "Assigned Execution Network", dest: "/alliance" },
  { id: "va",       label: "Virtual Assistant", sub: "Restricted Task Workspace", dest: "/va" },
];

function LogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 20L3 6L12 15L21 6L21 20" stroke="#C6A55A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6C14 2,19 3,20 8C17 5,13 6,12 10Z" fill="#C6A55A" opacity="0.88" />
    </svg>
  );
}

function LoginInner() {
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const rawNext = searchParams.get("next") || "";
  const safeNext =
    rawNext.startsWith("/admin") ||
    rawNext.startsWith("/portal") ||
    rawNext.startsWith("/alliance") ||
    rawNext.startsWith("/va") ||
    rawNext.startsWith("/dashboard")
      ? rawNext
      : null;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(safeNext || "/dashboard");
    });
  }, [router, safeNext]);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_failed" || err === "otp_expired") {
      setError("That access link has expired or was already used. Please sign in again.");
    } else if (err === "access_denied") {
      setError("Access denied. Your session may have expired — please sign in again.");
    }
  }, [searchParams]);

  const dest = role ? (ROLES.find((r) => r.id === role)?.dest ?? "/dashboard") : "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message === "Invalid login credentials"
        ? "Incorrect email or password. Please try again."
        : authError.message);
      return;
    }

    router.replace(safeNext || dest);
  };

  const reset = () => {
    setRole(null);
    setEmail("");
    setPassword("");
    setError(null);
    setSent(false);
  };

  return (
    <>
      <style>{`
        @keyframes ms-fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ms-spin { to{transform:rotate(360deg)} }
        @keyframes ms-goldPulse { 0%,100%{opacity:.45} 50%{opacity:.9} }
        @keyframes ms-route-drift { 0%,100%{transform:translate(0,0)} 33%{transform:translate(5px,-3px)} 66%{transform:translate(-3px,4px)} }

        .ms-bg {
          position:fixed; inset:0; background:#070504;
          display:flex; align-items:center; justify-content:center;
          overflow:hidden;
          padding-top:env(safe-area-inset-top,0px);
          padding-bottom:env(safe-area-inset-bottom,0px);
        }
        .ms-grid {
          position:absolute; inset:0;
          background-image:
            linear-gradient(rgba(198,165,90,.04) 1px,transparent 1px),
            linear-gradient(90deg,rgba(198,165,90,.04) 1px,transparent 1px);
          background-size:52px 52px;
          mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 72%);
        }
        .ms-glow {
          position:absolute; width:700px; height:700px; border-radius:50%;
          background:radial-gradient(circle,rgba(198,165,90,.09),transparent 58%);
          filter:blur(48px);
          animation:ms-goldPulse 7s ease-in-out infinite;
          pointer-events:none;
        }
        .ms-card {
          position:relative; z-index:1;
          width:calc(100% - 32px); max-width:440px;
          background:rgba(12,9,4,0.94);
          border:1px solid rgba(198,165,90,.18);
          padding:48px 44px 38px;
          border-radius:3px;
          backdrop-filter:blur(16px);
          box-shadow:0 32px 96px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.02) inset;
          animation:ms-fadeUp .55s cubic-bezier(0.16,1,0.3,1) both;
        }
        .ms-card::before {
          content:''; position:absolute; top:0; left:56px; right:56px; height:1px;
          background:linear-gradient(90deg,transparent,rgba(198,165,90,.7),transparent);
        }
        .ms-ring {
          width:72px; height:72px; border-radius:50%;
          border:1px solid rgba(198,165,90,.35);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 24px;
          animation:ms-goldPulse 4s ease-in-out infinite;
          box-shadow:0 0 32px rgba(198,165,90,.12);
        }
        .ms-eyebrow {
          font-size:9.5px; letter-spacing:.28em; text-transform:uppercase;
          color:rgba(198,165,90,.8); text-align:center; margin-bottom:8px;
        }
        .ms-title {
          font-family:var(--font-playfair,'Playfair Display'),Georgia,serif;
          font-size:22px; font-weight:400; color:#fff;
          text-align:center; margin:0 0 8px; letter-spacing:.02em;
        }
        .ms-subtitle {
          font-size:10px; color:rgba(255,255,255,.42); text-align:center;
          line-height:1.6; letter-spacing:.04em; margin:0 0 16px;
        }
        .ms-badge {
          display:flex; justify-content:center; margin-bottom:28px;
        }
        .ms-badge span {
          font-size:8.5px; letter-spacing:.2em; text-transform:uppercase;
          color:rgba(198,165,90,.7); border:1px solid rgba(198,165,90,.2);
          padding:5px 14px; border-radius:2px;
        }
        .ms-lbl {
          font-size:9px; font-weight:600; letter-spacing:.18em; text-transform:uppercase;
          color:rgba(255,255,255,.4); margin-bottom:10px;
        }
        .ms-roles {
          display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:20px;
        }
        .ms-role {
          background:rgba(255,255,255,.03); border:1px solid rgba(198,165,90,.12);
          padding:14px 12px; border-radius:2px; cursor:pointer; text-align:left;
          transition:all .2s ease;
        }
        .ms-role:hover { border-color:rgba(198,165,90,.3); background:rgba(198,165,90,.04); }
        .ms-role[data-active=true] { border-color:#C6A55A; background:rgba(198,165,90,.08); }
        .ms-role-l {
          font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase;
          color:rgba(255,255,255,.75); margin-bottom:4px; line-height:1.3;
        }
        .ms-role[data-active=true] .ms-role-l { color:#C6A55A; }
        .ms-role-s {
          font-size:8px; letter-spacing:.12em; text-transform:uppercase;
          color:rgba(255,255,255,.32);
        }
        .ms-flbl {
          display:block; font-size:9px; font-weight:600; letter-spacing:.18em;
          text-transform:uppercase; color:rgba(255,255,255,.55); margin-bottom:7px;
        }
        .ms-fi {
          width:100%; background:rgba(255,255,255,.04);
          border:1px solid rgba(198,165,90,.14);
          padding:11px 12px; color:#fff;
          font-family:var(--font-geist,system-ui),sans-serif;
          font-size:13px; outline:none; transition:all .2s ease; border-radius:2px;
          box-sizing:border-box;
        }
        .ms-fi::placeholder { color:rgba(255,255,255,.32); }
        .ms-fi:focus { border-color:#C6A55A; background:rgba(198,165,90,.04); }
        .ms-pwd-wrap { position:relative; }
        .ms-pwd-wrap .ms-fi { padding-right:52px; }
        .ms-show-pwd {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; color:rgba(198,165,90,.6);
          font-size:8.5px; letter-spacing:.12em; text-transform:uppercase;
          cursor:pointer; padding:4px;
        }
        .ms-show-pwd:hover { color:#C6A55A; }
        .ms-submit-btn {
          width:100%; padding:13px; background:#C6A55A; color:#0a0a0a;
          border:none;
          font-family:var(--font-geist,system-ui),sans-serif;
          font-size:9.5px; font-weight:600; letter-spacing:.22em; text-transform:uppercase;
          cursor:pointer; transition:background .2s ease; border-radius:2px;
          display:inline-flex; align-items:center; justify-content:center; gap:10px;
        }
        .ms-submit-btn:hover:not(:disabled) { background:#d4b76a; }
        .ms-submit-btn:disabled { opacity:.5; cursor:not-allowed; }
        .ms-spinner {
          width:12px; height:12px; border-radius:50%;
          border:1.5px solid rgba(0,0,0,.25); border-top-color:#0a0a0a;
          animation:ms-spin .8s linear infinite;
        }
        .ms-err {
          font-size:10.5px; color:#f87171; margin-bottom:12px;
          padding:8px 10px;
          background:rgba(248,113,113,.06);
          border:1px solid rgba(248,113,113,.2); border-radius:2px;
        }
        .ms-link-btn {
          background:none; border:none; color:rgba(198,165,90,.65);
          font-size:9.5px; letter-spacing:.14em; text-transform:uppercase;
          cursor:pointer; padding:8px; margin-top:8px;
          transition:color .15s ease; display:block; width:100%; text-align:center;
        }
        .ms-link-btn:hover { color:#C6A55A; }
        .ms-foot {
          text-align:center; margin-top:26px;
          font-size:8.5px; color:rgba(255,255,255,.2);
          letter-spacing:.1em; line-height:1.7;
        }
        .ms-foot-reg {
          margin-top:4px; font-size:8px;
          color:rgba(255,255,255,.14); letter-spacing:.12em;
        }
      `}</style>

      <div className="ms-bg">
        <div className="ms-grid" />
        <div className="ms-glow" />

        <div className="ms-card">
          <div className="ms-ring"><LogoMark /></div>

          <div className="ms-eyebrow">The Milano Seal™</div>
          <h1 className="ms-title">Secure Workspace Access</h1>
          <p className="ms-subtitle">
            Private access for international document execution,
            Hague routing, and protected matter coordination.
          </p>
          <div className="ms-badge">
            <span>Hague-aware document coordination</span>
          </div>

          {!role ? (
            <>
              <div className="ms-lbl">Access Level</div>
              <div className="ms-roles">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="ms-role"
                    data-active="false"
                    onClick={() => { setRole(r.id); setError(null); }}
                  >
                    <div className="ms-role-l">{r.label}</div>
                    <div className="ms-role-s">{r.sub}</div>
                  </button>
                ))}
              </div>
              {error && <div className="ms-err">{error}</div>}
              <div className="ms-foot">
                Protected access · Matter-level controls · Audit-aware workspace
                <br />International execution infrastructure
              </div>
              <div className="ms-foot-reg">FL Notary #668288 · EIN 41-5272965</div>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ animation: "ms-fadeUp .35s ease both" }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase",
                  color: "#C6A55A", background: "rgba(198,165,90,.08)",
                  border: "1px solid rgba(198,165,90,.2)", borderRadius: 2,
                  padding: "5px 10px", display: "inline-block", marginBottom: 16,
                }}>
                  {ROLES.find((r) => r.id === role)?.label}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="ms-email" className="ms-flbl">Email Address</label>
                <input
                  id="ms-email"
                  className="ms-fi"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label htmlFor="ms-password" className="ms-flbl">Password</label>
                <div className="ms-pwd-wrap">
                  <input
                    id="ms-password"
                    className="ms-fi"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    required
                  />
                  <button
                    type="button"
                    className="ms-show-pwd"
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && <div className="ms-err">{error}</div>}

              <button type="submit" className="ms-submit-btn" disabled={loading}>
                {loading ? (
                  <><span className="ms-spinner" />Verifying…</>
                ) : (
                  "Continue Securely"
                )}
              </button>

              <button type="button" className="ms-link-btn" onClick={reset}>
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          position: "fixed", inset: 0, background: "#070504",
          color: "rgba(255,255,255,.3)", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase",
          fontFamily: "var(--font-geist-mono,monospace)",
        }}>
          Loading…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
