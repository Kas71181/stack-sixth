import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Plug, RefreshCw, AlertCircle, Zap, ExternalLink, Key, PlayCircle, PencilLine, Users, Activity, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import DataPrivacyModal from "@/components/usage/DataPrivacyModal";

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
    type: "oauth",
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
    type: "oauth",
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
    type: "oauth",
  },
];

const API_KEY_CONNECTORS = [
  {
    id: "zoom",
    functionName: "getZoomActivity",
    label: "Zoom",
    description: "Meeting participants & usage",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Zoom_Logo_2022.svg/2560px-Zoom_Logo_2022.svg.png",
    setupUrl: "https://marketplace.zoom.us/develop/create",
    setupLabel: "Create Server-to-Server OAuth App →",
    fields: [
      { key: "api_key", label: "Client ID", placeholder: "Client ID" },
      { key: "client_secret", label: "Client Secret", placeholder: "Client Secret" },
      { key: "account_id", label: "Account ID", placeholder: "Account ID" },
    ],
  },
  {
    id: "apollo",
    functionName: "getApolloActivity",
    label: "Apollo.io",
    description: "Sales team activity & seat usage",
    logo: "https://assets-global.website-files.com/60b86da97e58f877a9d4e89f/60e5db46929e39b89bed2e96_apollo-logo.png",
    setupUrl: "https://app.apollo.io/#/settings/integrations/api",
    setupLabel: "Get Apollo API Key →",
    secretKey: "APOLLO_API_KEY",
    placeholder: "Apollo.io API key",
  },
  {
    id: "salesforce",
    functionName: "getSalesforceActivity",
    label: "Salesforce",
    description: "CRM users & login activity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/2560px-Salesforce.com_logo.svg.png",
    setupUrl: "https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm",
    setupLabel: "Create Connected App →",
    secretKey: "SALESFORCE_CLIENT_ID",
    placeholder: "Configure secrets in Dashboard settings",
    multiSecret: true,
  },
  {
    id: "hubspot",
    functionName: "getHubSpotActivity",
    label: "HubSpot",
    description: "CRM users & engagement activity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HubSpot_Logo.svg/2560px-HubSpot_Logo.svg.png",
    setupUrl: "https://app.hubspot.com/private-apps",
    setupLabel: "Create HubSpot Private App →",
    fields: [
      { key: "api_key", label: "Private App Token", placeholder: "pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { key: "client_id", label: "Client ID (optional)", placeholder: "OAuth Client ID" },
      { key: "portal_id", label: "Portal ID (Hub ID)", placeholder: "e.g. 12345678" },
    ],
  },
  {
    id: "quickbooks",
    functionName: "getQuickBooksActivity",
    label: "QuickBooks",
    description: "Employee list & account activity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Intuit_QuickBooks_logo.svg/2560px-Intuit_QuickBooks_logo.svg.png",
    setupUrl: "https://developer.intuit.com/app/developer/playground",
    setupLabel: "Generate Access Token (Intuit Playground) →",
    fields: [
      { key: "api_key", label: "Access Token", placeholder: "eyJhbGci... (expires in ~1 hour)" },
      { key: "realm_id", label: "Company ID (Realm ID)", placeholder: "e.g. 9341452234567890" },
    ],
  },
  {
    id: "bamboohr",
    functionName: "getBambooHRHeadcount",
    label: "BambooHR",
    description: "True headcount — employee list & departments",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/BambooHR_logo.svg/2560px-BambooHR_logo.svg.png",
    setupUrl: "https://app.bamboohr.com/settings/account/apikeys",
    setupLabel: "Generate BambooHR API Key →",
    hrisTag: true,
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Your BambooHR API key" },
      { key: "subdomain", label: "Subdomain", placeholder: "e.g. 'acme' for acme.bamboohr.com" },
    ],
  },
  {
    id: "google_workspace",
    functionName: "getGoogleWorkspaceApps",
    label: "Google Workspace",
    description: "Auto-discover all OAuth apps org-wide",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/2048px-Google_%22G%22_Logo.svg.png",
    setupUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    setupLabel: "Create Service Account →",
    discoveryTag: true,
    fields: [
      { key: "api_key", label: "Service Account JSON", placeholder: '{"type":"service_account","project_id":"..."}' },
      { key: "admin_email", label: "Admin Email", placeholder: "admin@yourcompany.com" },
    ],
  },
];

