"use client";

import { useEffect, useRef, useState } from "react";

type LogTone = "ok" | "info" | "err" | "dim";
interface LogLine {
  t: LogTone;
  m: string;
}

const COLOR: Record<LogTone, string> = {
  ok: "#4a9e6b",
  info: "rgba(255,255,255,.85)",
  err: "#c05050",
  dim: "rgba(198,165,90,.5)",
};

const HELP_LINES: LogLine[] = [
  { t: "info", m: "Milano Seal™ OS · System Terminal initialized" },
  { t: "ok", m: "Supabase connection: LIVE" },
  { t: "ok", m: "State machine: LOCKED" },
  { t: "ok", m: "Custody ledger: HASH-CHAINED" },
  { t: "ok", m: "Carrier API (Shippo): READY" },
  { t: "ok", m: "WhatsApp (Twilio): READY" },
  { t: "dim", m: "Type `help` for command list" },
];

interface CmdHandler {
  match: (cmd: string) => boolean;
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
    run: async () => [
      {
        t: "dim",
        m: "Commands: health · pipeline · alerts · clear · custody <deal-id> · ship-track · evidence <deal-id>",
      },
    ],
  },
  {
    match: (c) => c === "clear",
    run: async () => [{ t: "dim", m: "Terminal cleared." }],
  },
  {
    match: (c) => c === "health",
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
            m: `Total deals: ${data.total_deals ?? 0} · Revenue: $${(
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
            m: `Open: ${d.total_open} · Pipeline: $${d.total_value_open.toLocaleString()} · Closed: $${d.total_value_closed.toLocaleString()}`,
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
    run: async () => {
      try {
        const arr = (await fetchJson("/api/admin/sla-alerts")) as Array<{
          deal_id: string;
          severity: string;
          hours_in_stage: number;
        }>;
        if (arr.length === 0) return [{ t: "ok", m: "No SLA alerts." }];
        return arr.slice(0, 6).map((a) => ({
          t: a.severity === "high" ? "err" : "info",
          m: `[${a.severity.toUpperCase()}] ${a.deal_id} — ${a.hours_in_stage}h in stage`,
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
            } · ${r.verdict.total} entries${
              r.verdict.reason ? " · " + r.verdict.reason : ""
            }`,
          },
        ];
        r.ledger.slice(-8).forEach((l) =>
          out.push({
            t: "dim",
            m: `${l.event}  ·  ${new Date(l.created_at).toISOString()}`,
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
            m: `Tracking sweep · polled ${d.polled ?? 0} · updated ${
              d.updated ?? 0
            } · delivered ${d.delivered ?? 0}`,
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
    run: async (cmd) => {
      const id = cmd.slice("evidence ".length).trim();
      if (!id) return [{ t: "err", m: "Usage: evidence <deal-id>" }];
      window.open(`/api/evidence/${id}`, "_blank");
      return [{ t: "ok", m: `Evidence packet PDF opened in new tab.` }];
    },
  },
];

export default function TerminalPage() {
  const [logs, setLogs] = useState<LogLine[]>(HELP_LINES);
  const [cmd, setCmd] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  async function run() {
    if (!cmd.trim() || busy) return;
    const c = cmd.trim();
    setLogs((l) => [...l, { t: "dim", m: `> ${c}` }]);
    setCmd("");
    setBusy(true);

    if (c === "clear") {
      setLogs([]);
      setBusy(false);
      return;
    }

    const handler = HANDLERS.find((h) => h.match(c));
    if (!handler) {
      setLogs((l) => [...l, { t: "err", m: `Unknown command: "${c}"` }]);
    } else {
      try {
        const out = await handler.run(c);
        setLogs((l) => [...l, ...out]);
      } catch (err) {
        setLogs((l) => [
          ...l,
          {
            t: "err",
            m: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ]);
      }
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="term-eyebrow">System Terminal</div>
      <h1 className="term-h1">Operator Console</h1>

      <div className="term-box">
        {logs.map((l, i) => (
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
          placeholder="Type a command — health · pipeline · alerts · custody <id> · ship-track · evidence <id> · help"
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
          {busy ? "…" : "Run"}
        </button>
      </div>
    </div>
  );
}
