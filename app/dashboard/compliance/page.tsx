"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe2, Search, Stamp, ShieldCheck, X } from "lucide-react";

interface JurisdictionSummary {
  code: string;
  name: string;
  kind: "country" | "state";
  region: string;
  flag: string;
  hague: boolean;
  ron: string | null;
  deals_count: number | null;
}

interface JurisdictionDetail extends JurisdictionSummary {
  authentication_path: string;
  execution_path: string;
  typical_documents: string[];
  witness_rules: string;
  summary: string;
  requirements: string[];
  regulations: string[];
}

const REGION_ORDER = [
  "United States",
  "Europe",
  "Americas",
  "Middle East & Africa",
  "Asia & Pacific",
];

export default function Compliance() {
  const { data: list, isLoading } = useApi<JurisdictionSummary[]>(
    "/api/compliance/list"
  );
  const [code, setCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const groups = new Map<string, JurisdictionSummary[]>();
    if (!list) return groups;
    for (const j of list) {
      const key = j.region;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(j);
    }
    return groups;
  }, [list]);

  const filtered = (rows: JurisdictionSummary[] | undefined) => {
    if (!rows) return [] as JurisdictionSummary[];
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s)
    );
  };

  const totalCountries = list?.filter((l) => l.kind === "country").length ?? 0;
  const totalStates = list?.filter((l) => l.kind === "state").length ?? 0;
  const hagueCount =
    list?.filter((l) => l.kind === "country" && l.hague).length ?? 0;
  const ronCount = list?.filter((l) => l.kind === "state" && l.ron).length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-2">
          Global Compliance Map
        </p>
        <h1 className="font-serif text-4xl text-foreground">
          Where The Milano Seal Operates
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Authentication paths, RON eligibility, witness rules, and typical
          documents for every jurisdiction we serve.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatPill
          icon={Globe2}
          label="Countries served"
          value={totalCountries}
        />
        <StatPill icon={ShieldCheck} label="U.S. states" value={totalStates} />
        <StatPill icon={Stamp} label="Hague apostille" value={hagueCount} />
        <StatPill
          icon={ShieldCheck}
          label="RON-enabled states"
          value={ronCount}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_440px] gap-6">
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search jurisdictions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="text-muted-foreground">Loading map…</div>
          ) : (
            REGION_ORDER.filter((r) => grouped.has(r)).map((region) => {
              const rows = filtered(grouped.get(region));
              if (!rows.length) return null;
              return (
                <Card key={region} className="bg-card border-gold">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <span className="text-gold">{region}</span>
                      <span className="text-xs text-muted-foreground font-sans">
                        {rows.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {rows.map((j) => {
                        const active = code === j.code;
                        return (
                          <button
                            key={j.code}
                            onClick={() => setCode(j.code)}
                            data-testid={`jurisdiction-${j.code}`}
                            className={`text-left p-3 rounded-md border transition-colors hover-elevate ${
                              active
                                ? "border-gold bg-gold-soft"
                                : "border-border bg-background/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{j.flag}</span>
                                <span className="text-sm text-foreground">
                                  {j.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                {j.code}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              {j.kind === "country" &&
                                (j.hague ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] bg-paid"
                                  >
                                    HAGUE
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] bg-critical"
                                  >
                                    NON-HAGUE
                                  </Badge>
                                ))}
                              {j.kind === "state" && j.ron && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] bg-paid"
                                >
                                  RON
                                </Badge>
                              )}
                              {(j.deals_count ?? 0) > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] border-gold text-gold bg-gold-soft"
                                >
                                  {j.deals_count} matter
                                  {(j.deals_count ?? 0) > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <Badge variant="outline" className="bg-paid">
                  HAGUE
                </Badge>
                <p className="text-muted-foreground">
                  Apostille is sufficient. Authentication path stops at the
                  state Secretary of State.
                </p>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="bg-critical">
                  NON-HAGUE
                </Badge>
                <p className="text-muted-foreground">
                  Requires consular legalization in addition to U.S.
                  authentication.
                </p>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="bg-paid">
                  RON
                </Badge>
                <p className="text-muted-foreground">
                  Remote Online Notarization permitted under state law.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-card border-gold lg:sticky lg:top-24 self-start">
            {code ? (
              <DetailPanel code={code} onClose={() => setCode(null)} />
            ) : (
              <>
                <CardHeader>
                  <CardDescription className="text-[11px] uppercase tracking-widest">
                    Detail
                  </CardDescription>
                  <CardTitle className="font-serif text-2xl mt-1">
                    Select a jurisdiction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Choose a country or U.S. state on the left to see the full
                    compliance dossier.
                  </p>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ code, onClose }: { code: string; onClose: () => void }) {
  const { data } = useApi<JurisdictionDetail>(
    `/api/compliance/list/${encodeURIComponent(code)}`
  );
  if (!data) {
    return (
      <>
        <CardHeader>
          <CardDescription className="text-[11px] uppercase tracking-widest">
            Detail
          </CardDescription>
          <CardTitle className="font-serif text-2xl mt-1">Loading…</CardTitle>
        </CardHeader>
        <CardContent />
      </>
    );
  }
  const d = data;
  return (
    <>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardDescription className="text-[11px] uppercase tracking-widest">
            Detail
          </CardDescription>
          <CardTitle className="font-serif text-2xl mt-1">
            <span className="mr-2">{d.flag}</span>
            {d.name}
          </CardTitle>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {d.kind === "country" &&
            (d.hague ? (
              <Badge variant="outline" className="bg-paid">
                Hague Apostille
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-critical">
                Non-Hague (Consular)
              </Badge>
            ))}
          {d.kind === "state" && d.ron && (
            <Badge variant="outline" className="bg-paid">
              RON enabled
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-gold text-gold bg-gold-soft"
          >
            {d.region}
          </Badge>
        </div>

        <p className="text-sm text-foreground/80">{d.summary}</p>

        <Separator className="bg-border" />

        <Section title="Authentication Path" body={d.authentication_path} />
        <Section title="Execution Path" body={d.execution_path} />
        <Section title="Witness Rules" body={d.witness_rules} />

        {d.typical_documents.length > 0 && (
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
              Typical Documents
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {d.typical_documents.map((doc) => (
                <Badge
                  key={doc}
                  variant="outline"
                  className="text-xs bg-background border-border"
                >
                  {doc}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {d.requirements.length > 0 && (
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
              Requirements
            </h4>
            <ul className="space-y-1 text-sm text-foreground/80">
              {d.requirements.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-gold">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {d.regulations.length > 0 && (
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
              Regulations
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {d.regulations.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe2;
  label: string;
  value: number;
}) {
  return (
    <Card className="bg-card border-gold">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="font-serif text-2xl text-gold mt-1">{value}</p>
        </div>
        <Icon className="w-6 h-6 text-gold/60" />
      </CardContent>
    </Card>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
        {title}
      </h4>
      <p className="text-sm text-foreground/80">{body}</p>
    </div>
  );
}
