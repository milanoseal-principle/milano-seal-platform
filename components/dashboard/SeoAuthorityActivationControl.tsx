"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  SeoActivationAction,
  SeoActivationCandidate,
  SeoAuthorityPlacement,
  SeoAuthorityRelationship,
} from "@/lib/seo/activation/types";

interface Props {
  provisioned: boolean;
  provisioningMessage?: string;
  relationships: SeoAuthorityRelationship[];
  placements: SeoAuthorityPlacement[];
  actions: SeoActivationAction[];
  derivedCandidates: SeoActivationCandidate[];
  pendingLocalizedRoutes: Array<{
    locale: string;
    path: string;
    englishEquivalent: string;
    translationStatus: string;
    indexStatus: string;
  }>;
  verifiedPlacementCount: number;
  stalePlacementCount: number;
}

const RELATIONSHIP_CLASSES = [
  "LAW_FIRM",
  "CITIZENSHIP_PROFESSIONAL",
  "PROFESSIONAL_ADVISOR",
  "CHAMBER_ASSOCIATION",
  "NOTARY_ORGANIZATION",
  "EDITORIAL_PUBLISHER",
  "DIRECTORY",
  "ALLIANCE_PARTNER",
  "OTHER",
] as const;

const PLACEMENT_TYPES = [
  "EDITORIAL_CITATION",
  "PROFESSIONAL_PROFILE",
  "DIRECTORY_LISTING",
  "PARTNER_PAGE",
  "RESOURCE_PAGE",
  "ASSOCIATION_MEMBER_PAGE",
  "REFERRAL_PAGE",
  "OTHER",
] as const;

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function readError(response: Response) {
  const data = await response.json().catch(() => null);
  return data?.error ?? `Request failed (${response.status})`;
}

