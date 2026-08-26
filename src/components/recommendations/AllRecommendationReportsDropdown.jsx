import { useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2, Presentation } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportAllRecommendationsCsv, exportAllRecommendationsPdf, exportAllRecommendationsPptx } from "@/utils/exportAllRecommendationReports";

export default function AllRecommendationReportsDropdown({ recommendations, existingSoftware = [], companyName = "" }) {
  const [loading, setLoading] = useState("");
  const download = async (format) => {
    setLoading(format);
    try {
      if (format === "pdf") exportAllRecommendationsPdf(recommendations, existingSoftware, companyName);
      if (format === "pptx") await exportAllRecommendationsPptx(recommendations, existingSoftware, companyName);
      if (format === "csv") exportAllRecommendationsCsv(recommendations, existingSoftware, companyName);
    } finally { setLoading(""); }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button type="button" disabled={!!loading} className="inline-flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-xs font-semibold hover:border-primary/40 hover:text-primary active:scale-[0.96] disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{loading ? "Generating report" : "Download all reports"}<ChevronDown className="h-3.5 w-3.5" /></button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => download("pdf")}><FileText />Download PDF</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => download("pptx")}><Presentation />Download PowerPoint</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => download("csv")}><FileSpreadsheet />Download CSV</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}