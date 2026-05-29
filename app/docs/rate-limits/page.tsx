import { AlertCircle, Gauge } from "lucide-react";

export default function RateLimitsDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground mb-2">
          Rate Limits
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          API rate limits, retry policies, and quota management for alliance
          partner integrations.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200/50 bg-amber-50/30 p-5 flex gap-3">
        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Rate limiting infrastructure is pending. Limits below reflect the
          planned production policy.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-gold" />
          <h2 className="text-sm font-semibold text-foreground">
            Planned Rate Limits
          </h2>
        </div>

        <div className="overflow-hidden rounded-lg border border-border divide-y divide-border font-mono text-sm">
          {[
            { tier: "Explorer Member", rpm: "30", daily: "500" },
            { tier: "Verified Operator", rpm: "120", daily: "5,000" },
            { tier: "Priority Operator", rpm: "300", daily: "20,000" },
            { tier: "Executive Partner", rpm: "1,000", daily: "100,000" },
            { tier: "Enterprise", rpm: "Unlimited", daily: "Custom SLA" },
          ].map((row) => (
            <div
              key={row.tier}
              className="grid grid-cols-3 gap-4 px-4 py-3 bg-card text-xs"
            >
              <span className="font-sans text-foreground">{row.tier}</span>
              <span className="text-muted-foreground">
                {row.rpm} req/min
              </span>
              <span className="text-muted-foreground">
                {row.daily}/day
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Rate limit headers:{" "}
          <code className="text-gold font-mono">X-RateLimit-Limit</code>,{" "}
          <code className="text-gold font-mono">X-RateLimit-Remaining</code>,{" "}
          <code className="text-gold font-mono">X-RateLimit-Reset</code>
        </p>
      </div>
    </div>
  );
}
