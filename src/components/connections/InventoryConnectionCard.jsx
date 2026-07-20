import { AlertCircle, CheckCircle2, FileCheck2, Loader2, Plug, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import DataPrivacyModal from "@/components/usage/DataPrivacyModal";
import ConnectionFallbackModal from "@/components/connections/ConnectionFallbackModal";
import ReportUploadModal from "@/components/connections/ReportUploadModal";
import useInventoryConnection from "@/hooks/useInventoryConnection";
import { GMAIL_EVIDENCE_CONNECTOR } from "@/lib/inventoryConnectors";

export default function InventoryConnectionCard({ tool, connector, isLive, onSynced }) {
  const [modal, setModal] = useState("");
  const [activeConnector, setActiveConnector] = useState(connector);
  const flow = useInventoryConnection({ tool, connector: activeConnector, isLive, onSynced });
  const busy = flow.status === "authorizing" || flow.status === "syncing";
  const direct = Boolean(connector?.connectorId || connector?.oauthFunction);
  const verified = ["live", "evidence", "snapshot"].includes(flow.status);
  const connectionLabel = flow.status === "live" ? "Verified live"
    : flow.status === "evidence" ? tool.evidence_type === "access" ? "Verified access" : "Financial evidence found"
      : flow.status === "snapshot" ? "Snapshot evidence uploaded"
        : direct ? connector?.idleLabel || "OAuth connection available"
          : "Gmail verification or private report available";

  const begin = () => {
    setActiveConnector(connector);
    setModal(direct ? "privacy" : "fallback");
  };

  const useGmail = () => {
    setActiveConnector(GMAIL_EVIDENCE_CONNECTOR);
    setModal("privacy");
  };

  return (
    <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
          {connector?.logo ? <img src={connector.logo} alt="" className="h-7 w-7 object-contain" /> : <ShieldAlert className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{tool.tool_name}</p>
          <p className="text-xs text-muted-foreground">{tool.category}</p>
          <p className={`mt-1 text-xs font-medium ${verified ? "text-emerald-600" : "text-muted-foreground"}`}>{connectionLabel}</p>
        </div>
      </div>
      <div className="sm:w-44">
        {flow.error && <p className="mb-2 flex gap-1 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{flow.error}</p>}
        <Button className="w-full" size="sm" variant={verified ? "outline" : "default"} disabled={busy} onClick={begin}>
          {busy ? <Loader2 className="animate-spin" /> : flow.status === "snapshot" ? <FileCheck2 /> : verified ? <CheckCircle2 /> : <Plug />}
          {flow.status === "authorizing" ? "Authorizing…" : flow.status === "syncing" ? "Verifying…" : verified ? "Update evidence" : "Connect"}
        </Button>
      </div>
      {modal === "fallback" && <ConnectionFallbackModal toolName={tool.tool_name} onClose={() => setModal("")} onGmail={useGmail} onUpload={() => setModal("upload")} />}
      {modal === "privacy" && <DataPrivacyModal connector={activeConnector} onCancel={() => setModal("")} onConfirm={() => { setModal(""); flow.connect(); }} />}
      {modal === "upload" && <ReportUploadModal tool={tool} onClose={() => setModal("")} onSaved={() => { setModal(""); onSynced?.(); }} />}
    </div>
  );
}