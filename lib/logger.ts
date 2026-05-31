// Structured logger for production error tracking.
// Outputs JSON-structured log entries suitable for ingestion by Axiom, Logtail,
// or any NDJSON-compatible log sink. Replace the console.* calls in this module
// with a Pino/Winston/Sentry sink when a structured provider is configured.
//
// NEVER log: secrets, tokens, OTPs, raw passwords, full client identity docs,
// Supabase service role keys, or payment credentials.

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  module: string;
  message: string;
  meta?: Record<string, unknown>;
}

function write(level: LogLevel, module: string, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    module,
    message,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  };

  // In production, replace this with your structured log provider:
  //   import pino from "pino"; const log = pino(); log[level](entry);
  //   or: Sentry.captureException / Axiom.ingest / Logtail.log
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info(module: string, message: string, meta?: Record<string, unknown>) {
    write("info", module, message, meta);
  },
  warn(module: string, message: string, meta?: Record<string, unknown>) {
    write("warn", module, message, meta);
  },
  error(module: string, message: string, meta?: Record<string, unknown>) {
    write("error", module, message, meta);
  },
};
