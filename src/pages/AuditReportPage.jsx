import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { RefreshCw, AlertTriangle, TrendingDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuditScoreRing from "@/components/auditreport/AuditScoreRing";
import RecommendationsList from "@/components/auditreport/RecommendationsList";
import RedundancyDetector from "@/components/auditreport/RedundancyDetector";

const SYSTEM_PROMPT = `You are an expert SaaS spend auditor. Analyze the provided tool stack data and return a JSON audit report.

Rules:
- Flag tools with utilization < 50%
- Detect redundant tools: 2+ in same category = consolidation opportunity
- Calculate total wasted spend
- Generate 5-10 prioritized recommendations sorted by estimated monthly savings
- Audit Score 0-100: avg utilization (40%) - redundancy penalty (30%) - inactive user % (30%)
- Write 2-3 sentence executive summary

Return ONLY valid JSON, no markdown.`;

export default function AuditReportPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [running, setRunning] = useState(false);

  const { data: reports = [] } = useQuery({
    queryKey: ["audit-reports", user?.id],
    queryFn: () => base44.entities.AuditReport.filter({ created_by_id: user?.id }, "-generated_date", 10),
    enabled: !!user?.id,
  });
  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations", user?.id],
    queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies", user?.id],
    queryFn: () => base44.entities.Company.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const latestReport = reports[0];
  const company = companies[0];

  const createReport = useMutation({
    mutationFn: (data) => base44.entities.AuditReport.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit-reports"] }),
  });

  const createRec = useMutation({
    mutationFn: (data) => base44.entities.Recommendation.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations"] }),
  });

  const updateCompany = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
  });

  const runAudit = async () => {
    setRunning(true);
    const toolData = integrations.map((i) => ({
      name: i.tool_name,
      category: i.category,
      monthly_cost: i.monthly_cost,
      licensed_seats: i.licensed_seats,
      active_users: i.active_users,
      utilization: i.licensed_seats > 0 ? Math.round((i.active_users / i.licensed_seats) * 100) : 0,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\nTool Stack:\n${JSON.stringify(toolData, null, 2)}`,
      response_json_schema: {
        type: "object",
        properties: {
          audit_score: { type: "number" },
          executive_summary: { type: "string" },
          total_monthly_waste: { type: "number" },
          inactive_seat_count: { type: "number" },
          redundant_tool_count: { type: "number" },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                tool_name: { type: "string" },
                description: { type: "string" },
                estimated_monthly_savings: { type: "number" },
                priority: { type: "string" },
              },
            },
          },
        },
      },
    });

    const totalSpend = integrations.reduce((s, i) => s + (i.monthly_cost || 0), 0);
    const report = await createReport.mutateAsync({
      company_id: company?.id || user?.id || "unknown",
      company_name: company?.name || "My Company",
      generated_date: new Date().toISOString().split("T")[0],
      total_monthly_spend: totalSpend,
      estimated_monthly_waste: result.total_monthly_waste || 0,
      inactive_seat_count: result.inactive_seat_count || 0,
      redundant_tool_count: result.redundant_tool_count || 0,
      audit_score: result.audit_score || 0,
      executive_summary: result.executive_summary || "",
      status: "Final",
    });

    for (const rec of (result.recommendations || [])) {
      await createRec.mutateAsync({ ...rec, audit_id: report.id, company_id: company?.id || user?.id || "unknown", status: "Open" });
    }

    if (company?.id) {
      updateCompany.mutate({ id: company.id, data: { audit_score: result.audit_score, last_audit_date: new Date().toISOString().split("T")[0] } });
    }
    setRunning(false);
  };

  const totalSpend = integrations.reduce((s, i) => s + (i.monthly_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Audit Report</h1>
        <Button onClick={runAudit} disabled={running || integrations.length === 0} className="gap-2">
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {running ? "Running AI Audit..." : "Run Audit"}
        </Button>
      </div>

      {latestReport && (
        <>
          {/* Score + Summary */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <AuditScoreRing score={latestReport.audit_score || 0} />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Executive Summary</p>
              <p className="text-sm leading-relaxed">{latestReport.executive_summary || "Run an audit to generate insights."}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Monthly Spend</p><p className="font-bold font-mono">${totalSpend.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Monthly Waste</p><p className="font-bold text-destructive font-mono">${Math.round(latestReport.estimated_monthly_waste || 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Annual Savings</p><p className="font-bold text-emerald-600 font-mono">${Math.round((latestReport.estimated_monthly_waste || 0) * 12).toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Inactive Seats</p><p className="font-bold">{latestReport.inactive_seat_count || 0}</p></div>
                <div><p className="text-xs text-muted-foreground">Redundant Tools</p><p className="font-bold">{latestReport.redundant_tool_count || 0}</p></div>
              </div>
            </div>
          </motion.div>

          <RedundancyDetector integrations={integrations} />
          <RecommendationsList auditId={latestReport.id} />
        </>
      )}

      {!latestReport && (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-5">
            <RefreshCw className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-bold text-lg">No audit yet</p>
          <p className="text-sm text-muted-foreground mt-1.5">Click "Run Audit" to generate AI-powered insights.</p>
        </div>
      )}

      {/* Report history */}
      {reports.length > 1 && (
        <div className="bg-card border border-border/60 rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-3">Report History</h2>
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <p className="text-sm">{r.generated_date}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-destructive">-${Math.round(r.estimated_monthly_waste || 0)}/mo</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.audit_score >= 75 ? "bg-emerald-50 text-emerald-700" : r.audit_score >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                    {r.audit_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}