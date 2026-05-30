import { FileCode, AlertCircle } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground mb-2">API Reference</h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          REST API documentation for Milano Seal infrastructure integration.
          OpenAPI spec and SDK generation pending.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200/50 bg-amber-50/30 p-5 flex gap-3">
        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          API documentation is in preparation. Endpoints listed below are
          stub-only. Production wiring and OpenAPI spec generation are
          scheduled for the next implementation phase.
        </p>
      </div>

      <DocsSection title="Core Endpoints">
        <EndpointRow method="GET" path="/api/health" note="System health check" />
        <EndpointRow method="GET" path="/api/health/database" note="Database connectivity" />
        <EndpointRow method="GET" path="/api/dispatch/jobs" note="List dispatch queue" />
        <EndpointRow method="POST" path="/api/dispatch/request" note="Create dispatch request" />
        <EndpointRow method="POST" path="/api/dispatch/assign" note="Assign operator" />
        <EndpointRow method="POST" path="/api/dispatch/escalate" note="Escalate to admin" />
      </DocsSection>

      <DocsSection title="Alliance Webhooks">
        <EndpointRow method="POST" path="/api/webhooks/alliance/status" note="Status change event" />
        <EndpointRow method="POST" path="/api/webhooks/alliance/job" note="Job lifecycle event" />
        <EndpointRow method="POST" path="/api/webhooks/alliance/credential" note="Credential update" />
        <EndpointRow method="POST" path="/api/webhooks/alliance/toolbelt" note="Tool belt update" />
      </DocsSection>

      <DocsSection title="Authentication">
        <EndpointRow method="POST" path="/auth/callback" note="OAuth callback" />
      </DocsSection>
    </div>
  );
}

function DocsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <FileCode size={14} className="text-gold" />
        {title}
      </h2>
      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function EndpointRow({
  method,
  path,
  note,
}: {
  method: string;
  path: string;
  note: string;
}) {
  const methodColor: Record<string, string> = {
    GET: "text-emerald-400",
    POST: "text-blue-400",
    PUT: "text-amber-400",
    DELETE: "text-red-400",
  };
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-card text-sm font-mono">
      <span
        className={`w-12 text-xs font-bold uppercase ${methodColor[method] ?? "text-muted-foreground"}`}
      >
        {method}
      </span>
      <span className="text-foreground flex-1">{path}</span>
      <span className="text-muted-foreground text-xs font-sans">{note}</span>
    </div>
  );
}
