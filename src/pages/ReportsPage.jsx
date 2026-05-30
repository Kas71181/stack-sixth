import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Download, Share2, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ReportsPage() {
  const { data: reports = [] } = useQuery({ queryKey: ["audit-reports"], queryFn: () => base44.entities.AuditReport.list("-generated_date", 20) });
  const [copied, setCopied] = useState(null);

  const handleShare = async (reportId) => {
    const url = `${window.location.origin}/stack/audit-report?report=${reportId}`;
    await navigator.clipboard.writeText(url);
    setCopied(reportId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExportCSV = (report) => {
    const rows = [
      ["Field", "Value"],
      ["Company", report.company_name],
      ["Date", report.generated_date],
      ["Audit Score", report.audit_score],
      ["Total Monthly Spend", `$${report.total_monthly_spend}`],
      ["Monthly Waste", `$${report.estimated_monthly_waste}`],
      ["Annual Savings", `$${(report.estimated_monthly_waste || 0) * 12}`],
      ["Inactive Seats", report.inactive_seat_count],
      ["Redundant Tools", report.redundant_tool_count],
      ["Summary", report.executive_summary],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-${report.generated_date}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>

      {reports.length === 0 ? (
        <div className="text-center py-24">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-bold text-lg">No reports yet</p>
          <p className="text-sm text-muted-foreground mt-1.5">Run an audit to generate your first report.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card border border-border/60 rounded-2xl p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <p className="font-semibold text-sm">{r.company_name} — {r.generated_date}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${r.status === "Final" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{r.executive_summary}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Score</p>
                  <p className={`text-lg font-extrabold ${r.audit_score >= 75 ? "text-emerald-600" : r.audit_score >= 50 ? "text-amber-600" : "text-red-600"}`}>{r.audit_score}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Savings/yr</p>
                  <p className="text-sm font-bold text-emerald-600 font-mono">${Math.round((r.estimated_monthly_waste || 0) * 12).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleExportCSV(r)}>
                  <Download className="w-3.5 h-3.5" />CSV
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleShare(r.id)}>
                  {copied === r.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied === r.id ? "Copied!" : "Share"}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}