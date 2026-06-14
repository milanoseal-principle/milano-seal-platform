"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PortalAccessShell } from "@/components/portal/PortalAccessShell";
import { RitualEntryLock } from "@/components/ritual/RitualEntryLock";

const GATEWAY_KEY = "milano_ritual_access_gateway_seen";

const GATEWAY_STEPS = [
  "Verifying access environment",
  "Connecting to secure workspace",
  "Resolving role access",
  "Preparing entry gateway",
  "Ready",
];

function destForRole(role: string, fallback: string): string {
  if (role === "founder_admin" || role === "admin" || role === "admin_operator" ||
      role === "ops_manager" || role === "finance" || role === "execution_coordinator" ||
      role === "apostille_coordinator" || role === "finance_operator" || role === "client_support") {
    return "/dashboard";
  }
  if (role === "client") return "/portal";
  if (role === "alliance" || role === "alliance_partner" || role === "alliance_member") return "/alliance/dashboard";
  if (role === "virtual_assistant" || role === "va_manager" || role === "intake_assistant" ||
      role === "scheduling_assistant" || role === "document_coordinator" ||
      role === "translation_coordinator" || role === "courier_assistant" ||
      role === "followup_coordinator" || role === "alliance_support_assistant" ||
      role === "escalation_assistant") {
    return "/va/dashboard";
  }
  return fallback;
}

function MilanoSealOrb() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/milano-seal-feather-m-orb.svg"
      alt="The Milano Seal"
      width={52}
      height={52}
      style={{ display: "block", width: 52, height: 52, objectFit: "contain" }}
      draggable={false}
    />
  );
}

function LoginInner() {
  const [accessType, setAccessType] = useState<"portal"|"dashboard"|"alliance"|"va">("portal");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalShellDismissed, setPortalShellDismissed] = useState(false);
  const [gatewayDone, setGatewayDone] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!sessionStorage.getItem(GATEWAY_KEY);
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const rawNext = searchParams.get("next") || "";
  const safeNext =
    rawNext.startsWith("/portal") ||
    rawNext.startsWith("/alliance") ||
    rawNext.startsWith("/va") ||
    rawNext.startsWith("/dashboard")
      ? rawNext
      : null;

  // Redirect already-authenticated users — must be before any conditional return
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) return;
        const role = ((data.user.user_metadata?.role ?? data.user.app_metadata?.role) as string) ?? "";
        router.replace(safeNext || destForRole(role, "/dashboard"));
      }).catch(() => { /* ignore — non-blocking redirect check */ });
    } catch {
      // createClient() throws if NEXT_PUBLIC env vars are missing at browser runtime.
      // This is non-fatal for the login page — user can still sign in via the API route.
    }
  }, [router, safeNext]);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_failed" || err === "otp_expired") {
      setError("That access link has expired or was already used. Please sign in again.");
    } else if (err === "access_denied") {
      setError("Access denied. Your session may have expired — please sign in again.");
    }
  }, [searchParams]);

  // Access gateway ritual — plays once per session for all login visitors.
  if (!gatewayDone) {
    return (
      <RitualEntryLock
        eyebrow="Access Gateway"
        steps={GATEWAY_STEPS}
        sectionLabel="Preparing secure access environment"
        sessionKey={GATEWAY_KEY}
        onComplete={() => setGatewayDone(true)}
      />
    );
  }

  // Show PortalAccessShell as the entry gate for portal clients before the login form.
  // Clicking "Access My Matter" (the only <a> link in the shell) dismisses the shell
  // and reveals the login form below, rather than navigating away.
  const isPortalEntry = rawNext.startsWith("/portal") || rawNext === "";
  if (isPortalEntry && !portalShellDismissed) {
    return (
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("a")) {
            e.preventDefault();
            setPortalShellDismissed(true);
          }
        }}
      >
        <PortalAccessShell nextPath={safeNext ?? "/portal"} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, next: safeNext }),
      });

      const json = await res.json() as { ok: boolean; error?: string; redirect?: string };

      if (!json.ok) {
        setError(json.error ?? "Sign-in failed. Please try again.");
        return;
      }

      router.replace(json.redirect ?? "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ms-fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ms-spin { to{transform:rotate(360deg)} }
        @keyframes ms-goldPulse { 0%,100%{opacity:.45} 50%{opacity:.9} }

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
          width:calc(100% - 32px); max-width:420px;
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
          line-height:1.6; letter-spacing:.04em; margin:0 0 28px;
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
          <div className="ms-ring"><MilanoSealOrb /></div>

          <div className="ms-eyebrow">The Milano Seal™</div>
          <h1 className="ms-title">Secure Access</h1>
          <p className="ms-subtitle">
            {accessType === "portal" && "Access your active matter, track execution progress, and coordinate your document specialist."}
            {accessType === "dashboard" && "Operator workspace for matter execution, payment review, and courier coordination."}
            {accessType === "alliance" && "Alliance partner access for referral matters and commission visibility."}
            {accessType === "va" && "VA workspace for assigned tasks, document coordination, and matter support."}
          </p>

          {/* Access type selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {([
              { key: "portal", label: "Secure Matter Portal" },
              { key: "dashboard", label: "Operator" },
              { key: "alliance", label: "Alliance" },
              { key: "va", label: "VA" },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setAccessType(t.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 2,
                  border: accessType === t.key ? "1px solid rgba(198,165,90,0.6)" : "1px solid rgba(198,165,90,0.15)",
                  background: accessType === t.key ? "rgba(198,165,90,0.1)" : "transparent",
                  color: accessType === t.key ? "#C6A55A" : "rgba(255,255,255,0.3)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
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
          </form>

          <div className="ms-foot">
            Protected access · Matter-level controls · Audit-aware workspace
            <br />International execution infrastructure
          </div>
          <div className="ms-foot-reg">FL Notary #668288 · EIN 41-5272965</div>
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
