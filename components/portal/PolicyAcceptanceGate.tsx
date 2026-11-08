"use client";

import { useEffect, useState, type ReactNode } from "react";

type Policy = { id:string; policy_type:string; version:string; content_sha256:string; content:string };
const surface = "wise_payment_submission";

export function PolicyAcceptanceGate({ matterId, children }: { matterId:string; children:ReactNode }) {
  const [policies,setPolicies]=useState<Policy[]>([]);
  const [accepted,setAccepted]=useState<string[]>([]);
  const [checked,setChecked]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [revision,setRevision]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  useEffect(() => {
    const controller=new AbortController();
    setLoading(true); setError(""); setChecked([]);
    const read=async(url:string) => {
      const response=await fetch(url,{signal:controller.signal,cache:"no-store"});
      if(!response.ok) throw new Error("Policy evidence is unavailable. Retry before continuing to payment.");
      return response.json();
    };
    Promise.all([
      read(`/api/policy/active?surface=${surface}`),
      read(`/api/portal/me/policy-acceptance?deal_id=${encodeURIComponent(matterId)}`),
    ]).then(async([registry,history]) => {
      const contents=await Promise.all((registry.policies as Policy[]).map((p)=>read(`/api/policy/active/${p.id}`)));
      if(controller.signal.aborted) return;
      setPolicies(contents);
      setAccepted(history.acceptances.map((a:{policy_version_id:string})=>a.policy_version_id));
    }).catch((reason:Error)=>{ if(!controller.signal.aborted) setError(reason.message); })
      .finally(()=>{ if(!controller.signal.aborted) setLoading(false); });
    return()=>controller.abort();
  },[matterId,revision]);

  async function accept() {
    setBusy(true); setError("");
    try {
      for(const policy of policies.filter((p)=>!accepted.includes(p.id))) {
        const response=await fetch("/api/portal/me/policy-acceptance",{
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({deal_id:matterId,policy_version_id:policy.id,content_sha256:policy.content_sha256,surface}),
        });
        if(!response.ok) throw new Error("Acceptance was not confirmed. Refresh the policies and review the current versions before retrying.");
      }
      setRevision((value)=>value+1);
    } catch(reason) {
      setError(reason instanceof Error ? reason.message : "Acceptance was not confirmed. Retry after reviewing the policies.");
    } finally { setBusy(false); }
  }

  if(loading) return <p role="status" className="p-4 text-sm">Checking required policy versions…</p>;
  if(error) return <section className="rounded border border-amber-300/30 p-4"><p role="alert">{error}</p><button type="button" className="min-h-11 underline" onClick={()=>setRevision((v)=>v+1)}>Refresh policies</button></section>;
  const missing=policies.filter((p)=>!accepted.includes(p.id));
  if(missing.length===0) return <>{children}</>;

  return <section aria-labelledby="policy-review-heading" className="space-y-4 rounded-xl border border-white/20 p-4 text-white">
    <h2 id="policy-review-heading" className="text-xl">Review the policies for this Matter</h2>
    <p className="text-sm text-white/70">Only the published versions below are required for this action. Acceptance is recorded against this Matter and exact content.</p>
    {missing.map((policy)=><fieldset key={policy.id} className="min-w-0 rounded border border-white/15 p-3">
      <legend className="px-1">{policy.policy_type.replaceAll("_"," ")} · {policy.version}</legend>
      <div tabIndex={0} role="region" aria-label={`${policy.policy_type} version ${policy.version} content`} className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-2 text-sm leading-6 focus-visible:outline">{policy.content}</div>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={checked.includes(policy.id)} onChange={(event)=>setChecked((values)=>event.target.checked?[...values,policy.id]:values.filter((id)=>id!==policy.id))}/>
        I have reviewed and accept this exact version.
      </label>
    </fieldset>)}
    <button type="button" className="min-h-12 rounded bg-[#C6A55A] px-4 text-black disabled:opacity-50" disabled={busy||missing.some((p)=>!checked.includes(p.id))} onClick={accept}>
      {busy?"Recording acceptance…":"Record acceptance and continue"}
    </button>
  </section>;
}
