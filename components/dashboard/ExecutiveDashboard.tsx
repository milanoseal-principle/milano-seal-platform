"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface MonthPoint { month: string; count: number; revenue: number; }
interface CountryRevenue { country: string; revenue: number; }
interface SourceRevenue { source_type: string; count: number; }

interface ExecData {
  cash_collected: number;
  pipeline_value: number;
  open_matters: number;
  revenue_by_country: CountryRevenue[];
  revenue_by_source: SourceRevenue[];
  monthly_trend: MonthPoint[];
  authority_verification_pct: number;
  total_authorities: number;
  verified_authorities: number;
}

type LoadState = "loading" | "ready" | "error";

const COMMAND_LINKS = [
  {
    label: "Now",
    detail: "Open governed execution work and blockers.",
    href: "/today",
  },
  {
    label: "Next",
    detail: "Review scheduling and downstream execution readiness.",
    href: "/dashboard/scheduling-readiness",
  },
  {
    label: "Intelligence",
    detail: "Inspect corridor, economics and supporting evidence.",
    href: "/dashboard/corridors",
  },
] as const;

function normalizeData(value: unknown): ExecData | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<ExecData>;

  const numberOrZero = (candidate: unknown) =>
    typeof candidate === "number" && Number.isFinite(candidate) ? candidate : 0;

  return {
    cash_collected: numberOrZero(row.cash_collected),
    pipeline_value: numberOrZero(row.pipeline_value),
    open_matters: numberOrZero(row.open_matters),
    revenue_by_country: Array.isArray(row.revenue_by_country) ? row.revenue_by_country : [],
    revenue_by_source: Array.isArray(row.revenue_by_source) ? row.revenue_by_source : [],
    monthly_trend: Array.isArray(row.monthly_trend) ? row.monthly_trend : [],
    authority_verification_pct: numberOrZero(row.authority_verification_pct),
    total_authorities: numberOrZero(row.total_authorities),
    verified_authorities: numberOrZero(row.verified_authorities),
  };
}

function Sparkline({ data }: { data: MonthPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-white/[0.07] bg-white/[0.015] px-4 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-white/28">
        No verified monthly trend available
      </div>
    );
  }

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const width = 320;
  const height = 72;
  const padding = 8;
  const points = data.map((d, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((d.revenue / maxRev) * (height - padding * 2));
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label="Six month verified revenue trend"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#C6A55A"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {data.map((d, index) => {
        const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
        const y = height - padding - ((d.revenue / maxRev) * (height - padding * 2));
        return <circle key={`${d.month}-${index}`} cx={x} cy={y} r={2.5} fill="#C6A55A" />;
      })}
    </svg>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-black/30 p-5 sm:p-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/55">{label}</p>
      <p className="mt-3 break-words font-mono text-2xl font-semibold text-[#DCC47F] sm:text-3xl">{value}</p>
      {sub ? <p className="mt-2 text-[11px] leading-5 text-white/32">{sub}</p> : null}
    </article>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.07] bg-white/[0.012] px-4 py-7 text-center text-[11px] leading-5 text-white/30">
      {children}
    </div>
  );
}

