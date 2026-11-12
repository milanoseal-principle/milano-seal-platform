"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BindingAccount, BindingProfile } from "@/lib/alliance/accountBinding";

const field: React.CSSProperties = { width: "100%", padding: "8px 10px", background: "#0a0a0a", border: "1px solid rgba(198,166,91,0.2)", borderRadius: 3, color: "#F6F1E6", fontSize: 13 };
const button: React.CSSProperties = { padding: "8px 14px", minHeight: 40, border: "1px solid rgba(212,175,55,0.35)", borderRadius: 3, color: "#d4af37", background: "rgba(212,175,55,0.06)", fontSize: 12 };
const label: React.CSSProperties = { display: "block", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 5 };

const profileLabel = (p: { full_name: string | null; firm_name: string | null }) => [p.full_name, p.firm_name].filter(Boolean).join(" · ") || "Unnamed profile";

function AccountRow({ account, profiles }: { account: BindingAccount; profiles: BindingProfile[] }) {
  const router = useRouter();
  const [profileId, setProfileId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const blocked = !account.has_user || account.duplicate_user;
  const available = profiles.filter((p) => !p.bound);

  async function send(path: string, body: object, done: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/operators/accounts/${account.id}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setMessage({ kind: "error", text: data.message ?? "The change was not saved." });
      } else {
        setMessage({ kind: "ok", text: done });
        setReason("");
        setProfileId("");
        router.refresh();
      }
    } catch {
      setMessage({ kind: "error", text: "The change was not saved. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-sm p-4" style={{ border: "1px solid rgba(198,166,91,0.14)", background: "#080808" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm" style={{ color: "#F6F1E6" }}>{account.full_name ?? account.email}</p>
          <p className="text-xs" style={{ color: "#A8A29A" }}>{account.email} · {account.role}{account.is_active ? "" : " · inactive"}</p>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-[0.12em]" style={{ color: account.profile ? "rgba(34,197,94,0.8)" : "#d4af37" }}>
          {account.profile ? "Bound" : "Not bound"}
        </span>
      </div>

      {!account.has_user && <p role="alert" className="mt-3 text-xs" style={{ color: "rgba(255,140,140,0.9)" }}>This account has no sign-in user, so it cannot be bound.</p>}
      {account.duplicate_user && <p role="alert" className="mt-3 text-xs" style={{ color: "rgba(255,140,140,0.9)" }}>This sign-in user is linked to more than one account. Resolve the duplicate before binding.</p>}

      {account.profile ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <span style={label}>Bound profile</span>
            <p className="text-sm" style={{ color: "#F6F1E6" }}>{profileLabel(account.profile)}</p>
            <p className="text-xs" style={{ color: "#A8A29A" }}>Onboarding: {account.profile.onboarding_status ?? "unknown"}</p>
          </div>
          <div>
            <span style={label}>Referral code</span>
            <p className="font-mono text-sm" style={{ color: "#F6F1E6" }}>{account.referral_code ?? "None issued"}</p>
          </div>
          <div className="sm:col-span-2">
            <label style={label} htmlFor={`reason-${account.id}`}>Reason (required to unbind or issue a new code)</label>
            <input id={`reason-${account.id}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} style={field} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy || !reason.trim()} style={{ ...button, opacity: busy || !reason.trim() ? 0.5 : 1 }}
                onClick={() => send("referral-code", { reason }, "New referral code issued. The previous code no longer resolves; existing attribution is unchanged.")}>
                Issue new referral code
              </button>
              <button type="button" disabled={busy || !reason.trim()} style={{ ...button, opacity: busy || !reason.trim() ? 0.5 : 1 }}
                onClick={() => send("binding", { profile_id: null, reason }, "Account unbound. The partner is no longer routing-eligible.")}>
                Unbind profile
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <label style={label} htmlFor={`profile-${account.id}`}>Operator profile</label>
          <select id={`profile-${account.id}`} value={profileId} onChange={(e) => setProfileId(e.target.value)} disabled={blocked} style={field}>
            <option value="">{available.length ? "Select a profile…" : "No unbound profiles available"}</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>{profileLabel(p)}{p.state ? ` · ${p.state}` : ""}{p.email ? ` · ${p.email}` : ""}</option>
            ))}
          </select>
          <p className="mt-2 text-xs" style={{ color: "#A8A29A" }}>Choose the profile you have verified belongs to this person. Profiles are never matched to accounts automatically.</p>
          <button type="button" disabled={busy || blocked || !profileId} style={{ ...button, marginTop: 10, opacity: busy || blocked || !profileId ? 0.5 : 1 }}
            onClick={() => send("binding", { profile_id: profileId }, "Account bound. A referral code was issued if the account had none.")}>
            Bind profile
          </button>
        </div>
      )}

      {message && <p role={message.kind === "error" ? "alert" : "status"} className="mt-3 text-xs" style={{ color: message.kind === "error" ? "rgba(255,140,140,0.9)" : "rgba(34,197,94,0.85)" }}>{message.text}</p>}
    </li>
  );
}

export function AccountBindingPanel({ accounts, profiles }: { accounts: BindingAccount[]; profiles: BindingProfile[] }) {
  if (accounts.length === 0) {
    return <p className="text-sm" style={{ color: "#A8A29A" }}>No Alliance accounts exist yet. Accounts appear here once a partner has a sign-in account with an Alliance role.</p>;
  }
  return (
    <ul className="space-y-3">
      {accounts.map((account) => <AccountRow key={account.id} account={account} profiles={profiles} />)}
    </ul>
  );
}
