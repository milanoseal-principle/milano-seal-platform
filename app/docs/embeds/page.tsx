import { AlertCircle, Code2 } from "lucide-react";

export default function EmbedsDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground mb-2">
          Embeddable Widgets
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          Drop-in embeds that let alliance partners add Milano Seal intelligence
          to their own websites without replacing their workflow.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200/50 bg-amber-50/30 p-5 flex gap-3">
        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Widget infrastructure is in the design phase. Embed script
          generation and widget.js delivery are pending.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-gold" />
          <h2 className="text-sm font-semibold text-foreground">
            Planned Widgets
          </h2>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Apostille Country Checker",
            "Compliance Lookup",
            "Operator Verification Badge",
            "Acceptance Intelligence Summary",
            "Dispatch Intake Form",
            "Witness Finder",
          ].map((w) => (
            <li key={w} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60 inline-block" />
              {w}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-zinc-950 p-5 font-mono text-sm text-zinc-400">
        <p className="text-zinc-500 text-xs mb-3">Future embed example</p>
        <pre className="whitespace-pre-wrap">{`<!-- Milano Seal Widget -->
<script src="https://themilanoseal.com/widget.js"
        data-api-key="YOUR_KEY"
        async></script>
<div id="milano-compliance-checker"
     data-country="IT"
     data-doc-type="apostille"></div>`}</pre>
      </div>
    </div>
  );
}
