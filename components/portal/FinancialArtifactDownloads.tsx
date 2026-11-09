'use client';
import {useState} from 'react';
export function FinancialArtifactDownloads({matterId}:{matterId:string}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function download(kind:string){setBusy(true);setMessage('');try{const response=await fetch('/api/portal/me/invoice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matter_id:matterId,kind})});
  if(!response.ok){const body=await response.json();setMessage(body.next_action??'Your coordinator must review this artifact before it can be issued.');return;}
  const href=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=href;link.download=`milano-${kind.toLowerCase()}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);setMessage('Issued artifact downloaded. Its amount and status reflect the recorded snapshot.');
 }catch{setMessage('The download was not confirmed. Refresh your Matter and retry; the same snapshot will retain its artifact identity.');}finally{setBusy(false);}}
 return <section className="my-5 rounded-xl border border-[#C6A55A]/20 p-4"><h2 className="font-serif text-lg text-[#F6F1E6]">Issued financial records</h2><p className="my-2 text-sm text-white/60">Your approved quote, payment and release evidence determine which records can be issued.</p><div className="flex flex-wrap gap-3">{[['PRO_FORMA','Pro forma'],['INVOICE','Invoice'],['RECEIPT','Payment confirmation'],['PAID_AND_RELEASED','Paid and released']].map(([kind,label])=><button key={kind} type="button" disabled={busy} onClick={()=>void download(kind)} className="min-h-11 rounded-lg border border-[#C6A55A]/40 px-3 py-2 text-sm text-[#C6A55A] disabled:opacity-50">Download {label}</button>)}</div><p role="status" className="mt-3 text-sm text-white/70">{message}</p></section>;
}
