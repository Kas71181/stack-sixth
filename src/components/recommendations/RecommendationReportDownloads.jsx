import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Presentation } from "lucide-react";
import { exportRecommendationCsv, exportRecommendationPdf, exportRecommendationPptx } from "@/utils/exportRecommendationReport";

const formats = [
  { key: "pdf", label: "PDF", icon: FileText },
  { key: "pptx", label: "PowerPoint", icon: Presentation },
  { key: "csv", label: "CSV", icon: FileSpreadsheet },
];

export default function RecommendationReportDownloads({ recommendation, existingSoftware = [], companyName = "" }) {
  const [loading, setLoading] = useState("");
  const download = async (format) => {
    setLoading(format);
    try {
      if (format === "pdf") exportRecommendationPdf(recommendation, existingSoftware, companyName);
      if (format === "pptx") await exportRecommendationPptx(recommendation, existingSoftware, companyName);
      if (format === "csv") exportRecommendationCsv(recommendation, existingSoftware, companyName);
    } finally { setLoading(""); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
      <span className="mr-1 flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Download className="h-3.5 w-3.5" />Download cost report</span>
      {formats.map(({ key, label, icon: Icon }) => (
        <button key={key} type="button" onClick={() => download(key)} disabled={!!loading} className="inline-flex items-center gap-1.5 rounded-lg border bg-background/70 px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary active:scale-[0.96] disabled:opacity-50">
          {loading === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}{label}
        </button>
      ))}
    </div>
  );
}