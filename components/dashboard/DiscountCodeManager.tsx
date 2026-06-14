"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, X, CheckCircle, Copy, Trash2 } from "lucide-react";
import { generateCourtesyCode } from "@/lib/discountCodes";

interface DiscountCode {
  id: string;
  code: string;
  label: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  notes: string | null;
  single_use: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  percent: "Percent Off",
  fixed: "Fixed Amount",
  waive_service_fee: "Waive Service Fee",
  courtesy: "Courtesy Credit",
};

export function DiscountCodeManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState("");

  const [form, setForm] = useState({
    label: "",
    discount_type: "courtesy",
    discount_value: 0,
    max_uses: "",
    valid_until: "",
    notes: "",
    single_use: false,
    custom_code: "",
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/dashboard/discounts");
    const json = await res.json();
    setCodes(json.codes ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.label || !form.discount_type) return;
    await fetch("/api/dashboard/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ms-role": "founder" },
      body: JSON.stringify({
        ...form,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_until: form.valid_until || null,
        custom_code: form.custom_code || undefined,
      }),
    });
    setShowCreate(false);
    setForm({ label: "", discount_type: "courtesy", discount_value: 0, max_uses: "", valid_until: "", notes: "", single_use: false, custom_code: "" });
    load();
  }

  async function deactivate(id: string) {
    await fetch("/api/dashboard/discounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-ms-role": "founder" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  }

  const activeCount = codes.filter(c => c.active).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5 text-[#C6A55A]" />
          <h2 className="text-white font-semibold text-lg">Discount &amp; Courtesy Codes</h2>
          <span className="px-2 py-0.5 rounded-full bg-[#C6A55A]/10 text-[#C6A55A] text-xs font-mono">
            {activeCount} active
          </span>
        </div>
        <button
          onClick={() => { setForm(f => ({ ...f, custom_code: generateCourtesyCode() })); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#C6A55A] text-[#0A0A0A] text-sm font-semibold rounded-lg hover:bg-[#D4B76A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Code
        </button>
      </div>

      <div className="bg-[#0A0A0A] border border-[#C6A55A]/10 rounded-xl px-4 py-3">
        <p className="text-[#6A6A6A] text-xs">
          <span className="text-[#C6A55A] font-semibold">Founder-controlled only.</span>{" "}
          Discount and courtesy codes can only be created, modified, or deactivated by the account founder.
          VA and operator users cannot access this panel.
        </p>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-[#111111] border border-[#C6A55A]/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase">New Code</p>
            <button onClick={() => setShowCreate(false)} className="text-[#6A6A6A] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Code</label>
              <div className="flex gap-2">
                <input
                  value={form.custom_code}
                  onChange={(e) => setForm(f => ({ ...f, custom_code: e.target.value.toUpperCase() }))}
                  className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2 font-mono"
                />
                <button
                  onClick={() => setForm(f => ({ ...f, custom_code: generateCourtesyCode() }))}
                  className="px-3 py-2 border border-[#2A2A2A] text-[#8A8A8A] text-xs rounded-lg hover:border-[#C6A55A]/30"
                >
                  Generate
                </button>
              </div>
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Label / Description *</label>
              <input
                value={form.label}
                onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
                placeholder="e.g. Courtesy — Re-execution"
              />
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm(f => ({ ...f, discount_type: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">
                Value {form.discount_type === "percent" ? "(%)" : "($)"}
              </label>
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Max Uses (blank = unlimited)</label>
              <input
                value={form.max_uses}
                onChange={(e) => setForm(f => ({ ...f, max_uses: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="text-[#8A8A8A] text-xs mb-1 block">Valid Until</label>
              <input
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-[#8A8A8A] text-xs mb-1 block">Internal Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.single_use}
              onChange={(e) => setForm(f => ({ ...f, single_use: e.target.checked }))}
              className="accent-[#C6A55A]"
            />
            <span className="text-xs text-[#8A8A8A]">Single-use only</span>
          </label>
          <div className="flex gap-3">
            <button onClick={create} className="px-5 py-2 bg-[#C6A55A] text-[#0A0A0A] text-sm font-semibold rounded-lg hover:bg-[#D4B76A]">
              Create Code
            </button>
            <button onClick={() => setShowCreate(false)} className="px-5 py-2 border border-[#2A2A2A] text-[#8A8A8A] text-sm rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Code List */}
      {loading ? (
        <div className="text-[#4A4A4A] text-sm py-6 text-center">Loading codes…</div>
      ) : codes.length === 0 ? (
        <div className="text-[#4A4A4A] text-sm py-8 text-center border border-[#1A1A1A] rounded-xl">
          No discount codes created yet.
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["Code", "Label", "Type", "Value", "Uses", "Expires", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#6A6A6A] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-b border-[#1A1A1A] hover:bg-[#0D0D0D]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#C6A55A] text-xs">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="text-[#4A4A4A] hover:text-[#C6A55A]">
                        {copied === code.code ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#B0B0B0] max-w-[160px] truncate">{code.label}</td>
                  <td className="px-4 py-3 text-[#6A6A6A] text-xs">{TYPE_LABELS[code.discount_type] ?? code.discount_type}</td>
                  <td className="px-4 py-3 text-[#B0B0B0]">
                    {code.discount_type === "percent" ? `${code.discount_value}%` : `$${code.discount_value}`}
                  </td>
                  <td className="px-4 py-3 text-[#6A6A6A] text-xs">
                    {code.uses_count}{code.max_uses ? `/${code.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-[#6A6A6A] text-xs">
                    {code.valid_until ? new Date(code.valid_until).toLocaleDateString() : "No expiry"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      code.active ? "bg-emerald-500/10 text-emerald-400" : "bg-[#2A2A2A] text-[#6A6A6A]"
                    }`}>
                      {code.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {code.active && (
                      <button
                        onClick={() => deactivate(code.id)}
                        className="text-[#4A4A4A] hover:text-red-400 transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