export function SeoAuthorityActivationControl(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [relationshipId, setRelationshipId] = useState(props.relationships[0]?.id ?? "");
  const selectedRelationship = useMemo(
    () => props.relationships.find((relationship) => relationship.id === relationshipId),
    [props.relationships, relationshipId],
  );

  const queue = props.actions.length > 0
    ? props.actions.map((action) => ({
        id: action.id,
        actionKey: action.action_key,
        targetPage: action.target_page,
        actionType: action.action_type,
        priority: action.priority,
        score: Number(action.score),
        rationale: action.rationale,
        status: action.status,
      }))
    : props.derivedCandidates.slice(0, 30).map((candidate) => ({ ...candidate, id: null, status: "DERIVED" }));

  function run(task: () => Promise<void>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await task();
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Request failed.");
      }
    });
  }

  function syncQueue() {
    run(async () => {
      const response = await fetch("/api/admin/seo/activation/sync", { method: "POST" });
      if (!response.ok) throw new Error(await readError(response));
      setMessage("Activation queue refreshed from governed search, content, and authority signals.");
    });
  }

  function createRelationship(form: FormData) {
    run(async () => {
      const payload = {
        organizationName: String(form.get("organizationName") ?? ""),
        canonicalDomain: String(form.get("canonicalDomain") ?? "") || null,
        relationshipClass: String(form.get("relationshipClass") ?? "PROFESSIONAL_ADVISOR"),
        countrySlug: String(form.get("countrySlug") ?? "") || null,
        targetPage: String(form.get("targetPage") ?? ""),
        status: "PROSPECT",
        notes: String(form.get("notes") ?? "") || null,
      };
      const response = await fetch("/api/admin/seo/authority/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await readError(response));
      setMessage("Professional authority target added to the private pipeline.");
    });
  }

  function advanceRelationship(id: string, status: string) {
    run(async () => {
      const response = await fetch(`/api/admin/seo/authority/relationships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setMessage(`Relationship moved to ${label(status)}.`);
    });
  }

  function createPlacement(form: FormData) {
    run(async () => {
      const status = String(form.get("status") ?? "PENDING");
      const payload = {
        relationshipId: String(form.get("relationshipId") ?? ""),
        targetPage: String(form.get("targetPage") ?? ""),
        sourceUrl: String(form.get("sourceUrl") ?? ""),
        placementType: String(form.get("placementType") ?? "EDITORIAL_CITATION"),
        anchorText: String(form.get("anchorText") ?? "") || null,
        status,
        verificationMethod: status === "VERIFIED" ? "MANUAL_REVIEW" : null,
        evidenceSnapshot: status === "VERIFIED" ? { operatorConfirmedVisible: true } : {},
      };
      const response = await fetch("/api/admin/seo/authority/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await readError(response));
      setMessage(status === "VERIFIED" ? "Placement recorded with manual verification evidence." : "Placement recorded as pending verification.");
    });
  }

  function updateAction(id: string, status: string) {
    run(async () => {
      const response = await fetch(`/api/admin/seo/activation/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setMessage(`Activation action moved to ${label(status)}.`);
    });
  }

  return (
    <div className="mt-10 space-y-10">
      {!props.provisioned && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400">Database provisioning required</p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-100/80">{props.provisioningMessage}</p>
        </section>
      )}

      {(message || error) && (
        <div className={`rounded-xl border p-4 text-sm ${error ? "border-red-500/30 bg-red-950/20 text-red-200" : "border-emerald-500/20 bg-emerald-950/15 text-emerald-200"}`}>
          {error ?? message}
        </div>
      )}

      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500">Authority Activation Queue</p>
            <h2 className="mt-1 text-xl font-semibold">Turn verified demand into governed work</h2>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">Prioritization uses Search Console observations, localization governance, and private authority evidence. Paid Matter revenue remains a separate verified signal and is never falsely attributed to a search query.</p>
          </div>
          <button
            type="button"
            disabled={pending || !props.provisioned}
            onClick={syncQueue}
            className="min-h-11 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 text-xs font-medium uppercase tracking-[0.12em] text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Working…" : "Refresh activation queue"}
          </button>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/70">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-zinc-500">
              <tr><th className="p-3">Score</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Why now</th><th className="p-3">State</th></tr>
            </thead>
            <tbody>
              {queue.map((row) => (
                <tr key={row.actionKey} className="border-t border-white/5 align-top">
                  <td className="p-3"><span className="font-semibold text-amber-300">{row.score}</span><span className="ml-2 text-[10px] text-zinc-600">{row.priority}</span></td>
                  <td className="p-3 text-zinc-200">{label(row.actionType)}</td>
                  <td className="max-w-[240px] break-all p-3 text-zinc-500">{row.targetPage}</td>
                  <td className="max-w-xl p-3 leading-5 text-zinc-400">{row.rationale}</td>
                  <td className="p-3">
                    {row.id ? (
                      <select
                        value={row.status}
                        disabled={pending}
                        onChange={(event) => updateAction(row.id!, event.target.value)}
                        className="rounded-md border border-white/10 bg-black px-2 py-1.5 text-zinc-300"
                      >
                        {['OPEN','IN_PROGRESS','COMPLETED','DISMISSED'].map((status) => <option key={status} value={status}>{label(status)}</option>)}
                      </select>
                    ) : <span className="text-[10px] uppercase tracking-wider text-zinc-600">Derived</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {queue.length === 0 && <p className="p-5 text-sm text-zinc-500">No activation work is currently derived from verified signals.</p>}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          ["Professional targets", props.relationships.length],
          ["Verified placements", props.verifiedPlacementCount],
          ["Stale evidence", props.stalePlacementCount],
          ["Human-review routes", props.pendingLocalizedRoutes.length],
        ].map(([name, value]) => (
          <div key={String(name)} className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">{name}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500">Professional Authority Pipeline</p>
          <h3 className="mt-1 text-lg font-semibold">Add a legitimate authority target</h3>
          <form action={createRelationship} className="mt-5 grid gap-3 sm:grid-cols-2">
            <input required name="organizationName" placeholder="Organization / firm" className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-amber-500/40" />
            <input name="canonicalDomain" placeholder="example.org" className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-amber-500/40" />
            <select name="relationshipClass" defaultValue="LAW_FIRM" className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white">
              {RELATIONSHIP_CLASSES.map((item) => <option key={item} value={item}>{label(item)}</option>)}
            </select>
            <input name="countrySlug" placeholder="country slug (optional)" className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-amber-500/40" />
            <input required name="targetPage" placeholder="/apostille/italy/..." className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-amber-500/40 sm:col-span-2" />
            <textarea name="notes" placeholder="Why this relationship matters / next context" className="min-h-24 rounded-lg border border-white/10 bg-black p-3 text-sm text-white outline-none focus:border-amber-500/40 sm:col-span-2" />
            <button disabled={pending || !props.provisioned} className="min-h-11 rounded-lg bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40 sm:col-span-2">Add authority target</button>
          </form>

          <div className="mt-6 space-y-2">
            {props.relationships.slice(0, 12).map((relationship) => (
              <div key={relationship.id} className="rounded-xl border border-white/5 bg-black/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-sm text-zinc-200">{relationship.organization_name}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">{label(relationship.relationship_class)} · {relationship.target_page}</p></div>
                  <select value={relationship.status} disabled={pending} onChange={(event) => advanceRelationship(relationship.id, event.target.value)} className="rounded-md border border-white/10 bg-black px-2 py-1.5 text-xs text-zinc-300">
                    {['PROSPECT','CONTACTED','ENGAGED','PLACEMENT_PENDING','VERIFIED','LOST','RETIRED'].map((status) => <option key={status} value={status}>{label(status)}</option>)}
                  </select>
                </div>
              </div>
            ))}
            {props.relationships.length === 0 && <p className="text-sm text-zinc-600">No professional authority targets recorded yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500">External Evidence Ledger</p>
          <h3 className="mt-1 text-lg font-semibold">Record a citation or placement</h3>
          <p className="mt-2 text-xs leading-5 text-zinc-500">A VERIFIED state is allowed only with an HTTPS source URL, verification method, reviewer identity, and timestamp. Recording evidence does not imply legal affiliation or paid referral.</p>
          <form action={createPlacement} className="mt-5 grid gap-3 sm:grid-cols-2">
            <select name="relationshipId" value={relationshipId} onChange={(event) => setRelationshipId(event.target.value)} required className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white sm:col-span-2">
              <option value="">Select relationship</option>
              {props.relationships.map((relationship) => <option key={relationship.id} value={relationship.id}>{relationship.organization_name}</option>)}
            </select>
            <input required name="sourceUrl" type="url" placeholder="https://source.example/page" className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-amber-500/40 sm:col-span-2" />
            <input required name="targetPage" defaultValue={selectedRelationship?.target_page ?? ""} key={selectedRelationship?.id ?? "empty"} placeholder="/target-page" className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-amber-500/40 sm:col-span-2" />
            <select name="placementType" defaultValue="EDITORIAL_CITATION" className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white">
              {PLACEMENT_TYPES.map((item) => <option key={item} value={item}>{label(item)}</option>)}
            </select>
            <select name="status" defaultValue="PENDING" className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white"><option value="PENDING">Pending Verification</option><option value="VERIFIED">Verified — I reviewed it</option></select>
            <input name="anchorText" placeholder="Visible citation / anchor text" className="min-h-11 rounded-lg border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-amber-500/40 sm:col-span-2" />
            <button disabled={pending || !props.provisioned || !relationshipId} className="min-h-11 rounded-lg bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40 sm:col-span-2">Record evidence</button>
          </form>

          <div className="mt-6 space-y-2">
            {props.placements.slice(0, 12).map((placement) => (
              <div key={placement.id} className="rounded-xl border border-white/5 bg-black/40 p-3">
                <div className="flex items-center justify-between gap-3"><p className="max-w-[75%] truncate text-xs text-zinc-300">{placement.source_url}</p><span className={placement.status === 'VERIFIED' ? 'text-[10px] uppercase tracking-wider text-emerald-400' : placement.status === 'STALE' ? 'text-[10px] uppercase tracking-wider text-amber-300' : 'text-[10px] uppercase tracking-wider text-zinc-600'}>{placement.status}</span></div>
                <p className="mt-1 text-[10px] text-zinc-600">{label(placement.placement_type)} → {placement.target_page}</p>
              </div>
            ))}
            {props.placements.length === 0 && <p className="text-sm text-zinc-600">No external authority evidence recorded yet.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500">Localization Review Gate</p>
        <h3 className="mt-1 text-lg font-semibold">Routes still blocked from indexing</h3>
        <p className="mt-2 max-w-3xl text-sm text-zinc-500">These routes remain unavailable until complete professionally human-reviewed copy and explicit INDEXABLE approval exist in source control. This queue does not auto-translate or auto-publish them.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {props.pendingLocalizedRoutes.map((route) => (
            <div key={route.path} className="rounded-xl border border-white/5 bg-black/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">{route.locale}</p>
              <p className="mt-2 break-all text-sm text-zinc-200">{route.path}</p>
              <p className="mt-2 text-xs text-zinc-600">English authority: {route.englishEquivalent}</p>
              <p className="mt-3 text-[10px] uppercase tracking-wider text-amber-300">{route.translationStatus} · {route.indexStatus}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