function ConnectorCard({ connector, onSynced, inStack = false }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | syncing | done | error | needs_setup
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);

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
    <div className={`bg-card border rounded-2xl p-5 flex flex-col gap-4 ${inStack ? "border-primary/30 ring-1 ring-primary/10" : "border-border/60"}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={connector.logo} alt={connector.label} className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-sm">{connector.label}</p>
            {inStack && <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">IN STACK</span>}
          </div>
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
          <Button size="sm" className="w-full gap-2" onClick={() => setShowPrivacy(true)}>
            <Plug className="w-3.5 h-3.5" />
            Connect {connector.label}
          </Button>
        )}
        {showPrivacy && (
          <DataPrivacyModal
            connector={connector}
            onConfirm={() => { setShowPrivacy(false); handleConnect(); }}
            onCancel={() => setShowPrivacy(false)}
          />
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

function ApiKeyConnectorCard({ connector, onSynced, inStack = false }) {
  const [status, setStatus] = useState("idle"); // idle | entering | saving | syncing | done | error
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [fields, setFields] = useState({});

  useEffect(() => {
    checkAndSync();
  }, []);

  const checkAndSync = async () => {
    setStatus("syncing");
    try {
      const res = await base44.functions.invoke(connector.functionName, {});
      if (res.data?.success) {
        setStatus("done");
        setStats({ total: res.data.total, created: res.data.created, updated: res.data.updated });
        onSynced();
      } else if (res.data?.not_configured) {
        setStatus("idle");
      } else {
        setErrorMsg(res.data?.error || "Sync failed");
        setStatus("error");
        setShowForm(true);
      }
    } catch (err) {
      setStatus("idle");
    }
  };

  const handleSync = async () => {
    setStatus("syncing");
    setErrorMsg("");
    try {
      const res = await base44.functions.invoke(connector.functionName, {});
      if (res.data?.success) {
        setStatus("done");
        setStats({ total: res.data.total, created: res.data.created, updated: res.data.updated });
        toast.success(`${connector.label}: synced ${res.data.total} users`);
        onSynced();
      } else if (res.data?.not_configured) {
        setStatus("idle");
        setShowForm(true);
      } else {
        setErrorMsg(res.data?.error || "Sync failed");
        setStatus("error");
        setShowForm(true);
      }
    } catch (err) {
      setErrorMsg(err?.message || "Sync failed");
      setStatus("error");
      setShowForm(true);
    }
  };

  const handleSaveAndSync = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      let saveRes;
      if (connector.fields) {
        // Custom fields (e.g. QuickBooks): first field is api_key, rest go into extra_fields
        const [first, ...rest] = connector.fields;
        const extra = {};
        rest.forEach((f) => { extra[f.key] = fields[f.key] || ""; });
        saveRes = await base44.functions.invoke("saveApiCredential", {
          service: connector.id,
          api_key: fields[first.key] || "",
          extra_fields: extra,
        });
      } else if (connector.multiSecret) {
        saveRes = await base44.functions.invoke("saveApiCredential", {
          service: connector.id,
          api_key: fields.client_id || "",
          extra_fields: {
            client_secret: fields.client_secret || "",
            instance_url: fields.instance_url || "",
          },
        });
      } else {
        saveRes = await base44.functions.invoke("saveApiCredential", {
          service: connector.id,
          api_key: fields.api_key || "",
        });
      }
      if (!saveRes.data?.success) {
        setErrorMsg(saveRes.data?.error || "Failed to save credentials");
        setStatus("error");
        return;
      }
      setShowForm(false);
      // Now sync
      setStatus("syncing");
      const res = await base44.functions.invoke(connector.functionName, {});
      if (res.data?.success) {
        setStatus("done");
        setStats({ total: res.data.total, created: res.data.created, updated: res.data.updated });
        toast.success(`${connector.label}: synced ${res.data.total} users`);
        onSynced();
      } else {
        setErrorMsg(res.data?.error || "Sync failed — check your credentials");
        setStatus("error");
        setShowForm(true);
      }
    } catch (err) {
      setErrorMsg(err?.message || "Failed to save credentials");
      setStatus("error");
    }
  };

  return (
    <div className={`bg-card border rounded-2xl p-5 flex flex-col gap-4 ${inStack ? "border-primary/30 ring-1 ring-primary/10" : "border-border/60"}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={connector.logo} alt={connector.label} className="w-7 h-7 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-sm">{connector.label}</p>
            {inStack && <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">IN STACK</span>}
          </div>
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

      {/* In-app key form */}
      {showForm && status !== "done" && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Key className="w-3 h-3 text-slate-600" />
            <p className="text-xs font-semibold text-slate-700">Enter your {connector.label} credentials</p>
          </div>
          <a href={connector.setupUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline underline-offset-2 hover:opacity-80">
            {connector.setupLabel} <ExternalLink className="w-3 h-3" />
          </a>

          {connector.fields ? (
            <div className="space-y-2 mt-2">
              {connector.fields.map((f) => (
                <Input
                  key={f.key}
                  type={f.key.toLowerCase().includes("token") || f.key.toLowerCase().includes("secret") ? "password" : "text"}
                  placeholder={f.placeholder}
                  value={fields[f.key] || ""}
                  onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="text-xs h-8"
                />
              ))}
            </div>
          ) : connector.multiSecret ? (
            <div className="space-y-2 mt-2">
              <Input
                placeholder="Client ID"
                value={fields.client_id || ""}
                onChange={(e) => setFields((f) => ({ ...f, client_id: e.target.value }))}
                className="text-xs h-8"
              />
              <Input
                type="password"
                placeholder="Client Secret"
                value={fields.client_secret || ""}
                onChange={(e) => setFields((f) => ({ ...f, client_secret: e.target.value }))}
                className="text-xs h-8"
              />
              <Input
                placeholder="Instance URL (https://...)"
                value={fields.instance_url || ""}
                onChange={(e) => setFields((f) => ({ ...f, instance_url: e.target.value }))}
                className="text-xs h-8"
              />
            </div>
          ) : (
            <Input
              type="password"
              placeholder={connector.placeholder}
              value={fields.api_key || ""}
              onChange={(e) => setFields((f) => ({ ...f, api_key: e.target.value }))}
              className="text-xs h-8 mt-2"
            />
          )}
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!showForm && status !== "done" && (status === "idle" || status === "error") && (
          <Button size="sm" className="w-full gap-2" onClick={() => setShowForm(true)}>
            <Key className="w-3.5 h-3.5" />
            Connect {connector.label}
          </Button>
        )}
        {showForm && status !== "syncing" && status !== "saving" && (
          <>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="sm" className="flex-1 gap-2" onClick={handleSaveAndSync}>
              <Zap className="w-3.5 h-3.5" />
              Save & Sync
            </Button>
          </>
        )}
        {(status === "syncing" || status === "saving") && (
          <Button size="sm" className="w-full gap-2" disabled>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {status === "saving" ? "Saving..." : "Pulling data..."}
          </Button>
        )}
        {status === "done" && (
          <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleSync}>
            <RefreshCw className="w-3.5 h-3.5" />
            Re-sync
          </Button>
        )}
      </div>
    </div>
  );
}

