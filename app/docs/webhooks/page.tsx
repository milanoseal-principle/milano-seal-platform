import { AlertCircle, Radio } from "lucide-react";

export default function WebhooksDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground mb-2">Webhook Reference</h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          Incoming webhook events from alliance partners, payment providers, and
          external execution platforms.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200/50 bg-amber-50/30 p-5 flex gap-3">
        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Webhook signature verification is stubbed. HMAC validation and
          replay protection will be wired once provider credentials are
          configured.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-gold" />
          <h2 className="text-sm font-semibold text-foreground">
            Alliance Webhook Events
          </h2>
        </div>
        <div className="space-y-3 font-mono text-sm">
          {[
            { event: "alliance.status.changed", desc: "Partner status update" },
            { event: "alliance.job.offered", desc: "New job offered to partner" },
            { event: "alliance.job.accepted", desc: "Partner accepted job" },
            { event: "alliance.job.declined", desc: "Partner declined job" },
            { event: "alliance.job.completed", desc: "Partner signaled completion" },
            { event: "alliance.credential.verified", desc: "Credential cleared" },
            { event: "alliance.toolbelt.updated", desc: "Tool belt progress updated" },
          ].map((e) => (
            <div
              key={e.event}
              className="flex items-start gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <span className="text-gold">{e.event}</span>
              <span className="text-muted-foreground font-sans text-xs ml-auto">
                {e.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
