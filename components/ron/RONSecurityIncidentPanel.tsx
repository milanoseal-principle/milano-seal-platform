'use client';

import { useEffect, useRef, useState } from 'react';

type Incident = {
  id: string; ron_session_id: string; discovered_at: string; description: string; status: string;
  ron_security_evidence: {
    category: string; containment: string; authority_basis_reference: string; responsible_operator: string; required_authorities: string[];
    notifications: Record<string,{ reference: string; sent_at: string }>;
    remediation_reference?: string; credential_action_reference?: string; closure_reference?: string;
  };
  deadline: { due_at: string; state: string };
};
const authorities = ['FLORIDA_DEPARTMENT_OF_STATE','LAW_ENFORCEMENT'];
const label = (value: string) => value.toLowerCase().replaceAll('_',' ');

export function RONSecurityIncidentPanel() {
  const draftId = useRef<string | null>(null);
  const [incidents,setIncidents] = useState<Incident[]>([]);
  const [selected,setSelected] = useState<Incident | null>(null);
  const [message,setMessage] = useState('');
  const [pending,setPending] = useState(false);
  const [loading,setLoading] = useState(true);
  const [revision,setRevision] = useState(0);
  const [hasMore,setHasMore] = useState(false);
  useEffect(()=>{
    const controller = new AbortController();
    setLoading(true);
    fetch('/api/dashboard/ron/security-incidents',{signal:controller.signal}).then(async response=>{
      if (!response.ok) throw new Error('Incident records are unavailable. Retry retrieval or contact an administrator.');
      const result = await response.json();
      setIncidents(result.data);
      setHasMore(result.has_more === true);
    }).catch(error=>{if (!controller.signal.aborted) setMessage(error.message);})
      .finally(()=>{if (!controller.signal.aborted) setLoading(false);});
    return ()=>controller.abort();
  },[revision]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const notifications: Record<string,{reference:string;sent_at:string}> = {...selected?.ron_security_evidence.notifications};
    for (const authority of authorities) {
      // Preserve the exact immutable stored value, including its original offset.
      if (selected?.ron_security_evidence.notifications[authority]) continue;
      const reference = String(form.get(`${authority}_reference`)??'').trim();
      const sent = String(form.get(`${authority}_sent_at`)??'').trim();
      if (reference || sent) {
        if (!reference || !sent || !Number.isFinite(Date.parse(sent))) {setMessage('Each notification needs both its evidence reference and actual sent time.');return;}
        notifications[authority] = {reference,sent_at:new Date(sent).toISOString()};
      }
    }
    const detected = selected?.discovered_at ?? String(form.get('detected_at'));
    if (!Number.isFinite(Date.parse(detected))) {setMessage('Enter the actual detection time.');return;}
    const evidence = {
      category: selected?.ron_security_evidence.category ?? form.get('category'),
      containment: form.get('containment'), responsible_operator:form.get('responsible_operator'), authority_basis_reference:form.get('authority_basis_reference'),
      required_authorities:authorities.filter(a=>form.get(a)==='on' || selected?.ron_security_evidence.required_authorities.includes(a)),
      notifications,
      ...Object.fromEntries(['remediation_reference','credential_action_reference','closure_reference'].map(key=>[key,String(form.get(key)??'').trim()]).filter(([,value])=>value)),
    };
    setPending(true); setMessage('');
    try {
      const response = await fetch('/api/dashboard/ron/security-incidents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        id:selected?.id??(draftId.current??=crypto.randomUUID()),session_id:selected?.ron_session_id??form.get('session_id'),detected_at:new Date(detected).toISOString(),
        summary:form.get('summary'),status:form.get('status'),evidence,
      })});
      const result = await response.json();
      if (!response.ok) throw new Error(result.next_action??'Review the incident fields and required evidence, then retry.');
      setMessage('Incident and audit evidence recorded. Authority notifications must be performed through the approved external process.');
      draftId.current=null; setSelected(null); setRevision(value=>value+1);
    } catch(error) {setMessage(error instanceof Error?error.message:'Recording failed. Retry after reviewing evidence.');}
    finally {setPending(false);}
  }
  const input = 'mt-1 block min-h-11 w-full rounded border border-white/20 bg-black p-2 text-sm';
  return <section className="mt-8 rounded-xl border border-white/15 p-4 sm:p-6" aria-labelledby="ron-incident-heading">
    <h2 id="ron-incident-heading" className="text-xl font-semibold">Florida RON security compromises</h2>
    <p className="mt-2 text-sm text-white/70">For Florida RON Matters, record compromised credentials, seals, journals or recordings and the review establishing required authorities. Required authority notifications are due within seven days of the original detection time. Evidence references must identify approved private records.</p>
    <p role="status" aria-live="polite" className="my-3 text-sm">{message}</p>
    <button type="button" className="min-h-11 underline" onClick={()=>setRevision(value=>value+1)} disabled={loading}>{loading?'Loading incidents…':'Refresh incidents'}</button>
    {hasMore && <p className="text-sm">Showing the 100 oldest active incidents. Resolve or escalate these first; further active incidents remain in the incident register.</p>}
    <ul className="my-4 space-y-2">{incidents.map(incident=><li key={incident.id} className="rounded border border-white/15 p-3">
      <p>{label(incident.ron_security_evidence.category)} · {label(incident.status)} · {label(incident.deadline.state)}</p>
      <p className="text-sm text-white/70">Authority deadline: {new Date(incident.deadline.due_at).toLocaleString()}</p>
      {!['CLOSED','RESOLVED'].includes(incident.status)&&<button type="button" className="min-h-11 underline" onClick={()=>setSelected(incident)}>Review incident {incident.id.slice(0,8)}</button>}
    </li>)}</ul>
    <form key={selected?.id??`new-${revision}`} onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <h3 className="sm:col-span-2 font-semibold">{selected?'Update incident evidence':'Record a new compromise'}</h3>
      <label className="text-sm">RON session ID<input name="session_id" className={input} required readOnly={!!selected} defaultValue={selected?.ron_session_id}/></label>
      <label className="text-sm">Detected at {selected?'(fixed)':''}<input name="detected_at" className={input} required readOnly={!!selected} type={selected?'text':'datetime-local'} defaultValue={selected?.discovered_at}/></label>
      <label className="text-sm">Affected category<select name="category" className={input} defaultValue={selected?.ron_security_evidence.category} disabled={!!selected}>{['ELECTRONIC_SEAL','ELECTRONIC_SIGNATURE','RON_CREDENTIALS','JOURNAL','RECORDING','PROVIDER_CREDENTIALS'].map(value=><option key={value} value={value}>{label(value)}</option>)}</select></label>
      <label className="text-sm">Responsible operator ID<input name="responsible_operator" className={input} required defaultValue={selected?.ron_security_evidence.responsible_operator}/></label>
      <label className="text-sm sm:col-span-2">Authority requirement review reference<input name="authority_basis_reference" className={input} required defaultValue={selected?.ron_security_evidence.authority_basis_reference}/></label>
      <label className="text-sm sm:col-span-2">Incident description<textarea name="summary" className={input} required minLength={10} maxLength={2000} defaultValue={selected?.description}/></label>
      <label className="text-sm">Incident state<select name="status" className={input} defaultValue={selected?.status??'OPEN'}>{(selected?['OPEN','INVESTIGATING','REMEDIATION_IN_PROGRESS','RESOLVED','CLOSED']:['OPEN']).map(value=><option key={value}>{value}</option>)}</select></label>
      <label className="text-sm">Containment<select name="containment" className={input} defaultValue={selected?.ron_security_evidence.containment}>{['OPEN','CONTAINED','REMEDIATED'].map(value=><option key={value}>{value}</option>)}</select></label>
      {authorities.map(authority=><fieldset key={authority} className="rounded border border-white/15 p-3">
        <legend>{label(authority)}</legend>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name={authority} defaultChecked={selected?.ron_security_evidence.required_authorities.includes(authority)??true} disabled={selected?.ron_security_evidence.required_authorities.includes(authority)}/>Notification required</label>
        <label className="text-sm">Notification evidence reference<input name={`${authority}_reference`} className={input} readOnly={!!selected?.ron_security_evidence.notifications[authority]} defaultValue={selected?.ron_security_evidence.notifications[authority]?.reference}/></label>
        <label className="text-sm">Actual sent time<input name={`${authority}_sent_at`} className={input} type={selected?.ron_security_evidence.notifications[authority]?'text':'datetime-local'} readOnly={!!selected?.ron_security_evidence.notifications[authority]} defaultValue={selected?.ron_security_evidence.notifications[authority]?.sent_at}/></label>
      </fieldset>)}
      {['remediation_reference','credential_action_reference','closure_reference'].map(key=><label key={key} className="text-sm">{label(key)}<input name={key} className={input} defaultValue={selected?.ron_security_evidence[key as 'closure_reference']}/></label>)}
      <div className="flex flex-wrap gap-4 sm:col-span-2"><button disabled={pending} className="min-h-11 rounded bg-[#C6A55A] px-4 font-semibold text-black">{pending?'Recording…':'Record incident evidence'}</button>{selected&&<button type="button" onClick={()=>setSelected(null)} className="min-h-11 underline">Cancel review</button>}</div>
    </form>
  </section>;
}
