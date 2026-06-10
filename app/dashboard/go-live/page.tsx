import type { Metadata } from "next";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Globe,
  ShieldCheck,
  Database,
  Webhook,
  FileText,
  Mail,
  CreditCard,
  Server,
  Eye,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Go-Live Checklist — The Milano Seal™",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface CheckItem {
  label: string;
  detail: string;
  status: "done" | "warn" | "todo";
}

interface CheckSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: CheckItem[];
}

const CHECKLIST: CheckSection[] = [
  {
    title: "Domain & DNS",
    icon: Globe,
    items: [
      {
        label: "Primary domain resolves",
        detail: "themilanoseal.com → Vercel",
        status: "done",
      },
      {
        label: "www redirect active",
        detail: "www.themilanoseal.com → themilanoseal.com",
        status: "done",
      },
      {
        label: "SSL certificate valid",
        detail: "TLS 1.3, auto-renewing via Vercel",
        status: "done",
      },
    ],
  },
  {
    title: "Database",
    icon: Database,
    items: [
      {
        label: "Supabase project active",
        detail: "Production project, not preview",
        status: "done",
      },
      {
        label: "Migrations applied",
        detail: "001–007 applied in sequence",
        status: "warn",
      },
      {
        label: "RLS enabled on all tables",
        detail: "No public policies on sensitive tables",
        status: "done",
      },
      {
        label: "Service role key in Vercel env",
        detail: "SUPABASE_SERVICE_ROLE_KEY set, not in code",
        status: "done",
      },
    ],
  },
  {
    title: "Authentication",
    icon: ShieldCheck,
    items: [
      {
        label: "Supabase Auth configured",
        detail: "Email provider active, redirects set",
        status: "done",
      },
      {
        label: "Dashboard access restricted",
        detail: "requireDashboardAccess() on layout",
        status: "done",
      },
      {
        label: "Portal access restricted",
        detail: "requirePortalAccess() on client routes",
        status: "done",
      },
      {
        label: "Alliance access restricted",
        detail: "requireAllianceAccess() on alliance routes",
        status: "done",
      },
    ],
  },
  {
    title: "Webhooks",
    icon: Webhook,
    items: [
      {
        label: "Wise webhook endpoint live",
        detail: "/api/webhook/wise — signature verification active",
        status: "done",
      },
      {
        label: "Stripe endpoint returns 410",
        detail: "Intentionally retired — returns Gone",
        status: "done",
      },
      {
        label: "Wise webhook registered in Wise dashboard",
        detail: "Confirm delivery URL points to production domain",
        status: "warn",
      },
    ],
  },
  {
    title: "Cron Jobs",
    icon: FileText,
    items: [
      {
        label: "vercel.json cron config",
        detail: "sla-watch (hourly), track-shipments (30min)",
        status: "done",
      },
      {
        label: "Vercel cron enabled",
        detail: "Confirm in Vercel project settings",
        status: "warn",
      },
      {
        label: "CRON_SECRET env var set",
        detail: "Required to authenticate cron requests",
        status: "warn",
      },
    ],
  },
  {
    title: "Email",
    icon: Mail,
    items: [
      {
        label: "Resend API key set",
        detail: "RESEND_API_KEY in Vercel env",
        status: "done",
      },
      {
        label: "From domain verified in Resend",
        detail: "themilanoseal.com authorized sender",
        status: "warn",
      },
    ],
  },
  {
    title: "Payments",
    icon: CreditCard,
    items: [
      {
        label: "Wise primary rail active",
        detail: "Payment links generated on intake",
        status: "done",
      },
      {
        label: "Payment gate code-enforced",
        detail: "awaiting_payment → scheduled blocked without payment_status=paid",
        status: "done",
      },
      {
        label: "No Stripe keys in environment",
        detail: "Stripe intentionally retired",
        status: "done",
      },
    ],
  },
];

const STATUS_CONFIG = {
  done: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "DONE",
  },
  warn: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "VERIFY",
  },
  todo: {
    icon: Circle,
    color: "text-gray-500",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    label: "TODO",
  },
};

