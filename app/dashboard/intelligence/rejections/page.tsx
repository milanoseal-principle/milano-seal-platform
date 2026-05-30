import { AlertCircle, Download, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RejectionIntelligencePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-1">
          Execution Intelligence
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          Rejection Intelligence
        </h1>
        <p className="text-muted-foreground mt-1 max-w-xl text-sm">
          Structured record of rejected filings — agency, jurisdiction, wording
          failure, seal issue, and execution path. Used to improve routing
          confidence and reduce repeat failures.
        </p>
      </div>

      <div className="flex gap-3">
        <Button disabled className="opacity-50 cursor-not-allowed" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
        <Button
          disabled
          variant="outline"
          size="sm"
          className="opacity-50 cursor-not-allowed"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <Card className="bg-card border-gold">
        <CardHeader>
          <CardTitle className="font-serif text-lg">
            Rejection Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle size={40} className="text-muted-foreground/20 mb-4" />
            <p className="font-medium text-muted-foreground">
              No verified intelligence recorded yet
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm">
              Rejection data is captured when matters are flagged during
              compliance review or reported after filing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
