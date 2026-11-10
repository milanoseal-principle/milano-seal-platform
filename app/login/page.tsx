"use client";

import {
  Component,
  Suspense,
  useState,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RitualEntryLock } from "@/components/ritual/RitualEntryLock";

function destForRole(role: string): string {
  if (
    role === "founder" ||
    role === "founder_admin" ||
    role === "admin" ||
    role === "admin_operator" ||
    role === "ops_manager" ||
    role === "finance" ||
    role === "execution_coordinator" ||
    role === "apostille_coordinator" ||
    role === "finance_operator" ||
    role === "client_support"
  ) {
    return "/dashboard";
  }
  if (role === "client") return "/portal";
  if (role === "professional") return "/professional/matters";
  if (role === "alliance" || role === "alliance_partner" || role === "alliance_member") {
    return "/alliance/dashboard";
  }
  if (
    role === "virtual_assistant" ||
    role === "va_manager" ||
    role === "intake_assistant" ||
    role === "scheduling_assistant" ||
    role === "document_coordinator" ||
    role === "translation_coordinator" ||
    role === "courier_assistant" ||
    role === "followup_coordinator" ||
    role === "alliance_support_assistant" ||
    role === "escalation_assistant"
  ) {
    return "/va/dashboard";
  }
  return "/login?error=access_denied";
}

function isNextAllowedForRole(next: string | null, role: string): next is string {
  if (!next) return false;
  const destination = destForRole(role);
  if (destination === "/dashboard") return next.startsWith("/dashboard");
  if (destination === "/portal") return next.startsWith("/portal");
  if (destination === "/alliance/dashboard") return next.startsWith("/alliance");
  if (destination === "/va/dashboard") return next.startsWith("/va");
  if (destination === "/professional/matters") {
    return next.startsWith("/professional/matters") || next.startsWith("/professional/account");
  }
  return false;
}

interface RitualConfig {
  eyebrow: string;
  steps: string[];
  sectionLabel: string;
  statusText: string;
  footerText: string;
}

function ritualForDestination(destination: string, _role?: string): RitualConfig {
  if (destination.startsWith("/alliance")) {
    return {
      eyebrow: "Alliance Partner Access",
      steps: [
        "Verifying alliance credentials",
        "Loading referral matters",
        "Syncing commission visibility",
        "Access granted",
      ],
      sectionLabel: "Preparing alliance workspace",
      statusText: "Preparing your alliance partner workspace.",
      footerText: "ALLIANCE ACCESS GRANTED",
    };
  }
  if (destination.startsWith("/va")) {
    return {
      eyebrow: "VA Workspace",
      steps: [
        "Verifying VA credentials",
        "Loading assigned tasks",
        "Syncing matter queue",
        "Access granted",
      ],
      sectionLabel: "Preparing VA workspace",
      statusText: "Preparing your VA workspace.",
      footerText: "VA WORKSPACE READY",
    };
  }
  if (destination.startsWith("/dashboard")) {
    return {
      eyebrow: "Execution Intelligence",
      steps: [
        "Verifying credentials",
        "Loading matter pipeline",
        "Resolving operator access",
        "Syncing execution workspace",
        "Access granted",
      ],
      sectionLabel: "Preparing execution workspace",
      statusText: "Preparing your execution workspace.",
      footerText: "EXECUTION WORKSPACE READY",
    };
  }
  return {
    eyebrow: "Secure Matter Portal",
    steps: [
      "Verifying your identity",
      "Loading your active matter",
      "Resolving portal access",
      "Preparing secure workspace",
      "Ready",
    ],
    sectionLabel: "Preparing your secure portal",
    statusText: "Your authorized Matter workspace is being prepared.",
    footerText: "MATTER PORTAL READY",
  };
}

function MilanoSealOrb() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/milano-seal-orb-v2.png"
      alt="The Milano Seal"
      width={88}
      height={88}
      style={{
        display: "block",
        width: 88,
        height: 88,
        objectFit: "contain",
        filter: "drop-shadow(0 0 16px rgba(212,175,55,0.6))",
      }}
      draggable={false}
    />
  );
}

interface LoginErrorBoundaryState {
  hasError: boolean;
}

class LoginErrorBoundary extends Component<{ children: ReactNode }, LoginErrorBoundaryState> {
  state: LoginErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LoginErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Deliberately avoid logging auth state, URL parameters, or credentials.
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#070504] px-6 text-center">
        <div className="w-full max-w-md border border-[var(--ms-gold)]/20 bg-[#0C0904] p-8 shadow-[0_32px_96px_rgba(0,0,0,.7)]">
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/75">
            Secure Access Recovery
          </div>
          <h1 className="mt-4 font-serif text-2xl text-white">The access gateway could not initialize.</h1>
          <p className="mt-3 text-sm leading-6 text-white/50">
            Reload the secure sign-in page. No credentials were submitted.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign("/login")}
            className="mt-6 min-h-11 w-full bg-[var(--ms-gold)] px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#070504]"
          >
            Reload Secure Access
          </button>
        </div>
      </div>
    );
  }
}