function ManualToolCard({ tool, onSynced }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState(null);
  const [fields, setFields] = useState({ active_users: "", licensed_seats: "", activity_score: "", license_cost_per_month: "" });

  useEffect(() => {
    base44.entities.UserActivity.filter({ tool_name: tool.tool_name, user_email: "aggregate@placeholder" })
      .then((res) => { if (res?.[0]) setActivity(res[0]); })
      .catch(() => {});
  }, [tool.tool_name]);

  const handleSave = async () => {
    setSaving(true);
    const activeUsers = parseInt(fields.active_users) || 0;
    const licensedSeats = parseInt(fields.licensed_seats) || 0;
    const score = parseInt(fields.activity_score) || (licensedSeats > 0 ? Math.round((activeUsers / licensedSeats) * 100) : 0);
    const status = score >= 70 ? "Active" : score >= 30 ? "Dormant" : "Inactive";
    const payload = {
      tool_name: tool.tool_name,
      user_email: "aggregate@placeholder",
      user_name: `${tool.tool_name} (manual)`,
      activity_score: score,
      status,
      source: "manual",
      license_cost_per_month: parseFloat(fields.license_cost_per_month) || tool.monthly_cost || 0,
      days_active_last_30: Math.round(score * 0.22),
      wasted_cost_flag: score < 40,
    };
    if (activity?.id) {
      await base44.entities.UserActivity.update(activity.id, payload);
    } else {
      await base44.entities.UserActivity.create(payload);
    }
    setActivity(payload);
    setExpanded(false);
    setSaving(false);
    toast.success(`${tool.tool_name} stats saved`);
    onSynced();
  };

  const scoreColor = activity?.activity_score >= 70 ? "text-emerald-600" : activity?.activity_score >= 30 ? "text-amber-600" : "text-red-500";

  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden transition-all">
      <button
        className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
          {tool.tool_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{tool.tool_name}</p>
          {activity ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold ${scoreColor}`}>{activity.activity_score}% health</span>
              <span className="text-[10px] text-muted-foreground">· {activity.status}</span>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">Click to enter usage data</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {activity && <span className="text-[9px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded-full">MANUAL</span>}
          <PencilLine className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-3 py-3 space-y-2 bg-muted/20">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2">Enter usage stats for {tool.tool_name}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1"><Users className="w-3 h-3" /> Active Users</label>
              <Input type="number" min={0} placeholder="e.g. 12" value={fields.active_users}
                onChange={(e) => setFields((f) => ({ ...f, active_users: e.target.value }))} className="h-7 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1"><Users className="w-3 h-3" /> Licensed Seats</label>
              <Input type="number" min={0} placeholder="e.g. 20" value={fields.licensed_seats}
                onChange={(e) => setFields((f) => ({ ...f, licensed_seats: e.target.value }))} className="h-7 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1"><Activity className="w-3 h-3" /> Health Score (0–100)</label>
              <Input type="number" min={0} max={100} placeholder="Auto-calc if blank" value={fields.activity_score}
                onChange={(e) => setFields((f) => ({ ...f, activity_score: e.target.value }))} className="h-7 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1"><TrendingUp className="w-3 h-3" /> Cost/Month ($)</label>
              <Input type="number" min={0} placeholder={tool.monthly_cost || "e.g. 500"} value={fields.license_cost_per_month}
                onChange={(e) => setFields((f) => ({ ...f, license_cost_per_month: e.target.value }))} className="h-7 text-xs" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveConnectPanel({ onSynced, integrations = [] }) {
  const [syncingAll, setSyncingAll] = useState(false);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    const allFunctions = [
      ...CONNECTORS.map((c) => c.functionName),
      ...API_KEY_CONNECTORS.map((c) => c.functionName),
    ];
    let successCount = 0;
    let totalUsers = 0;
    const results = await Promise.allSettled(
      allFunctions.map((fn) => base44.functions.invoke(fn, {}))
    );
    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value?.data?.success) {
        successCount++;
        totalUsers += r.value.data.total || 0;
      }
    });
    setSyncingAll(false);
    if (successCount > 0) {
      toast.success(`Synced ${totalUsers} users across ${successCount} connected tool(s)`);
      onSynced();
    } else {
      toast.info("No connected tools responded — connect at least one tool below first.");
    }
  };

  const stackNames = integrations.map((i) => i.tool_name.toLowerCase().trim());

  // Check if a stack tool name fuzzy-matches a connector (partial match either direction)
  const matchesConnector = (toolName, connector) => {
    const t = toolName.toLowerCase().trim();
    const cId = connector.id.toLowerCase();
    const cLabel = connector.label.toLowerCase();
    return t === cId || t === cLabel || t.includes(cId) || cId.includes(t) || t.includes(cLabel) || cLabel.includes(t);
  };

  const seenToolNames = new Set();
  const unmappedStackTools = integrations.filter((i) => {
    const key = i.tool_name.toLowerCase().trim();
    if (seenToolNames.has(key)) return false;
    if (CONNECTORS.some((c) => matchesConnector(i.tool_name, c))) return false;
    if (API_KEY_CONNECTORS.some((c) => matchesConnector(i.tool_name, c))) return false;
    seenToolNames.add(key);
    return true;
  });

  return (
    <div className="bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm">Live Data Connectors</h2>
          <span className="text-[10px] bg-primary text-white font-semibold px-2 py-0.5 rounded-full ml-1">BETA</span>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5" onClick={handleSyncAll} disabled={syncingAll}>
          {syncingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
          {syncingAll ? "Syncing all…" : "Sync All Connected"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Connect your tools to pull <strong>real per-user activity data</strong> into your audit.
        {integrations.length > 0 && <span className="text-primary font-medium"> Showing connectors for your {integrations.length}-tool stack.</span>}
      </p>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">OAuth — One-click connect</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {CONNECTORS.map((c) => (
          <ConnectorCard key={c.id} connector={c} onSynced={onSynced} inStack={integrations.some((i) => matchesConnector(i.tool_name, c))} />
        ))}
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">API Key — Requires setup</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {API_KEY_CONNECTORS.filter((c) => !c.hrisTag && !c.discoveryTag).map((c) => (
          <ApiKeyConnectorCard key={c.id} connector={c} onSynced={onSynced} inStack={integrations.some((i) => matchesConnector(i.tool_name, c))} />
        ))}
      </div>

      {/* HRIS + Passive Discovery — competitive parity section */}
      <div className="mt-5 pt-5 border-t border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">HRIS & Passive Discovery</p>
          <span className="text-[9px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 px-2 py-0.5 rounded-full">ENTERPRISE TIER</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          <strong>BambooHR</strong> gives true headcount for accurate seat-vs-employee analysis. <strong>Google Workspace</strong> auto-discovers every OAuth app installed across your org — no browser extension needed.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {API_KEY_CONNECTORS.filter((c) => c.hrisTag || c.discoveryTag).map((c) => (
            <ApiKeyConnectorCard key={c.id} connector={c} onSynced={onSynced} inStack={integrations.some((i) => matchesConnector(i.tool_name, c))} />
          ))}
        </div>
      </div>

      {/* Stack tools without any connector */}
      {unmappedStackTools.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From your stack — enter usage manually</p>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            These tools don't have a live data connector yet. Click any card to enter usage stats manually — they'll show up in your Usage Health dashboard.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {unmappedStackTools.map((tool) => (
              <ManualToolCard key={tool.id} tool={tool} onSynced={onSynced} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}