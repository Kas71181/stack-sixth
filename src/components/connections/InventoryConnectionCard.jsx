import { AlertCircle, CheckCircle2, Loader2, Plug, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import DataPrivacyModal from "@/components/usage/DataPrivacyModal";
import useInventoryConnection from "@/hooks/useInventoryConnection";

export default function InventoryConnectionCard({ tool, connector, isLive, onSynced }) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const flow = useInventoryConnection({ tool, connector, isLive, onSynced });
  const busy = flow.status === "authorizing" || flow.status === "syncing";
  return (
    <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
          {connector ? <img src={connector.logo} alt="" className="h-7 w-7 object-contain" /> : <ShieldAlert className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{tool.tool_name}</p>
          <p className="text-xs text-muted-foreground">{tool.category}</p>
          <p className={`mt-1 text-xs font-medium ${flow.status === "live" ? "text-emerald-600" : "text-muted-foreground"}`}>
            {flow.status === "live" ? "Live" : connector ? "Not connected — OAuth available" : "Not connected — live connector unavailable"}
          </p>
        </div>
      </div>
      <div className="sm:w-40">
        {flow.error && <p className="mb-2 flex gap-1 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{flow.error}</p>}
        <Button className="w-full" size="sm" variant={flow.status === "live" ? "outline" : "default"} disabled={!connector || busy} onClick={() => setShowPrivacy(true)}>
          {busy ? <Loader2 className="animate-spin" /> : flow.status === "live" ? <CheckCircle2 /> : <Plug />}
          {flow.status === "authorizing" ? "Authorizing…" : flow.status === "syncing" ? "Syncing…" : flow.status === "live" ? "Reconnect" : connector ? "Connect" : "Unavailable"}
        </Button>
      </div>
      {showPrivacy && <DataPrivacyModal connector={connector} onCancel={() => setShowPrivacy(false)} onConfirm={() => { setShowPrivacy(false); flow.connect(); }} />}
    </div>
  );
}