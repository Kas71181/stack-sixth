import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Plug, RefreshCw, AlertCircle, Zap, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const CONNECTORS = [
  {
    id: "slack",
    connectorId: "6a1dba44349cdfe5f00d8fb7",
    functionName: "getSlackActivity",
    label: "Slack",
    description: "Real member list & activity signals",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png",
    setupUrl: "https://api.slack.com/apps",
    setupLabel: "Create Slack App →",
    scopes: "users:read, users:read.email, channels:read, team:read",
  },
  {
    id: "github",
    connectorId: "6a1db9e6a90dd35761465e22",
    functionName: "getGitHubActivity",
    label: "GitHub",
    description: "Org members & commit activity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
    setupUrl: "https://github.com/settings/developers",
    setupLabel: "Create GitHub OAuth App →",
    scopes: "read:user, user:email, read:org",
  },
  {
    id: "notion",
    connectorId: "6a1db8b6d0e9930c01976399",
    functionName: "getNotionActivity",
    label: "Notion",
    description: "Workspace members & page edits",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    setupUrl: "https://www.notion.so/my-integrations",
    setupLabel: "Create Notion Integration →",
    scopes: "read_content, read_users",
  },
];

function ConnectorCard({ connector, onSynced }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | syncing | done | error | needs_setup
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

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
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("No active connection") || msg.includes("404")) {
        setStatus("idle");
      } else if (msg.includes("credentials") || msg.includes("client_id") || msg.includes("OAuth")) {
        setStatus("needs_setup");
      } else {
        setStatus("idle");
      }
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
            const msg = err?.message || "Sync failed";
            if (msg.includes("credentials") || msg.includes("client_id")) {
              setStatus("needs_setup");
            } else {
              setErrorMsg(msg);
              setStatus("error");
            }
          }
        }
      }, 500);
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("credentials") || msg.includes("client_id") || msg.includes("not configured")) {
        setStatus("needs_setup");
      } else {
        setErrorMsg(msg);
        setStatus("error");
      }
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
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={connector.logo} alt={connector.label} className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{connector.label}</p>
          <p className="text-xs text-muted-foreground truncate">{connector.description}</p>
        </div>
        {status === "done" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">
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

      {/* Needs Setup */}
      {status === "needs_setup" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-800">OAuth credentials required</p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Add your <strong>{connector.label}</strong> OAuth Client ID & Secret in the Base44 Dashboard → Connectors.
          </p>
          <div className="text-[11px] text-amber-700">
            <span className="font-medium">Scopes needed:</span>{" "}
            <code className="bg-amber-100 px-1 rounded text-[10px]">{connector.scopes}</code>
          </div>
          <a
            href={connector.setupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
          >
            {connector.setupLabel} <ExternalLink className="w-3 h-3" />
          </a>
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
        {status === "needs_setup" && (
          <Button size="sm" variant="outline" className="w-full gap-2 text-amber-700 border-amber-300 hover:bg-amber-50" onClick={handleConnect}>
            <Plug className="w-3.5 h-3.5" />
            Try Connect Again
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
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm">Live Data Connectors</h2>
        <span className="text-[10px] bg-primary text-white font-semibold px-2 py-0.5 rounded-full ml-1">BETA</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Connect your tools via OAuth to pull <strong>real per-user activity data</strong>. Each user connects their own account — no shared credentials.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CONNECTORS.map((c) => (
          <ConnectorCard key={c.id} connector={c} onSynced={onSynced} />
        ))}
      </div>
    </div>
  );
}