"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Plus, CheckCircle, X, Lock, Info, ArrowRight } from "lucide-react";
import { INCIDENT_TYPES, INCIDENT_TYPE_MAP, MAKE_IT_RIGHT_TYPES, MAKE_IT_RIGHT_LABELS, type IncidentType } from "@/lib/incidentTypes";

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  client_name: string;
  matter_reference: string;
  discovered_at: string;
  freeze_triggered: boolean;
  make_it_right_triggered: boolean;
  make_it_right_type: string;
  courtesy_adjustment_amount: number;
  client_notified: boolean;
  resolution_note: string;
  resolved_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 border-red-500/40 bg-red-500/5",
  high: "text-orange-400 border-orange-500/40 bg-orange-500/5",
  medium: "text-yellow-400 border-yellow-500/40 bg-yellow-500/5",
  low: "text-[#C6A55A] border-[#C6A55A]/20 bg-[#C6A55A]/5",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  INVESTIGATING: "Investigating",
  REMEDIATION_IN_PROGRESS: "Remediation",
  PENDING_CLIENT: "Pending Client",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  FROZEN: "Frozen",
};

export function ComplianceIncidentCenter({ dealId }: { dealId?: string }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({
    incident_type: "" as IncidentType | "",
    title: "",
    description: "",
    client_name: "",
    matter_reference: "",
    destination_country: "",
    discovered_by: "founder",
    severity: "",
  });

  const [updateForm, setUpdateForm] = useState({
    status: "",
    resolution_note: "",
    make_it_right_triggered: false,
    make_it_right_type: "",
    make_it_right_note: "",
    courtesy_adjustment_amount: 0,
    client_notified: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dealId) params.set("deal_id", dealId);
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/dashboard/incidents?${params}`);
    const json = await res.json();
    setIncidents(json.incidents ?? []);
    setLoading(false);
  }, [dealId, filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function createIncident() {
    if (!form.incident_type || !form.title) return;
    const meta = INCIDENT_TYPE_MAP[form.incident_type];
    await fetch("/api/dashboard/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        deal_id: dealId,
        severity: form.severity || meta.severity,
      }),
    });
    setShowCreate(false);
    setForm({ incident_type: "", title: "", description: "", client_name: "", matter_reference: "", destination_country: "", discovered_by: "founder", severity: "" });
    load();
  }

  async function updateIncident() {
    if (!selected) return;
    await fetch("/api/dashboard/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, ...updateForm, actor: "founder" }),
    });
    setSelected(null);
    load();
  }

  const openCount = incidents.filter(i => !["RESOLVED", "CLOSED"].includes(i.status)).length;
  const criticalCount = incidents.filter(i => i.severity === "critical" && !["RESOLVED", "CLOSED"].includes(i.status)).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="text-white font-semibold text-lg">Compliance Incident Center</h2>
          {openCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-mono">
              {openCount} open
            </span>
          )}
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600/30 text-red-300 text-xs font-mono animate-pulse">
              {criticalCount} critical
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C6A55A] text-[#0A0A0A] text-sm font-semibold rounded-lg hover:bg-[#D4B76A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Open Incident
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "OPEN", "INVESTIGATING", "REMEDIATION_IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
              filterStatus === s
                ? "bg-[#C6A55A]/20 border-[#C6A55A]/50 text-[#C6A55A]"
                : "border-[#2A2A2A] text-[#6A6A6A] hover:border-[#C6A55A]/30"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-[#111111] border border-[#C6A55A]/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase">Open New Incident</p>
            <button onClick={() => setShowCreate(false)} className="text-[#6A6A6A] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Incident Type *</label>
              <select
                value={form.incident_type}
                onChange={(e) => {
                  const t = e.target.value as IncidentType;
                  const meta = INCIDENT_TYPE_MAP[t];
                  setForm(f => ({ ...f, incident_type: t, title: meta?.label ?? "", severity: meta?.severity ?? "" }));
                }}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
              >
                <option value="">Select type…</option>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>{INCIDENT_TYPE_MAP[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
              >
                <option value="">Auto</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
                placeholder="Brief incident title"
              />
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Client Name</label>
              <input
                value={form.client_name}
                onChange={(e) => setForm(f => ({ ...f, client_name: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Matter Reference</label>
              <input
                value={form.matter_reference}
                onChange={(e) => setForm(f => ({ ...f, matter_reference: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Destination Country</label>
              <input
                value={form.destination_country}
                onChange={(e) => setForm(f => ({ ...f, destination_country: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2 resize-none"
            />
          </div>
          {form.incident_type && INCIDENT_TYPE_MAP[form.incident_type as IncidentType]?.triggers_freeze && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs">This incident type will trigger a matter freeze automatically.</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={createIncident}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Open Incident
            </button>
            <button onClick={() => setShowCreate(false)} className="px-5 py-2 border border-[#2A2A2A] text-[#8A8A8A] text-sm rounded-lg hover:border-[#4A4A4A]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Incident List */}
      {loading ? (
        <div className="text-[#4A4A4A] text-sm py-8 text-center">Loading incidents…</div>
      ) : incidents.length === 0 ? (
        <div className="text-[#4A4A4A] text-sm py-8 text-center border border-[#1A1A1A] rounded-xl">
          No compliance incidents on record.
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => {
            const sevClass = SEVERITY_COLORS[incident.severity] ?? SEVERITY_COLORS.medium;
            return (
              <div
                key={incident.id}
                className={`border rounded-xl p-4 cursor-pointer hover:border-[#C6A55A]/30 transition-colors ${sevClass}`}
                onClick={() => {
                  setSelected(incident);
                  setUpdateForm({
                    status: incident.status,
                    resolution_note: incident.resolution_note ?? "",
                    make_it_right_triggered: incident.make_it_right_triggered,
                    make_it_right_type: incident.make_it_right_type ?? "",
                    make_it_right_note: "",
                    courtesy_adjustment_amount: incident.courtesy_adjustment_amount ?? 0,
                    client_notified: incident.client_notified,
                  });
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono tracking-wider uppercase opacity-70">{incident.incident_type.replace(/_/g, " ")}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-mono uppercase">{incident.severity}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-mono">{STATUS_LABELS[incident.status] ?? incident.status}</span>
                      {incident.freeze_triggered && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 text-[10px] font-mono">
                          <Lock className="w-2.5 h-2.5" /> FROZEN
                        </span>
                      )}
                    </div>
                    <p className="text-white text-sm font-medium">{incident.title}</p>
                    {incident.client_name && (
                      <p className="text-xs opacity-60 mt-0.5">{incident.client_name} {incident.matter_reference && `· ${incident.matter_reference}`}</p>
                    )}
                  </div>
                  <div className="text-[10px] opacity-50 whitespace-nowrap">
                    {new Date(incident.discovered_at).toLocaleDateString()}
                  </div>
                </div>
                {incident.make_it_right_triggered && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    Make-It-Right: {MAKE_IT_RIGHT_LABELS[incident.make_it_right_type as keyof typeof MAKE_IT_RIGHT_LABELS] ?? incident.make_it_right_type}
                    {incident.courtesy_adjustment_amount > 0 && ` · $${incident.courtesy_adjustment_amount}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Update Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="bg-[#0E0E0E] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#C6A55A] text-xs font-mono tracking-widest uppercase mb-1">Incident Response</p>
                <h3 className="text-white font-semibold">{selected.title}</h3>
                <p className="text-[#6A6A6A] text-xs mt-0.5">{selected.incident_type.replace(/_/g, " ")} · {selected.severity.toUpperCase()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#6A6A6A] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Remediation Steps */}
            {INCIDENT_TYPE_MAP[selected.incident_type as IncidentType] && (
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-4">
                <p className="text-[#8A8A8A] text-xs font-semibold uppercase tracking-widest mb-2">Remediation Steps</p>
                <ol className="space-y-1.5">
                  {INCIDENT_TYPE_MAP[selected.incident_type as IncidentType].remediation_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#B0B0B0]">
                      <span className="text-[#C6A55A] font-mono flex-shrink-0 mt-0.5">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[#8A8A8A] text-xs mb-1 block">Update Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#8A8A8A] text-xs mb-1 block">Resolution / Action Note</label>
                <textarea
                  value={updateForm.resolution_note}
                  onChange={(e) => setUpdateForm(f => ({ ...f, resolution_note: e.target.value }))}
                  rows={2}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2 resize-none"
                />
              </div>

              {/* Make-It-Right */}
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Make-It-Right</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateForm.make_it_right_triggered}
                      onChange={(e) => setUpdateForm(f => ({ ...f, make_it_right_triggered: e.target.checked }))}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs text-[#8A8A8A]">Activate</span>
                  </label>
                </div>
                {updateForm.make_it_right_triggered && (
                  <>
                    <select
                      value={updateForm.make_it_right_type}
                      onChange={(e) => setUpdateForm(f => ({ ...f, make_it_right_type: e.target.value }))}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
                    >
                      <option value="">Select remedy…</option>
                      {MAKE_IT_RIGHT_TYPES.map((t) => (
                        <option key={t} value={t}>{MAKE_IT_RIGHT_LABELS[t]}</option>
                      ))}
                    </select>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[#8A8A8A] text-xs mb-1 block">Courtesy Adjustment ($)</label>
                        <input
                          type="number"
                          value={updateForm.courtesy_adjustment_amount}
                          onChange={(e) => setUpdateForm(f => ({ ...f, courtesy_adjustment_amount: Number(e.target.value) }))}
                          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[#8A8A8A] text-xs mb-1 block">Make-It-Right Note (internal)</label>
                      <textarea
                        value={updateForm.make_it_right_note}
                        onChange={(e) => setUpdateForm(f => ({ ...f, make_it_right_note: e.target.value }))}
                        rows={2}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2 resize-none"
                        placeholder="Internal note only — not shown to client"
                      />
                    </div>
                  </>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateForm.client_notified}
                  onChange={(e) => setUpdateForm(f => ({ ...f, client_notified: e.target.checked }))}
                  className="accent-[#C6A55A]"
                />
                <span className="text-xs text-[#8A8A8A]">Mark client as notified</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={updateIncident}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C6A55A] text-[#0A0A0A] text-sm font-semibold rounded-lg hover:bg-[#D4B76A] transition-colors"
              >
                Save Update <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => setSelected(null)} className="px-5 py-2.5 border border-[#2A2A2A] text-[#8A8A8A] text-sm rounded-lg hover:border-[#4A4A4A]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
