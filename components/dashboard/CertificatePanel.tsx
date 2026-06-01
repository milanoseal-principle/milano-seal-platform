"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CertificatePanelProps {
  matterId: string;
  isPaidAndReleased: boolean;
  documentCount?: number;
  destinationCountry?: string | null;
  documentType?: string | null;
  releasedAt?: string | null;
}

interface CertificateResult {
  success: boolean;
  verification_id: string;
  custody_hash: string;
  verification_url: string;
  already_exists?: boolean;
}

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://www.milanoseal.com";

export function CertificatePanel({
  matterId,
  isPaidAndReleased,
  documentCount = 1,
  destinationCountry,
  documentType,
  releasedAt,
}: CertificatePanelProps) {
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState<CertificateResult | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matter_id: matterId,
          document_count: documentCount,
          destination_country: destinationCountry ?? null,
          document_type: documentType ?? null,
          released_at: releasedAt ?? new Date().toISOString(),
          generated_by: "operator",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Certificate generation failed");
        return;
      }
      setCert(data);
      toast.success(
        data.already_exists
          ? "Certificate already exists — loaded."
          : "Certificate generated successfully."
      );
    } catch {
      toast.error("Network error — certificate generation failed.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!cert) return;
    const url = `${BASE_URL}/verify/${cert.verification_id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Verification link copied."));
  }

  if (!isPaidAndReleased) {
    return (
      <Card className="bg-card border-gold opacity-50">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C6A55A]" />
            Certificate of Custody
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Certificate generation is available after the matter is marked paid &amp; released.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-gold">
      <CardHeader>
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#C6A55A]" />
          Certificate of Custody
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!cert ? (
          <>
            <p className="text-sm text-muted-foreground">
              Generate a public custody certificate for this matter. The certificate creates a
              tamper-evident hash and a public verification URL — no PII is ever exposed.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
              variant="outline"
              style={{ borderColor: "rgba(198,165,90,0.4)", color: "#C6A55A" }}
            >
              {loading ? "Generating…" : "Generate Certificate"}
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#4a9e6b]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {cert.already_exists ? "Certificate on record" : "Certificate generated"}
              </span>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verification ID</span>
                <span className="font-mono text-xs text-foreground">{cert.verification_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custody Hash</span>
                <span className="font-mono text-xs text-foreground truncate max-w-[200px]" title={cert.custody_hash}>
                  {cert.custody_hash.substring(0, 16)}…
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyLink}
                variant="outline"
                size="sm"
                className="flex-1"
                style={{ borderColor: "rgba(198,165,90,0.3)", color: "#C6A55A" }}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Verification Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                style={{ borderColor: "rgba(198,165,90,0.3)", color: "#C6A55A" }}
                asChild
              >
                <a
                  href={`/verify/${cert.verification_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Public Page
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
