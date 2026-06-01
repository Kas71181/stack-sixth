import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Plug, RefreshCw, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

const CONNECTORS = [
  {
    id: "slack",
    connectorId: "6a1daf4c38b1c3730bebbd18",
    functionName: "getSlackActivity",
    label: "Slack",
    description: "Real member list & activity signals",
    color: "bg-[#4A154B]",
    textColor: "text-white",
    icon: "💬",
  },
  {
    id: "github",
    connectorId: "6a1db3c9aaf496e3cd5d7a33",
    functionName: "getGitHubActivity",
    label: "GitHub",
    description: "Org members & commit activity",
    color: "bg-[#24292F]",
    textColor: "text-white",
    icon: "🐙",
  },
  {
    id: "notion",
    connectorId: "6a1db1a497d3b86fdf5003d4",
    functionName: "getNotionActivity",
    label: "Notion",
    description: "Workspace members & page edits",
    color: "bg-[#000000]",
    textColor: "text-white",
    icon: "📄",
  },
];

function ConnectorCard({ connector, onSynced }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | syncing | done | error
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Check if already connected by attempting to call the function
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const res = await base44.functions.invoke(connector.functionName, {});
      if (res.data?.success) {
        setStatus("done");
        setStats({ total: res.data.total, created: res.data.created, updated: res.data.updated });
        onSynced();
      }
    } catch {
      setStatus("idle");
    }
  };

  const handleConnect = async () => {
    setStatus("connecting");
    setErrorMsg("");
    try {
      const url = await base44.connectors.connectAppUser(connector.connectorId);
      const popup = window.open(url, "_blank");
      const timer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setStatus("syncing");
          try {
            const res = await base44.functions.invoke(connector.functionName, {});
            if (res.data?.success) {
              setStatus("done");
              setStats({ total: res.data.total, created: res.data.created, updated: res.data.updated });
              toast.success(`${connector.label}: synced ${res.data.total} real users`);
              onSynced();
            } else {
              setErrorMsg(res.data?.error || "Sync failed");
              setStatus("error");
            }
          } catch (err) {
            setErrorMsg(err.message || "Sync failed");
            setStatus("error");
          }
        }
      }, 500);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const handleResync = async () => {
    setStatus("syncing");
    try {
      const res = await base44.functions.invoke(connector.functionName, {});
      if (res.data?.success) {
        setStatus("done");
        setStats({ total: res.data.total, created: res.data.created, updated: res.data.updated });
        toast.success(`${connector.label}: re-synced ${res.data.total} users`);
        onSynced();
      } else {
        setErrorMsg(res.data?.error || "Sync failed");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${connector.color} flex items-center justify-center text-lg`}>
          {connector.icon}
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">{connector.label}</p>
          <p className="text-xs text-muted-foreground">{connector.description}</p>
        </div>
        {status === "done" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Live
          </span>
        )}
      </div>

      {/* Stats */}
      {status === "done" && stats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/40 rounded-lg p-2">
            <p className="text-lg font-extrabold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Total Users</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2">
            <p className="text-lg font-extrabold text-emerald-700">{stats.created}</p>
            <p className="text-[10px] text-muted-foreground">New</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="text-lg font-extrabold text-blue-700">{stats.updated}</p>
            <p className="text-[10px] text-muted-foreground">Updated</p>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Action */}
      <div>
        {(status === "idle" || status === "error") && (
          <Button size="sm" className="w-full gap-2" onClick={handleConnect}>
            <Plug className="w-3.5 h-3.5" />
            Connect {connector.label}
          </Button>
        )}
        {status === "connecting" && (
          <Button size="sm" className="w-full gap-2" disabled>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Waiting for auth...
          </Button>
        )}
        {status === "syncing" && (
          <Button size="sm" className="w-full gap-2" disabled>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Pulling real data...
          </Button>
        )}
        {status === "done" && (
          <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleResync}>
            <RefreshCw className="w-3.5 h-3.5" />
            Re-sync
          </Button>
        )}
      </div>
    </div>
  );
}

export default function LiveConnectPanel({ onSynced }) {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm">Live Data Connectors</h2>
        <span className="text-[10px] bg-primary text-white font-semibold px-2 py-0.5 rounded-full ml-1">NEW</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Connect your tools via OAuth to pull <strong>real per-user activity data</strong> — actual names, emails, last active dates, not estimates.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CONNECTORS.map((c) => (
          <ConnectorCard key={c.id} connector={c} onSynced={onSynced} />
        ))}
      </div>
    </div>
  );
}