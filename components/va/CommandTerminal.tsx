"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Terminal, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { parseVACommand, executeVACommandPreview, type VACommandResult } from "@/lib/va/commands";

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  text: string;
  timestamp: string;
}

const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.1)";

function now(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

const BOOT_LINES: TerminalLine[] = [
  { type: "system", text: "VA COMMAND TERMINAL — THE MILANO SEAL™", timestamp: "" },
  { type: "system", text: "Access level: VIRTUAL_ASSISTANT", timestamp: "" },
  { type: "system", text: "Payment gate: ACTIVE", timestamp: "" },
  { type: "system", text: 'Type "help" for available commands.', timestamp: "" },
  { type: "system", text: "──────────────────────────────────", timestamp: "" },
];

export function CommandTerminal({ selectedMatterId }: { selectedMatterId?: string | null }) {
  const [lines, setLines] = useState<TerminalLine[]>(BOOT_LINES);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Pre-fill matter ID when selected from context stream
  useEffect(() => {
    if (selectedMatterId) {
      setInput(`view next action ${selectedMatterId}`);
      inputRef.current?.focus();
    }
  }, [selectedMatterId]);

  function pushLines(newLines: TerminalLine[]) {
    setLines((prev) => [...prev, ...newLines]);
  }

  function submit() {
    const raw = input.trim();
    if (!raw) return;

    const ts = now();
    pushLines([{ type: "input", text: `> ${raw}`, timestamp: ts }]);
    setHistory((h) => [raw, ...h.slice(0, 49)]);
    setHistIdx(-1);
    setInput("");

    const command = parseVACommand(raw);
    const result: VACommandResult = executeVACommandPreview(command);

    const outputLines = result.message.split("\n").map((line, i) => ({
      type: (result.ok ? "output" : "error") as TerminalLine["type"],
      text: line,
      timestamp: i === 0 ? ts : "",
    }));

    if (result.code === "MATTER_FLAGGED" || result.code === "OPERATOR_REVIEW_REQUESTED") {
      outputLines.push({
        type: "system",
        text: "→ Ledger event prepared. Operator approval required.",
        timestamp: "",
      });
    }

    pushLines(outputLines);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      if (history[idx]) setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? "" : history[idx] ?? "");
    }
  }

  return (
    <div
      className="flex flex-col h-full rounded-sm"
      style={{ border: `1px solid ${BORDER}`, background: "rgba(5,4,2,0.97)", fontFamily: "monospace" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <Terminal size={12} style={{ color: GOLD_DIM }} />
        <span style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.2em" }}>COMMAND TERMINAL</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.7)" }} />
          <span style={{ fontSize: 8, color: "rgba(34,197,94,0.5)", letterSpacing: "0.1em" }}>VA ACTIVE</span>
        </div>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5" style={{ minHeight: 0 }}>
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            {line.timestamp && (
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", flexShrink: 0, paddingTop: 1 }}>
                {line.timestamp}
              </span>
            )}
            <span style={{
              fontSize: 11,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              color: line.type === "input" ? GOLD
                : line.type === "error" ? "rgba(239,68,68,0.8)"
                : line.type === "system" ? "rgba(212,175,55,0.35)"
                : "rgba(255,255,255,0.6)",
            }}>
              {line.type === "error" && line.text.includes("VIOLATION") && (
                <AlertTriangle size={10} style={{ color: "rgba(239,68,68,0.75)", display: "inline", marginRight: 4 }} />
              )}
              {line.type === "output" && line.text.includes("queued") && (
                <CheckCircle2 size={10} style={{ color: "rgba(34,197,94,0.6)", display: "inline", marginRight: 4 }} />
              )}
              {line.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <ChevronRight size={12} style={{ color: GOLD, flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="enter command..."
          className="flex-1 bg-transparent outline-none text-[11px]"
          style={{ color: GOLD, caretColor: GOLD, fontFamily: "monospace" }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />
      </div>

      {/* Payment gate notice */}
      <div className="px-3 py-1.5" style={{ borderTop: `1px solid ${BORDER}`, background: "rgba(239,68,68,0.03)" }}>
        <span style={{ fontSize: 8, color: "rgba(239,68,68,0.4)", letterSpacing: "0.12em" }}>
          PAYMENT GATE ACTIVE · RELEASE ACTIONS REQUIRE OPERATOR
        </span>
      </div>
    </div>
  );
}
