"use client";

/**
 * RoleIntegrationCommand — one shared, permission-scoped command surface rendered
 * by each role's route (Founder/Operator/Alliance/VA). It shows normalized
 * integration health, the role's permitted capabilities (from the canonical
 * matrix), and honest empty states (no fabricated matters/tasks). Reads only
 * normalized state — no provider payloads, no protected-gate actions.
 */

import { IntegrationHealthGrid } from "@/components/integrations/health/IntegrationHealthGrid";
import { allIntegrationHealth, listMatterIntegrationSummaries } from "@/lib/integration-command/integrationReadModel";
import { capabilitiesFor, type WorkspaceRole } from "@/lib/integration-command/rolePermissions";

const ROLE_TITLE: Record<WorkspaceRole, string> = {
  founder: "Founder Command · Integrations",
  admin: "Admin Command · Integrations",
  operator: "Operator Command · Integrations",
  alliance_member: "Alliance Execution Command",
  virtual_assistant: "Virtual Assistant Command",
};

const ROLE_BLURB: Record<WorkspaceRole, string> = {
  founder: "Strategic oversight of payment, RON, and courier health across all matters.",
  admin: "Administrative oversight of integration state.",
  operator: "Primary coordination hub — payment readiness, RON readiness, courier readiness.",
  alliance_member: "Assigned matter scope only — execution instructions and permitted evidence.",
  virtual_assistant: "Assigned support tasks — reminders, confirmations, tracking, coordination.",
};

export function RoleIntegrationCommand({ role }: { role: WorkspaceRole }) {
  const health = allIntegrationHealth();
  const matters = listMatterIntegrationSummaries();
  const caps = capabilitiesFor(role);
  const showHealth = role === "founder" || role === "admin" || role === "operator";

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">{ROLE_TITLE[role]}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-white/50">{ROLE_BLURB[role]}</p>
      </div>

      {showHealth && (
        <section>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Integration health</p>
          <IntegrationHealthGrid records={health} />
        </section>
      )}

      <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
          {role === "alliance_member" ? "Assigned matters" : role === "virtual_assistant" ? "Assigned support tasks" : "Matter execution board"}
        </p>
        {matters.length === 0 ? (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-6 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
              {role === "alliance_member" ? "No assignments offered yet" : role === "virtual_assistant" ? "No support tasks assigned yet" : "No matters with integration activity yet"}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/25">
              Populates from real matters once payments, RON sessions, and shipments are wired live
            </p>
          </div>
        ) : null}
      </section>

      <section>
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Your permitted actions</p>
        <div className="flex flex-wrap gap-1.5">
          {caps.map((c) => (
            <span key={c} className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/55">
              {c.replace(/_/g, " ")}
            </span>
          ))}
        </div>
        {(role === "virtual_assistant" || role === "alliance_member") && (
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#E0876E]/70">
            Cannot confirm payment · unlock scheduling · authorize release · mutate custody · mark RON complete
          </p>
        )}
      </section>
    </div>
  );
}