export function ExecutiveDashboard() {
  const [data, setData] = useState<ExecData | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadExecutiveData() {
      try {
        const response = await fetch("/api/dashboard/executive", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Executive intelligence request failed: ${response.status}`);
        const normalized = normalizeData(await response.json());
        if (!normalized) throw new Error("Executive intelligence payload was not usable");
        setData(normalized);
        setState("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Executive dashboard load failed", error);
        setState("error");
      }
    }

    void loadExecutiveData();
    return () => controller.abort();
  }, []);

  return (
    <section className="bg-[#050507] px-4 py-8 text-white/75 sm:px-6 lg:px-8" aria-labelledby="executive-command-heading">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 border-b border-white/[0.06] pb-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-[#C6A55A]/55">The Milano Seal™</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 id="executive-command-heading" className="font-serif text-3xl font-light text-white/92 sm:text-4xl">
                Global Execution Command
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/36">
                Verified financial and operational intelligence around the canonical Matter → Execution → Corridor spine.
              </p>
            </div>
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/24">Operator access · production evidence only</p>
          </div>
        </header>

        <nav className="mb-7 grid gap-3 md:grid-cols-3" aria-label="Executive command priorities">
          {COMMAND_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4 transition duration-150 hover:border-[#C6A55A]/25 hover:bg-[#C6A55A]/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A55A]/60"
            >
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A55A]/58">{item.label}</p>
                <p className="mt-2 text-[12px] leading-5 text-white/38">{item.detail}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#C6A55A]/48 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        {state === "loading" ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-white/[0.06] bg-black/25" role="status" aria-live="polite">
            <Loader2 className="mr-3 h-4 w-4 animate-spin text-[#C6A55A] motion-reduce:animate-none" aria-hidden="true" />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/34">Loading verified executive intelligence</span>
          </div>
        ) : null}

        {state === "error" ? (
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.025] p-5 sm:p-6" role="alert">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/70" aria-hidden="true" />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-100/65">Intelligence unavailable</p>
                <p className="mt-2 max-w-2xl text-[12px] leading-5 text-white/40">
                  Executive metrics could not be verified from the production read model. No fallback numbers are being shown. Matter and execution controls remain available through the operating spine above.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {state === "ready" && data ? (
          <div aria-live="polite">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Stat label="Cash Collected" value={`$${data.cash_collected.toLocaleString()}`} sub="Verified paid revenue returned by the executive read model." />
              <Stat label="Pipeline Value" value={`$${data.pipeline_value.toLocaleString()}`} sub="Open Matter value; not represented as collected revenue." />
              <Stat label="Open Matters" value={String(data.open_matters)} sub="Canonical Matters not completed or closed." />
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/30 p-5 sm:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/55">Revenue by destination · Top 5</p>
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/22">Verified financial read model</span>
              </div>
              {data.revenue_by_country.length ? (
                <div className="space-y-3">
                  {data.revenue_by_country.map((row) => {
                    const max = data.revenue_by_country[0]?.revenue || 0;
                    const percent = max > 0 ? Math.max(0, Math.min(100, (row.revenue / max) * 100)) : 0;
                    return (
                      <div key={row.country} className="grid gap-2 sm:grid-cols-[minmax(100px,140px)_1fr_auto] sm:items-center sm:gap-4">
                        <span className="truncate text-[12px] text-white/68">{row.country}</span>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]" aria-hidden="true">
                          <div className="h-full rounded-full bg-[#C6A55A]" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-[#DCC47F]">${row.revenue.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyPanel>No verified destination revenue is available for this view.</EmptyPanel>
              )}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-white/[0.07] bg-black/30 p-5 sm:p-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/55">Monthly trend · 6 months</p>
                <div className="mt-5"><Sparkline data={data.monthly_trend} /></div>
                {data.monthly_trend.length ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {data.monthly_trend.map((month) => (
                      <div key={month.month} className="text-center font-mono text-[8px] text-white/28">
                        {month.month.slice(5)}<br /><span className="text-white/48">{month.count}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>

              <article className="rounded-2xl border border-white/[0.07] bg-black/30 p-5 sm:p-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/55">Authority evidence coverage</p>
                {data.total_authorities > 0 ? (
                  <>
                    <div className="mt-5 flex items-end gap-3">
                      <span className="font-mono text-3xl font-semibold text-[#DCC47F]">{data.authority_verification_pct}%</span>
                      <CheckCircle2 className="mb-1 h-4 w-4 text-[#C6A55A]/55" aria-hidden="true" />
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full bg-[#C6A55A]" style={{ width: `${Math.max(0, Math.min(100, data.authority_verification_pct))}%` }} />
                    </div>
                    <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white/28">
                      {data.verified_authorities} of {data.total_authorities} authority records verified
                    </p>
                  </>
                ) : (
                  <div className="mt-5"><EmptyPanel>No authority records are available for percentage reporting. A synthetic 0% score is not shown.</EmptyPanel></div>
                )}
              </article>
            </div>

            <article className="mt-4 rounded-2xl border border-white/[0.07] bg-black/30 p-5 sm:p-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/55">Referral attribution</p>
              {data.revenue_by_source.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.revenue_by_source.map((source) => (
                    <div key={source.source_type} className="min-w-28 rounded-xl border border-white/[0.06] bg-white/[0.018] px-4 py-3">
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">{source.source_type}</p>
                      <p className="mt-2 font-mono text-lg font-semibold text-white/78">{source.count}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4"><EmptyPanel>No verified referral attribution is available.</EmptyPanel></div>
              )}
            </article>

            <p className="mt-5 border-t border-white/[0.05] pt-4 font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">
              Executive read model only. Supporting intelligence does not author Matter, payment, execution or corridor truth.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
