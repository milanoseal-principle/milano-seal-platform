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
    </div>
  );
}
