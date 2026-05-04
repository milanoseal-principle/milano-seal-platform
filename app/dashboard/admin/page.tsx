"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCurrency,
  formatDateTime,
  stageLabel,
  timeAgo,
} from "@/lib/format";
import { AlertTriangle, Trophy, TrendingUp, History } from "lucide-react";

interface SLAAlert {
  deal_id: string;
  client_name: string;
  deal_status: string;
  hours_in_stage: number;
  sla_hours: number;
  severity: "low" | "medium" | "high";
}

interface ScoringRow {
  deal_id: string;
  client_name: string;
  total_price: number;
  score: number;
  factors: { label: string; weight: number }[];
}

interface LeaderboardRow {
  assignee: string;
  deals_closed: number;
  deals_open: number;
  revenue: number;
}

interface ActivityRow {
  id: string;
  deal_id: string | null;
  actor: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export default function Admin() {
  const { data: leaderboard } = useApi<LeaderboardRow[]>(
    "/api/admin/leaderboard"
  );
  const { data: alerts } = useApi<SLAAlert[]>("/api/admin/sla-alerts");
  const { data: scoring } = useApi<ScoringRow[]>("/api/admin/scoring");
  const { data: activity } = useApi<ActivityRow[]>("/api/admin/activity");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-2">
          Command Center
        </p>
        <h1 className="font-serif text-4xl text-foreground">
          Operator Command Center
        </h1>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <AlertTriangle className="w-4 h-4 mr-2" /> SLA Alerts
          </TabsTrigger>
          <TabsTrigger value="scoring">
            <TrendingUp className="w-4 h-4 mr-2" /> Conversion
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-2" /> Leaderboard
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="w-4 h-4 mr-2" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">SLA Alerts</CardTitle>
              <CardDescription>
                Matters that have spent too long in their current stage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!alerts || alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  All matters within SLA. ✓
                </p>
              ) : (
                alerts.map((a) => (
                  <Link key={a.deal_id} href={`/dashboard/deals/${a.deal_id}`}>
                    <div
                      className={`flex items-center justify-between p-3 rounded-md border hover-elevate cursor-pointer ${
                        a.severity === "high"
                          ? "border-destructive/50 bg-critical"
                          : a.severity === "medium"
                          ? "border-gold/40 bg-await"
                          : "border-border"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gold">
                            {a.deal_id}
                          </span>
                          <span className="text-foreground">
                            {a.client_name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Stage: {stageLabel(a.deal_status)}
                        </span>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            a.severity === "high"
                              ? "bg-critical"
                              : a.severity === "medium"
                              ? "bg-await"
                              : ""
                          }
                        >
                          {a.severity.toUpperCase()}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {a.hours_in_stage}h / {a.sla_hours}h SLA
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring">
          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">
                Conversion Scoring
              </CardTitle>
              <CardDescription>
                Open matters ranked by likelihood to close.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!scoring || scoring.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open matters.
                </p>
              ) : (
                scoring.map((s) => (
                  <Link key={s.deal_id} href={`/dashboard/deals/${s.deal_id}`}>
                    <div className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate cursor-pointer">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gold">
                            {s.deal_id}
                          </span>
                          <span className="text-foreground truncate">
                            {s.client_name}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.factors.slice(0, 3).map((f, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[10px] border-gold/30 text-foreground/80"
                            >
                              {f.label} +{f.weight}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-foreground">
                          {formatCurrency(s.total_price)}
                        </span>
                        <div className="text-right">
                          <div className="font-serif text-2xl text-gold">
                            {s.score}
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            score
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!leaderboard || leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Assign matters to see the leaderboard.
                </p>
              ) : (
                leaderboard.map((row, i) => (
                  <div
                    key={row.assignee}
                    className="flex items-center justify-between p-3 rounded-md border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-serif text-2xl text-gold w-8 text-center">
                        {i + 1}
                      </div>
                      <span className="text-foreground">{row.assignee}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Closed</span>{" "}
                        <span className="text-foreground font-medium">
                          {row.deals_closed}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Open</span>{" "}
                        <span className="text-foreground font-medium">
                          {row.deals_open}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Revenue</span>{" "}
                        <span className="text-gold font-medium">
                          {formatCurrency(row.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl">
                Recent Activity (system-wide)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {!activity || activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity.</p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="border-l-2 border-gold pl-3 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{a.action}</span>
                      {a.deal_id && (
                        <Link href={`/dashboard/deals/${a.deal_id}`}>
                          <span className="font-mono text-xs text-gold hover:underline cursor-pointer">
                            {a.deal_id}
                          </span>
                        </Link>
                      )}
                      <span className="text-xs text-muted-foreground">
                        · {a.actor ?? "system"}
                      </span>
                    </div>
                    {a.detail && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.detail}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70">
                      {formatDateTime(a.created_at)} ({timeAgo(a.created_at)})
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
