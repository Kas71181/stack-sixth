import { AlertCircle, CheckCircle2, KeyRound, Loader2, Plug } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import DataPrivacyModal from "@/components/usage/DataPrivacyModal";
import ApiTokenModal from "@/components/connections/ApiTokenModal";
import ConnectionFallbackModal from "@/components/connections/ConnectionFallbackModal";
import ReportUploadModal from "@/components/connections/ReportUploadModal";
import ToolLogo from "@/components/stack/ToolLogo";
import useInventoryConnection from "@/hooks/useInventoryConnection";
import { GMAIL_EVIDENCE_CONNECTOR } from "@/lib/inventoryConnectors";

export default function InventoryConnectionCard({ tool, connector, isLive, onSynced }) {
  const [modal, setModal] = useState("");
  const [activeConnector, setActiveConnector] = useState(connector);
  const flow = useInventoryConnection({ tool, connector: activeConnector, isLive, onSynced });
  const busy = flow.status === "authorizing" || flow.status === "syncing";
  const direct = Boolean(connector?.connectorId || connector?.oauthFunction);
  const nativeConnection = Boolean(connector && !connector.setupRequired && (direct || connector.functionName));
  const verified = ["live", "evidence"].includes(flow.status);
  const configured = verified || ["manual", "snapshot"].includes(flow.status);
  const connectionLabel = flow.status === "live" ? "Verified live"
    : flow.status === "evidence" ? tool.evidence_type === "access" ? "Verified access" : tool.evidence_type === "observed" ? "Observed membership evidence" : "Financial evidence found"
      : flow.status === "manual" ? nativeConnection ? "API token saved, verification pending" : "Saved token cannot be verified"
        : flow.status === "snapshot" ? "Private report connected"
          : direct ? connector?.idleLabel || "OAuth connection available"
            : nativeConnection ? "Manual API credential available" : "Secure connection options available";

  const begin = () => setModal("methods");
  const startNative = () => {
    setActiveConnector(connector);
    setModal(direct ? "privacy" : "token");
  };

  return (
    <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ToolLogo name={tool.tool_name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{tool.tool_name}</p>
          <p className="text-xs text-muted-foreground">{tool.category}</p>
          <p className={`mt-1 text-xs font-medium ${verified ? "text-emerald-600" : "text-muted-foreground"}`}>{connectionLabel}</p>
        </div>
      </div>
      <div className="sm:w-44">
        {flow.error && <p className="mb-2 flex gap-1 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{flow.error}</p>}
        <Button className="w-full" size="sm" variant={configured ? "outline" : "default"} disabled={busy} onClick={begin}>
          {busy ? <Loader2 className="animate-spin" /> : flow.status === "manual" ? <KeyRound /> : verified || flow.status === "snapshot" ? <CheckCircle2 /> : <Plug />}
          {flow.status === "authorizing" ? "Authorizing…" : flow.status === "syncing" ? "Verifying…" : flow.status === "manual" ? "Replace token" : flow.status === "snapshot" ? "Replace report" : verified ? "Reconnect" : "Connect"}
        </Button>
      </div>
      {modal === "privacy" && <DataPrivacyModal connector={activeConnector} onCancel={() => setModal("")} onConfirm={() => { setModal(""); flow.connect(); }} />}
      {modal === "token" && <ApiTokenModal tool={tool} connector={connector} onClose={() => setModal("")} onSaved={() => { setModal(""); onSynced?.(); }} />}
      {modal === "methods" && <ConnectionFallbackModal toolName={tool.tool_name} primaryType={direct ? "oauth" : "api"} primaryLabel={direct ? `Connect with ${connector?.label}` : "Use API credentials"} onPrimary={nativeConnection ? startNative : undefined} onClose={() => setModal("")} onGmail={() => { setActiveConnector(GMAIL_EVIDENCE_CONNECTOR); setModal("privacy"); }} onUpload={() => setModal("upload")} />}
      {modal === "upload" && <ReportUploadModal tool={tool} onClose={() => setModal("")} onSaved={() => { setModal(""); onSynced?.(); }} />}
    </div>
  );
}