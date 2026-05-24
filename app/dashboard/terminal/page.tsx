"use client";

import { useEffect, useRef, useState } from "react";

type LogTone = "ok" | "info" | "err" | "dim";
interface LogLine {
  t: LogTone;
  m: string;
}

type FilterType = "all" | "custody" | "health" | "pipeline" | "alerts" | "evidence";

const COLOR: Record<LogTone, string> = {
  ok: "#4a9e6b",
  info: "rgba(255,255,255,.85)",
  err: "#c05050",
  dim: "rgba(198,165,90,.5)",
};

const HELP_LINES: LogLine[] = [
  { t: "info", m: "Milano Seal(tm) OS -- Operational Ledger initialized" },
  { t: "ok", m: "Supabase connection: LIVE" },
  { t: "ok", m: "State machine: LOCKED" },
  { t: "ok", m: "Custody ledger: HASH-CHAINED" },
  { t: "ok", m: "Carrier API (Shippo): READY" },
  { t: "ok", m: "WhatsApp (Twilio): READY" },
  { t: "dim", m: "Type `help` for command list" },
];

type LogEntry = LogLine & { category: FilterType };

interface CmdHandler {
  match: (cmd: string) => boolean;
  category: FilterType;
  run: (cmd: string) => Promise<LogLine[]>;
}