async function warmAuthenticatedDestination(destination: string): Promise<void> {
  if (!destination.startsWith("/portal")) return;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2200));
  const warmup = fetch("/api/portal/me", {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
    .then(() => undefined)
    .catch(() => undefined);
  await Promise.race([warmup, timeout]);
}

function LoginInner() {
  const [accessType, setAccessType] = useState<"portal" | "dashboard" | "alliance" | "va">("portal");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [destinationReady, setDestinationReady] = useState(false);
  const [pendingNav, setPendingNav] = useState<{ redirect: string; role?: string } | null>(null);

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

  useEffect(() => {
    if (searchParams.get("error") === "access_denied") return;
    try {
      const supabase = createClient();
      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (!data.user) return;
          const role = (data.user.app_metadata?.role as string) ?? "";
          if (!role) return;
          // Already authenticated users remain on the gateway so they can choose an authorized surface.
        })
        .catch(() => undefined);
    } catch {
      // Browser runtime may not have public Supabase variables during static diagnostics.
    }
  }, [router, safeNext, searchParams]);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_failed" || err === "otp_expired") {
      setError("That access link has expired or was already used. Please sign in again.");
    } else if (err === "access_denied") {
      setError("Access denied. Your session may have expired — please sign in again.");
    }
  }, [searchParams]);

  if (pendingNav) {
    const ritual = ritualForDestination(pendingNav.redirect, pendingNav.role);
    return (
      <RitualEntryLock
        eyebrow={ritual.eyebrow}
        steps={ritual.steps}
        sectionLabel={ritual.sectionLabel}
        statusText={ritual.statusText}
        footerText={ritual.footerText}
        ready={destinationReady}
        minimumDurationMs={3200}
        hardTimeoutMs={6500}
        holdUntilUnmount
        onComplete={() => {
          try {
            const destination = pendingNav.redirect;
            if (destination.startsWith("/va")) sessionStorage.setItem("ms_va_ritual_seen", "1");
            else if (destination.startsWith("/portal")) sessionStorage.setItem("ms-portal-entry", "1");
            else if (destination.startsWith("/dashboard")) sessionStorage.setItem("ms-operator-entry", "1");
            else if (destination.startsWith("/alliance")) sessionStorage.setItem("ms_alliance_ritual_seen", "1");
          } catch {
            // Session persistence is non-critical.
          }
          router.replace(pendingNav.redirect);
        }}
      />
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setDestinationReady(false);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          next: safeNext,
          tabHint: accessType,
        }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        error?: string;
        redirect?: string;
        role?: string;
      };
      if (!json.ok) {
        setError(json.error ?? "Sign-in failed. Please try again.");
        return;
      }

      const canonicalDestination = destForRole(json.role ?? "");
      const requestedDestination = json.redirect ?? canonicalDestination;
      const redirect = isNextAllowedForRole(requestedDestination, json.role ?? "")
        ? requestedDestination
        : canonicalDestination;

      router.prefetch(redirect);
      setPendingNav({ redirect, role: json.role });
      await warmAuthenticatedDestination(redirect);
      setDestinationReady(true);
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
        .ms-bg { position:fixed; inset:0; background:#070504; display:flex; align-items:center; justify-content:center; overflow:hidden; padding-top:env(safe-area-inset-top,0px); padding-bottom:env(safe-area-inset-bottom,0px); }
        .ms-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(198,165,90,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(198,165,90,.04) 1px,transparent 1px); background-size:52px 52px; mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 72%); }
        .ms-glow { position:absolute; width:700px; height:700px; border-radius:50%; background:radial-gradient(circle,rgba(198,165,90,.09),transparent 58%); filter:blur(48px); animation:ms-goldPulse 7s ease-in-out infinite; pointer-events:none; }
        .ms-card { position:relative; z-index:1; width:calc(100% - 32px); max-width:420px; background:rgba(12,9,4,0.94); border:1px solid rgba(198,165,90,.18); padding:48px 44px 38px; border-radius:3px; backdrop-filter:blur(16px); box-shadow:0 32px 96px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.02) inset; animation:ms-fadeUp .55s cubic-bezier(0.16,1,0.3,1) both; }
        .ms-card::before { content:''; position:absolute; top:0; left:56px; right:56px; height:1px; background:linear-gradient(90deg,transparent,rgba(198,165,90,.7),transparent); }
        .ms-ring { width:88px; height:88px; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; filter:drop-shadow(0 0 18px rgba(198,165,90,.55)); animation:ms-goldPulse 4s ease-in-out infinite; }
        .ms-eyebrow { font-size:9.5px; letter-spacing:.28em; text-transform:uppercase; color:rgba(198,165,90,.8); text-align:center; margin-bottom:8px; }
        .ms-title { font-family:var(--font-playfair,'Playfair Display'),Georgia,serif; font-size:22px; font-weight:400; color:#fff; text-align:center; margin:0 0 8px; letter-spacing:.02em; }
        .ms-subtitle { font-size:10px; color:rgba(255,255,255,.42); text-align:center; line-height:1.6; letter-spacing:.04em; margin:0 0 28px; }
        .ms-flbl { display:block; font-size:9px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.55); margin-bottom:7px; }
        .ms-fi { width:100%; background:rgba(255,255,255,.04); border:1px solid rgba(198,165,90,.14); padding:11px 12px; color:#fff; font-family:var(--font-geist,system-ui),sans-serif; font-size:13px; outline:none; transition:all .2s ease; border-radius:2px; box-sizing:border-box; }
        .ms-fi::placeholder { color:rgba(255,255,255,.32); }
        .ms-fi:focus { border-color:var(--ms-gold); background:rgba(198,165,90,.04); }
        .ms-pwd-wrap { position:relative; }
        .ms-pwd-wrap .ms-fi { padding-right:52px; }
        .ms-show-pwd { position:absolute; right:6px; top:50%; transform:translateY(-50%); background:none; border:none; color:rgba(198,165,90,.6); font-size:8.5px; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; padding:0 10px; min-width:44px; min-height:32px; }
        .ms-show-pwd:hover { color:var(--ms-gold); }
        .ms-submit-btn { width:100%; padding:13px; background:var(--ms-gold); color:#0a0a0a; border:none; font-family:var(--font-geist,system-ui),sans-serif; font-size:9.5px; font-weight:600; letter-spacing:.22em; text-transform:uppercase; cursor:pointer; transition:background .2s ease; border-radius:2px; display:inline-flex; align-items:center; justify-content:center; gap:10px; }
        .ms-submit-btn:hover:not(:disabled) { background:#d4b76a; }
        .ms-submit-btn:disabled { opacity:.5; cursor:not-allowed; }
        .ms-spinner { width:12px; height:12px; border-radius:50%; border:1.5px solid rgba(0,0,0,.25); border-top-color:#0a0a0a; animation:ms-spin .8s linear infinite; }
        .ms-err { font-size:10.5px; color:#f87171; margin-bottom:12px; padding:8px 10px; background:rgba(248,113,113,.06); border:1px solid rgba(248,113,113,.2); border-radius:2px; }
        .ms-foot { text-align:center; margin-top:26px; font-size:8.5px; color:rgba(255,255,255,.2); letter-spacing:.1em; line-height:1.7; }
        .ms-foot-reg { margin-top:4px; font-size:8px; color:rgba(255,255,255,.14); letter-spacing:.12em; }
        @media (max-width: 480px) { .ms-card { padding:38px 24px 30px; } }
        @media (prefers-reduced-motion: reduce) { .ms-card,.ms-ring,.ms-glow { animation:none !important; } }
      `}</style>

      <main className="ms-bg">
        <div className="ms-grid" />
        <div className="ms-glow" />
        <div className="ms-card">
          <div className="ms-ring"><MilanoSealOrb /></div>
          <div className="ms-eyebrow">The Milano Seal™</div>
          <h1 className="ms-title">Secure Access</h1>
          <p className="ms-subtitle">
            {accessType === "portal" && "Access your active Matter, track execution progress, and see the next governed stage."}
            {accessType === "dashboard" && "Operator workspace for Matter execution, payment review, and courier coordination."}
            {accessType === "alliance" && "Alliance partner access for referred Matters and governed relationship visibility."}
            {accessType === "va" && "VA workspace for assigned tasks, document coordination, and Matter support."}
          </p>

          <div style={{ display: "flex", gap: 6, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {([
              { key: "portal", label: "Secure Matter Portal" },
              { key: "dashboard", label: "Operator" },
              { key: "alliance", label: "Alliance" },
              { key: "va", label: "VA" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setAccessType(tab.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 2,
                  border: accessType === tab.key ? "1px solid rgba(198,165,90,0.6)" : "1px solid rgba(198,165,90,0.15)",
                  background: accessType === tab.key ? "rgba(198,165,90,0.1)" : "transparent",
                  color: accessType === tab.key ? "var(--ms-gold)" : "rgba(255,255,255,0.3)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={(event) => void handleSubmit(event)}>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="ms-email" className="ms-flbl">Email Address</label>
              <input
                id="ms-email"
                className="ms-fi"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(null); }}
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
                  onChange={(event) => { setPassword(event.target.value); setError(null); }}
                  required
                />
                <button
                  type="button"
                  className="ms-show-pwd"
                  onClick={() => setShowPwd((value) => !value)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <div className="ms-err">{error}</div>}

            <button type="submit" className="ms-submit-btn" disabled={loading}>
              {loading ? <><span className="ms-spinner" />Verifying…</> : "Continue Securely"}
            </button>
          </form>

          <div className="ms-foot">
            Protected access · Matter-level controls · Audit-aware workspace
            <br />International execution infrastructure
          </div>
          <div className="ms-foot-reg">FL Notary #668288 · EIN 41-5272965</div>
        </div>
      </main>
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
            fontFamily: "var(--font-geist-mono,monospace)",
          }}
        >
          Loading…
        </div>
      }
    >
      <LoginErrorBoundary>
        <LoginInner />
      </LoginErrorBoundary>
    </Suspense>
  );
}
