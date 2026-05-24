import { Shield } from "lucide-react";

export default function AuthDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground mb-2">
          Authentication
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          How to authenticate with the Milano Seal API — API keys, OAuth flows,
          and session management.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-gold" />
          <h2 className="text-sm font-semibold text-foreground">
            Authentication Model
          </h2>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">API Keys</p>
            <p>
              Tenant-scoped API keys are issued after alliance partner approval.
              Keys are short-lived and rotate on a configurable schedule.
              API key management UI is pending.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">
              Bearer Token Auth
            </p>
            <p>
              Pass your API key as a Bearer token in the Authorization header:
            </p>
            <pre className="mt-2 bg-zinc-950 text-zinc-400 font-mono text-xs rounded p-3">
              {`Authorization: Bearer ms_live_xxxxxxxxxxxxxxxx`}
            </pre>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Webhook Signatures</p>
            <p>
              All inbound webhooks are signed with HMAC-SHA256 using your
              webhook secret. Verify the{" "}
              <code className="text-gold font-mono text-xs">x-alliance-signature</code>{" "}
              header before processing events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