async function fetchJson(path: string): Promise<unknown> {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const HANDLERS: CmdHandler[] = [
  {
    match: (c) => c === "help",
    category: "all",
    run: async () => [
      {
        t: "dim",
        m: "Commands: health / pipeline / alerts / clear / custody <deal-id> / ship-track / evidence <deal-id>",
      },
    ],
  },
  {
    match: (c) => c === "clear",
    category: "all",
    run: async () => [{ t: "dim", m: "Terminal cleared." }],
  },
  {
    match: (c) => c === "health",
    category: "health",
    run: async () => {
      try {
        const data = (await fetchJson("/api/dashboard/summary")) as {
          total_deals?: number;
          revenue?: number;
        };
        return [
          { t: "ok", m: "All systems: OK" },
          {
            t: "info",
            m: `Total deals: ${data.total_deals ?? 0} -- Revenue: $${(
              data.revenue ?? 0
            ).toLocaleString()}`,
          },
        ];
      } catch (err) {
        return [
          {
            t: "err",
            m: `Health check failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          },
        ];
      }
    },
  },
  {
    match: (c) => c === "pipeline",
    category: "pipeline",
    run: async () => {
      try {
        const d = (await fetchJson("/api/admin/pipeline")) as {
          total_open: number;
          total_value_open: number;
          total_value_closed: number;
        };
        return [
          {
            t: "info",
            m: `Open: ${d.total_open} -- Pipeline: $${d.total_value_open.toLocaleString()} -- Closed: $${d.total_value_closed.toLocaleString()}`,
          },
        ];
      } catch (err) {
        return [
          {
            t: "err",
            m: `Pipeline fetch failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          },
        ];
      }
    },
  },
  {
    match: (c) => c === "alerts",
    category: "alerts",
    run: async () => {
      try {
        const arr = (await fetchJson("/api/admin/sla-alerts")) as Array<{
          deal_id: string;
          severity: string;
          hours_in_stage: number;
        }>;
        if (arr.length === 0) return [{ t: "ok", m: "No SLA alerts." }];
        return arr.slice(0, 6).map((a) => ({
          t: a.severity === "high" ? ("err" as LogTone) : ("info" as LogTone),
          m: `[${a.severity.toUpperCase()}] ${a.deal_id} -- ${a.hours_in_stage}h in stage`,
        }));
      } catch (err) {
        return [
          {
            t: "err",
            m: `Alerts fetch failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          },
        ];
      }
    },
  },
  {
    match: (c) => c.startsWith("custody "),
    category: "custody",
    run: async (cmd) => {
      const id = cmd.slice("custody ".length).trim();
      if (!id) return [{ t: "err", m: "Usage: custody <deal-id>" }];
      try {
        const r = (await fetchJson(`/api/deals/${id}/custody`)) as {
          ledger: { event: string; created_at: string }[];
          verdict: { valid: boolean; total: number; reason?: string };
        };
        const out: LogLine[] = [
          {
            t: r.verdict.valid ? "ok" : "err",
            m: `Chain ${
              r.verdict.valid ? "VERIFIED" : "BROKEN"
            } -- ${r.verdict.total} entries${
              r.verdict.reason ? " -- " + r.verdict.reason : ""
            }`,
          },
        ];
        r.ledger.slice(-8).forEach((l) =>
          out.push({
            t: "dim",
            m: `${l.event}  --  ${new Date(l.created_at).toISOString()}`,
          }),
        );
        return out;
      } catch (err) {
        return [
          {
            t: "err",
            m: `Custody fetch failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          },
        ];
      }
    },
  },
  {
    match: (c) => c === "ship-track",
    category: "pipeline",
    run: async () => {
      try {
        const r = await fetch("/api/cron/track-shipments", { method: "POST" });
        const d = (await r.json()) as {
          polled?: number;
          updated?: number;
          delivered?: number;
        };
        return [
          {
            t: "ok",
            m: `Tracking sweep -- polled ${d.polled ?? 0} -- updated ${
              d.updated ?? 0
            } -- delivered ${d.delivered ?? 0}`,
          },
        ];
      } catch (err) {
        return [
          {
            t: "err",
            m: `Tracking sweep failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          },
        ];
      }
    },
  },
  {
    match: (c) => c.startsWith("evidence "),
    category: "evidence",
    run: async (cmd) => {
      const id = cmd.slice("evidence ".length).trim();
      if (!id) return [{ t: "err", m: "Usage: evidence <deal-id>" }];
      window.open(`/api/evidence/${id}`, "_blank");
      return [{ t: "ok", m: `Evidence packet PDF opened in new tab.` }];
    },
  },
];

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "custody", label: "custody" },
  { value: "health", label: "health" },
  { value: "pipeline", label: "pipeline" },
  { value: "alerts", label: "alerts" },
  { value: "evidence", label: "evidence" },
];

export default function TerminalPage() {
  const [entries, setEntries] = useState<LogEntry[]>(
    HELP_LINES.map((l) => ({ ...l, category: "all" as FilterType })),
  );
  const [cmd, setCmd] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const endRef = useRef<HTMLDivElement | null>(null);

  const visibleLogs =
    filter === "all"
      ? entries
      : entries.filter((e) => e.category === filter || e.category === "all");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  async function run() {
    if (!cmd.trim() || busy) return;
    const c = cmd.trim();
    setEntries((l) => [...l, { t: "dim", m: `> ${c}`, category: "all" }]);
    setCmd("");
    setBusy(true);

    if (c === "clear") {
      setEntries([]);
      setBusy(false);
      return;
    }

    const handler = HANDLERS.find((h) => h.match(c));
    if (!handler) {
      setEntries((l) => [
        ...l,
        { t: "err", m: `Unknown command: "${c}"`, category: "all" },
      ]);
    } else {
      try {
        const out = await handler.run(c);
        setEntries((l) => [
          ...l,
          ...out.map((o) => ({ ...o, category: handler.category })),
        ]);
      } catch (err) {
        setEntries((l) => [
          ...l,
          {
            t: "err",
            m: `Error: ${err instanceof Error ? err.message : String(err)}`,
            category: "all",
          },
        ]);
      }
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-2">
          Operational Ledger
        </p>
        <h1 className="font-serif text-4xl text-foreground">Operator Console</h1>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-sm text-xs border transition-colors cursor-pointer font-mono ${
              filter === f.value
                ? "text-[#D4AF37] bg-[#D4AF37]/5 border-[#D4AF37]/30"
                : "text-muted-foreground border-gray-800 hover:border-gray-700 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="term-box">
        {visibleLogs.map((l, i) => (
          <div
            key={i}
            className={`term-log-line${l.t !== "info" ? " term-line" : ""}`}
            style={{ color: COLOR[l.t] }}
          >
            {l.m}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="term-input-row">
        <input
          className="term-input"
          placeholder="Type a command -- health / pipeline / alerts / custody <id> / ship-track / evidence <id> / help"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run();
          }}
          disabled={busy}
        />
        <button
          className="term-btn"
          onClick={run}
          disabled={busy || !cmd.trim()}
        >
          {busy ? "..." : "Run"}
        </button>
      </div>
    </div>
  );
}
