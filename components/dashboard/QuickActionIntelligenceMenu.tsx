"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FilePlus2, FileText, CreditCard, RefreshCw, DollarSign,
  Calendar, CheckSquare, Video, Star, Package,
  Archive, Upload, BookOpen, Award, Unlock,
  Globe, Map, ShieldCheck, Network, Users, Search,
  Brain, Database, Layers, ClipboardList, Radio,
  BarChart2, UserCheck, Briefcase, Settings, Activity, X, Shield,
  MapPin,
} from "lucide-react";

interface ActionItem {
  label: string;
  icon: React.ElementType;
  route: string;
  badge?: "action" | "blocked" | "review" | "ready" | "warning";
  badgeCount?: number;
}

interface Group {
  id: string;
  label: string;
  actions: ActionItem[];
}

interface Summary {
  actionRequiredCount: number;
  blockedCount: number;
  reviewRequiredCount: number;
  readyCount: number;
  deliveredNotReleasedCount: number;
  vaTaskCount: number;
  overdueVaTaskCount: number;
  no_data: boolean;
}

const ROUTE_MAP: Record<string, { icon: React.ElementType; route: string }> = {
  "Matter Registry":           { icon: Archive,      route: "/dashboard/deals" },
  "Create Matter":             { icon: FilePlus2,    route: "/dashboard/intake" },
  "Review Active Matter":      { icon: Search,       route: "/dashboard/pipeline" },
  "Intake Review":             { icon: ClipboardList,route: "/dashboard/intake" },
  "Matter Pipeline":           { icon: Layers,       route: "/dashboard/pipeline" },
  "Payment Gate":              { icon: CreditCard,   route: "/dashboard/admin/payments" },
  "Invoice Studio":            { icon: FileText,     route: "/dashboard/invoices" },
  "Wise Reconciliation":       { icon: RefreshCw,    route: "/dashboard/admin/reconciliation" },
  "Open Balances":             { icon: DollarSign,   route: "/dashboard/admin/payments" },
  "Confirmed Payments":        { icon: CheckSquare,  route: "/dashboard/admin/payments" },
  "Schedule Execution":        { icon: Calendar,     route: "/dashboard/compliance" },
  "Execution Checklist":       { icon: CheckSquare,  route: "/dashboard/compliance" },
  "Signing Room":              { icon: Video,        route: "/dashboard/compliance" },
  "Apostille Queue":           { icon: Star,         route: "/dashboard/apostille" },
  "Release Desk":              { icon: Unlock,       route: "/dashboard/releases" },
  "Custody Rail":              { icon: Package,      route: "/dashboard/courier" },
  "Validate Address":          { icon: MapPin,       route: "/dashboard/courier" },
  "Preview Rates":             { icon: BarChart2,    route: "/dashboard/courier" },
  "Purchase Label":            { icon: Package,      route: "/dashboard/courier" },
  "Delivered Not Released":    { icon: Activity,     route: "/dashboard/releases" },
  "The Vault":                 { icon: Archive,      route: "/dashboard/docs" },
  "Upload Documents":          { icon: Upload,       route: "/dashboard/docs" },
  "Review Documents":          { icon: FileText,     route: "/dashboard/docs" },
  "Certificate Library":       { icon: Award,        route: "/dashboard/docs" },
  "Release Certificate":       { icon: Unlock,       route: "/dashboard/releases" },
  "Global Document Intelligence": { icon: Globe,     route: "/dashboard/intelligence/compliance" },
  "Atlas":                     { icon: Map,          route: "/dashboard/atlas" },
  "Compliance Matrix":         { icon: ShieldCheck,  route: "/dashboard/compliance" },
  "Authority Graph":           { icon: Network,      route: "/dashboard/authorities" },
  "Receiving Authority Review":{ icon: UserCheck,    route: "/dashboard/authorities" },
  "Execution DNA":             { icon: Brain,        route: "/dashboard/intelligence/autopilot" },
  "Institutional Memory":      { icon: Database,     route: "/dashboard/memory" },
  "Truth Engine":              { icon: Radio,        route: "/dashboard/truth" },
  "Alliance Desk":             { icon: Briefcase,    route: "/dashboard/alliance" },
  "Referral Ledger":           { icon: BookOpen,     route: "/dashboard/referral" },
  "Partner Registry":          { icon: Users,        route: "/dashboard/alliance" },
  "Revenue Desk":              { icon: DollarSign,   route: "/dashboard/revenue" },
  "Relationship Graph":        { icon: Network,      route: "/dashboard/relationships" },
  "Operations Desk":           { icon: Settings,     route: "/dashboard/admin" },
  "VA Task Queue":             { icon: ClipboardList,route: "/dashboard/va" },
  "Operational Ledger":        { icon: BookOpen,     route: "/dashboard/terminal" },
  "Launch Control":            { icon: Radio,        route: "/dashboard/admin" },
  "Control Room":              { icon: Activity,     route: "/dashboard/admin" },
  "Admin Validator":           { icon: ShieldCheck,  route: "/dashboard/admin" },
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function QuickActionIntelligenceMenu({
  isOpen,
  onClose,
  matterId,
}: {
  isOpen: boolean;
  onClose: () => void;
  matterId?: string;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/dashboard/quick-actions")
      .then(r => r.json())
      .then(data => {
        setSummary(data.summary ?? null);
        setGroups(
          (data.groups ?? []).map((g: { id: string; label: string; actions: string[] }) => ({
            ...g,
            actions: g.actions.map((label: string) => {
              const meta = ROUTE_MAP[label] ?? { icon: Activity, route: "/dashboard" };
              return { label, ...meta };
            }),
          }))
        );
      })
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [isOpen]);

  function buildRoute(action: ActionItem): string {
    if (matterId) return `${action.route}?matter_id=${matterId}`;
    return action.route;
  }

  const badgeColor = (b?: string) => {
    if (b === "action") return "#ef4444";
    if (b === "blocked") return "#f59e0b";
    if (b === "review") return "#D4AF37";
    if (b === "ready") return "#22c55e";
    if (b === "warning") return "#f97316";
    return "transparent";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.42, ease: EASE }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
            style={{ background: "rgba(6,4,2,0.98)", borderLeft: "1px solid rgba(212,175,55,0.14)", boxShadow: "-20px 0 60px rgba(0,0,0,0.7)" }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-5 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.04) 60%, transparent 100%)", borderBottom: "1px solid rgba(212,175,55,0.12)" }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)" }} />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center rounded flex-shrink-0"
                  style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.22)" }}>
                  <Shield className="w-4 h-4" style={{ color: "#D4AF37" }} />
                </div>
                <div>
                  <p className="font-mono text-[8.5px] tracking-[0.32em] uppercase" style={{ color: "rgba(212,175,55,0.55)" }}>
                    {matterId ? `Matter · ${matterId.slice(0, 8).toUpperCase()}` : "Internal Management Layer"}
                  </p>
                  <h2 className="font-serif text-base text-white tracking-wide leading-tight mt-0.5">Quick Actions</h2>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary bar */}
            {summary && !summary.no_data && (
              <div className="flex gap-2 px-4 py-2 flex-shrink-0 flex-wrap" style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                {summary.actionRequiredCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                    {summary.actionRequiredCount} ACTION
                  </span>
                )}
                {summary.blockedCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                    {summary.blockedCount} BLOCKED
                  </span>
                )}
                {summary.reviewRequiredCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.3)" }}>
                    {summary.reviewRequiredCount} REVIEW
                  </span>
                )}
                {summary.deliveredNotReleasedCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}>
                    {summary.deliveredNotReleasedCount} NOT RELEASED
                  </span>
                )}
                {summary.overdueVaTaskCount > 0 && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {summary.overdueVaTaskCount} VA OVERDUE
                  </span>
                )}
              </div>
            )}

            {/* Action list */}
            <div className="flex-1 overflow-y-auto px-4 pb-5 pt-3" style={{ scrollbarWidth: "none" }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.4)" }}>Loading…</span>
                </div>
              ) : (
                groups.map(({ id, label, actions }) => (
                  <div key={id} className="mb-4">
                    <span className="font-mono text-[7.5px] tracking-[0.3em] uppercase px-1 pb-1 block" style={{ color: "rgba(212,175,55,0.3)" }}>{label}</span>
                    <div className="space-y-1">
                      {actions.map((action, i) => {
                        const Icon = action.icon;
                        return (
                          <motion.button
                            key={action.label}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025, ease: EASE, duration: 0.28 }}
                            onClick={() => { router.push(buildRoute(action)); onClose(); }}
                            whileHover={{ y: -1 }}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded text-left"
                            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.1)" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.06)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.1)"; }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
                                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                                <Icon className="w-3.5 h-3.5" style={{ color: "#D4AF37" }} />
                              </span>
                              <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.78)" }}>
                                {action.label}
                              </span>
                            </div>
                            <span className="font-mono text-[8px] flex-shrink-0" style={{ color: matterId ? "rgba(198,165,90,0.7)" : "rgba(212,175,55,0.45)" }}>
                              {matterId ? "→ MATTER" : "→"}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}>
              <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-center" style={{ color: "rgba(212,175,55,0.25)" }}>
                The Milano Seal™ · Operator Layer
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
