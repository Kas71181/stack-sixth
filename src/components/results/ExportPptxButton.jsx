import { useState } from "react";
import { Presentation, Loader2 } from "lucide-react";
import { exportAuditToPptx } from "@/utils/exportToPptx";

export default function ExportPptxButton({ audit }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportAuditToPptx(audit);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Presentation className="w-4 h-4 text-primary" />
      )}
      {loading ? "Generating…" : "Export to Slides"}
    </button>
  );
}