export default function GoLivePage() {
  const totalItems = CHECKLIST.flatMap((s) => s.items).length;
  const doneCount = CHECKLIST.flatMap((s) => s.items).filter(
    (i) => i.status === "done",
  ).length;
  const warnCount = CHECKLIST.flatMap((s) => s.items).filter(
    (i) => i.status === "warn",
  ).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-[#6A5520] mb-2">
          Production Deployment
        </p>
        <h1 className="text-2xl font-serif font-medium text-white mb-1">
          Go-Live Checklist
        </h1>
        <p className="text-sm text-gray-500">
          Verify before directing live client traffic to this deployment.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {doneCount}
          </div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-emerald-500/70 mt-1">
            Confirmed
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-mono font-bold text-amber-400">
            {warnCount}
          </div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-amber-500/70 mt-1">
            Needs Verify
          </div>
        </div>
        <div className="bg-[#111] border border-[#2A2A2A] rounded-lg p-4 text-center">
          <div className="text-2xl font-mono font-bold text-white">
            {totalItems}
          </div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-gray-600 mt-1">
            Total Items
          </div>
        </div>
      </div>

      {/* Checklist sections */}
      <div className="space-y-6">
        {CHECKLIST.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E1E1E]">
                <span className="inline-flex p-1.5 rounded bg-[#1A1A1A]">
                  <Icon className="w-3.5 h-3.5 text-[#C6A55A]" />
                </span>
                <span className="text-xs font-mono tracking-widest uppercase text-[#8A8A8A]">
                  {section.title}
                </span>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {section.items.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-start gap-4 px-5 py-3.5"
                    >
                      <span
                        className={`inline-flex p-1 rounded ${cfg.bg} ${cfg.border} border mt-0.5 flex-shrink-0`}
                      >
                        <StatusIcon className={`w-3 h-3 ${cfg.color}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-white font-medium">
                            {item.label}
                          </span>
                          <span
                            className={`text-[8px] font-mono tracking-widest ${cfg.color} flex-shrink-0`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg">
        <p className="text-[9px] font-mono tracking-[0.25em] uppercase text-gray-600">
          Items marked VERIFY require manual confirmation in external systems
          (Vercel dashboard, Wise dashboard, Resend, Supabase). This page does
          not read live environment state.
        </p>
      </div>

      {/* ── Section 16: Production-Side Blocker Confirmation ── */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-[#1E1E1E]" />
          <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-[#6A5520] whitespace-nowrap">
            Section 16 — Production-Side Blocker Confirmation
          </span>
          <div className="h-px flex-1 bg-[#1E1E1E]" />
        </div>

        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          The codebase is build-clean. Production is not live-ready until every
          item below is confirmed in external systems. These cannot be verified
          from the repo — they require action inside Vercel, Supabase, Wise, and
          Shippo dashboards.
        </p>

        <div className="space-y-5">

          {/* A: Vercel Environment Variables */}
          <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E1E1E]">
              <span className="inline-flex p-1.5 rounded bg-[#1A1A1A]">
                <Server className="w-3.5 h-3.5 text-[#C6A55A]" />
              </span>
              <span className="text-xs font-mono tracking-widest uppercase text-[#8A8A8A]">
                A — Vercel Environment Variables
              </span>
              <span className="ml-auto text-[8px] font-mono text-amber-400 tracking-widest">
                EXTERNAL ACTION
              </span>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] text-gray-600 mb-3 font-mono">
                Confirm each is set in Vercel Production — do not print values.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
                {[
                  "WISE_WEBHOOK_SECRET",
                  "SHIPPO_WEBHOOK_SECRET",
                  "CRON_SECRET",
                  "OPERATOR_EMAILS",
                  "ADMIN_EMAILS",
                  "NEXT_PUBLIC_SUPABASE_URL",
                  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
                  "SUPABASE_SERVICE_ROLE_KEY",
                  "WISE_API_TOKEN",
                  "WISE_PROFILE_ID",
                  "SHIPPO_API_KEY",
                  "RESEND_API_KEY",
                  "ANTHROPIC_API_KEY",
                  "NEXT_PUBLIC_SITE_URL",
                  "TWILIO_ACCOUNT_SID",
                  "TWILIO_AUTH_TOKEN",
                ].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400/60 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-gray-400">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* B: Supabase Production Database */}
          <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E1E1E]">
              <span className="inline-flex p-1.5 rounded bg-[#1A1A1A]">
                <Database className="w-3.5 h-3.5 text-[#C6A55A]" />
              </span>
              <span className="text-xs font-mono tracking-widest uppercase text-[#8A8A8A]">
                B — Supabase Production Database
              </span>
              <span className="ml-auto text-[8px] font-mono text-amber-400 tracking-widest">
                EXTERNAL ACTION
              </span>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {[
                {
                  label: "Migrations 001–008 applied in sequence",
                  detail:
                    "001_initial_schema → 002_rls → 003_va_tasks → 004_sops → 005_audit_events → 006_operational → 007_loss_relationship → 008_missing_views_and_tables",
                },
                {
                  label: "client_safe_matter_view exists and is queryable",
                  detail:
                    "/api/portal/me reads this view to project client-safe matter data",
                },
                {
                  label: "client_safe_timeline_view exists and is queryable",
                  detail:
                    "/api/portal/me reads this view for client-facing timeline events",
                },
                {
                  label: "RLS confirmed active on all production tables",
                  detail:
                    "Verify in Supabase dashboard — deals, payments, messages, custody_ledger, security_events, follow_ups, sla_breaches, compliance_checks, partner_commissions",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4 px-5 py-3.5">
                  <span className="inline-flex p-1 rounded bg-amber-500/10 border border-amber-500/20 mt-0.5 flex-shrink-0">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium">{item.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.detail}</p>
                  </div>
                  <span className="text-[8px] font-mono text-amber-400 tracking-widest flex-shrink-0 mt-1">
                    VERIFY
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* C: Webhook Registration */}
          <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E1E1E]">
              <span className="inline-flex p-1.5 rounded bg-[#1A1A1A]">
                <Webhook className="w-3.5 h-3.5 text-[#C6A55A]" />
              </span>
              <span className="text-xs font-mono tracking-widest uppercase text-[#8A8A8A]">
                C — Webhook Registration
              </span>
              <span className="ml-auto text-[8px] font-mono text-amber-400 tracking-widest">
                EXTERNAL ACTION
              </span>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {[
                {
                  label: "Wise webhook registered",
                  endpoint: "https://themilanoseal.com/api/webhook/wise",
                  detail: "Register in Wise developer dashboard — signature verification is active",
                },
                {
                  label: "Shippo webhook registered",
                  endpoint: "https://themilanoseal.com/api/courier/webhook",
                  detail: "Register in Shippo dashboard — HMAC-SHA256 verification is active",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4 px-5 py-3.5">
                  <span className="inline-flex p-1 rounded bg-amber-500/10 border border-amber-500/20 mt-0.5 flex-shrink-0">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium">{item.label}</p>
                    <p className="text-[10px] font-mono text-[#C6A55A]/70 mt-0.5 break-all">
                      {item.endpoint}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.detail}</p>
                  </div>
                  <span className="text-[8px] font-mono text-amber-400 tracking-widest flex-shrink-0 mt-1">
                    VERIFY
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* D: Live Browser Smoke Test */}
          <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E1E1E]">
              <span className="inline-flex p-1.5 rounded bg-[#1A1A1A]">
                <Eye className="w-3.5 h-3.5 text-[#C6A55A]" />
              </span>
              <span className="text-xs font-mono tracking-widest uppercase text-[#8A8A8A]">
                D — Live Browser Smoke Test
              </span>
              <span className="ml-auto text-[8px] font-mono text-amber-400 tracking-widest">
                POST-DEPLOY
              </span>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] text-gray-600 mb-4 font-mono">
                Run after Vercel deploy on both desktop and mobile browsers.
                Confirm each route loads without error, redirects correctly, and
                does not expose admin or internal data.
              </p>
              <div className="space-y-1">
                {[
                  { route: "/", label: "Homepage — public, indexable" },
                  { route: "/login", label: "Login — public, no redirect loop" },
                  { route: "/apostille/italy", label: "Country page — public, SEO" },
                  { route: "/documents/power-of-attorney", label: "Document page — public, SEO" },
                  { route: "/dashboard", label: "Dashboard — redirects anonymous to /login" },
                  { route: "/portal", label: "Portal — redirects anonymous to /login" },
                  { route: "/alliance/dashboard", label: "Alliance — redirects non-alliance to /login" },
                  { route: "/va/dashboard", label: "VA — redirects non-VA to /login" },
                  { route: "/dashboard/security", label: "Security — admin-only, noindex" },
                  { route: "/dashboard/courier", label: "Courier — admin-only" },
                  { route: "/dashboard/tools", label: "Tools — admin-only" },
                  { route: "/dashboard/sops", label: "SOPs — admin-only" },
                  { route: "/dashboard/va", label: "VA queue — admin-only" },
                ].map((item) => (
                  <div key={item.route} className="flex items-center gap-3 py-1">
                    <Circle className="w-2.5 h-2.5 text-gray-600 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-[#C6A55A]/80 w-52 flex-shrink-0">
                      {item.route}
                    </span>
                    <span className="text-[10px] text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* E: Final Rule */}
          <div className="bg-[#080808] border border-red-900/30 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-mono tracking-[0.28em] uppercase text-red-400 mb-1">
                  E — Final Rule
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  READY TO DEPLOY is not permitted until every item below is
                  confirmed. No single item may be skipped.
                </p>
              </div>
            </div>
            <ul className="space-y-1.5 ml-7">
              {[
                "Vercel environment variables set in Production",
                "Supabase migrations 001–008 applied in sequence",
                "client_safe_matter_view and client_safe_timeline_view exist",
                "Wise webhook registered at production URL",
                "Shippo webhook registered at production URL",
                "Role matrix passes in desktop browser (anonymous → redirect confirmed)",
                "Mobile browser smoke test passes",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-red-500/60 flex-shrink-0 mt-1.5" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* F: Final Deployment Order */}
          <div className="bg-[#0D0D0D] border border-[#C6A55A]/20 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E1E1E]">
              <span className="inline-flex p-1.5 rounded bg-[#1A1A1A]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C6A55A]" />
              </span>
              <span className="text-xs font-mono tracking-widest uppercase text-[#8A8A8A]">
                F — Final Deployment Order
              </span>
              <span className="ml-auto text-[8px] font-mono text-[#C6A55A] tracking-widest">
                EXECUTE IN SEQUENCE
              </span>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] text-gray-600 mb-4 font-mono leading-relaxed">
                Complete every step in order. Do not advance to the next step
                until the current step is confirmed. Env var changes do not apply
                to the live deployment until Vercel redeploys.
              </p>
              <ol className="space-y-3">
                {[
                  {
                    step: "1",
                    action: "Vercel → set CRON_SECRET",
                    note: "Project Settings → Environment Variables → Production",
                  },
                  {
                    step: "2",
                    action: "Supabase → run migrations 001–008 in order",
                    note: "SQL Editor → New Query → paste and run each file in sequence",
                  },
                  {
                    step: "3",
                    action: "Supabase → confirm the following exist",
                    note: null,
                    checks: [
                      "webhook_events table",
                      "client_safe_matter_view",
                      "client_safe_timeline_view",
                      "deals.carrier column",
                      "deals.delivery_status column",
                      "deals.delivery_eta column",
                    ],
                  },
                  {
                    step: "4",
                    action: "Vercel → trigger production redeploy",
                    note: "Required — env var changes are not live until the project redeploys",
                  },
                  {
                    step: "5",
                    action: "Re-run 13-route smoke test",
                    note: "Use the route list in Section D above",
                  },
                  {
                    step: "6",
                    action: "Return only failures in structured format",
                    note: null,
                    code: "ROUTE:\nEXPECTED:\nACTUAL:",
                  },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C6A55A]/10 border border-[#C6A55A]/30 flex items-center justify-center text-[9px] font-mono font-bold text-[#C6A55A]">
                      {item.step}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm text-white font-medium">{item.action}</p>
                      {item.note && (
                        <p className="text-xs text-gray-600 mt-0.5">{item.note}</p>
                      )}
                      {"checks" in item && item.checks && (
                        <ul className="mt-2 space-y-1">
                          {item.checks.map((check) => (
                            <li key={check} className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                              <span className="w-1 h-1 rounded-full bg-[#C6A55A]/50 flex-shrink-0" />
                              {check}
                            </li>
                          ))}
                        </ul>
                      )}
                      {"code" in item && item.code && (
                        <pre className="mt-2 text-[10px] font-mono text-gray-500 bg-[#0A0A0A] border border-[#1A1A1A] rounded px-3 py-2 leading-relaxed whitespace-pre">
                          {item.code}
                        </pre>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

        </div>
      </div>

      {/* Final Status Block */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <p className="text-[8px] font-mono tracking-[0.25em] uppercase text-emerald-500/70 mb-1">
            Code Status
          </p>
          <p className="text-sm font-mono font-semibold text-emerald-400">
            Verified / Build Stable
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <p className="text-[8px] font-mono tracking-[0.25em] uppercase text-amber-500/70 mb-1">
            Production Status
          </p>
          <p className="text-sm font-mono font-semibold text-amber-400">
            Environment Pending
          </p>
        </div>
        <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg p-4">
          <p className="text-[8px] font-mono tracking-[0.25em] uppercase text-gray-600 mb-1">
            Final Verdict
          </p>
          <p className="text-[10px] font-mono font-semibold text-white leading-snug">
            READY TO DEPLOY ONLY AFTER EXTERNAL ENV + WEBHOOK + SUPABASE CHECKS PASS
          </p>
        </div>
      </div>
    </div>
  );
}
