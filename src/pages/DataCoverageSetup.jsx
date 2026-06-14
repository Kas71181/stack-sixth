import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, Loader2, Plug, RefreshCw, AlertCircle, Zap,
  ExternalLink, Key, ArrowRight, ArrowLeft, BarChart3, Shield,
  TrendingUp, Users, Activity, PencilLine, X
} from "lucide-react";
import { toast } from "sonner";

// ── Connector definitions (mirrors LiveConnectPanel) ──────────────────────────
const OAUTH_CONNECTORS = [
  {
    id: "slack", connectorId: "6a1dba44349cdfe5f00d8fb7", functionName: "getSlackActivity",
    label: "Slack", description: "Real member list & activity signals", coverage: 20,
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png",
    setupUrl: "https://api.slack.com/apps", setupLabel: "Create Slack App →",
    scopes: "users:read, users:read.email, channels:read, team:read",
  },
  {
    id: "github", connectorId: "6a1db9e6a90dd35761465e22", functionName: "getGitHubActivity",
    label: "GitHub", description: "Org members & commit activity", coverage: 15,
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
    setupUrl: "https://github.com/settings/developers", setupLabel: "Create GitHub OAuth App →",
    scopes: "read:user, user:email, read:org",
  },
  {
    id: "notion", connectorId: "6a1db8b6d0e9930c01976399", functionName: "getNotionActivity",
    label: "Notion", description: "Workspace members & page edits", coverage: 15,
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    setupUrl: "https://www.notion.so/my-integrations", setupLabel: "Create Notion Integration →",
    scopes: "read_content, read_users",
  },
];

const API_KEY_CONNECTORS = [
  {
    id: "hubspot", functionName: "getHubSpotActivity", label: "HubSpot", coverage: 20,
    description: "CRM users & engagement activity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HubSpot_Logo.svg/2560px-HubSpot_Logo.svg.png",
    setupUrl: "https://app.hubspot.com/private-apps", setupLabel: "Create HubSpot Private App →",
    fields: [
      { key: "api_key", label: "Private App Token", placeholder: "pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { key: "client_id", label: "Client ID (optional)", placeholder: "OAuth Client ID" },
      { key: "portal_id", label: "Portal ID (Hub ID)", placeholder: "e.g. 12345678" },
    ],
  },
  {
    id: "zoom", functionName: "getZoomActivity", label: "Zoom", coverage: 15,
    description: "Meeting participants & usage",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Zoom_Logo_2022.svg/2560px-Zoom_Logo_2022.svg.png",
    setupUrl: "https://marketplace.zoom.us/develop/create", setupLabel: "Create Server-to-Server OAuth App →",
    fields: [
      { key: "api_key", label: "Client ID", placeholder: "Client ID" },
      { key: "client_secret", label: "Client Secret", placeholder: "Client Secret" },
      { key: "account_id", label: "Account ID", placeholder: "Account ID" },
    ],
  },
  {
    id: "salesforce", functionName: "getSalesforceActivity", label: "Salesforce", coverage: 20,
    description: "CRM users & login activity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/2560px-Salesforce.com_logo.svg.png",
    setupUrl: "https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm", setupLabel: "Create Connected App →",
    multiSecret: true,
  },
  {
    id: "apollo", functionName: "getApolloActivity", label: "Apollo.io", coverage: 10,
    description: "Sales team activity & seat usage",
    logo: "https://assets-global.website-files.com/60b86da97e58f877a9d4e89f/60e5db46929e39b89bed2e96_apollo-logo.png",
    setupUrl: "https://app.apollo.io/#/settings/integrations/api", setupLabel: "Get Apollo API Key →",
    placeholder: "Apollo.io API key",
  },
];

// ── Coverage meter ────────────────────────────────────────────────────────────
function CoverageMeter({ pct, size = "lg" }) {
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#3b82f6";
  const r = size === "lg" ? 54 : 36;
  const stroke = size === "lg" ? 8 : 6;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg
      width={size === "lg" ? 140 : 90}
      height={size === "lg" ? 140 : 90}
      className="rotate-[-90deg]"
    >
      <circle cx={size === "lg" ? 70 : 45} cy={size === "lg" ? 70 : 45} r={r}
        fill="none" stroke="currentColor" strokeWidth={stroke}
        className="text-muted/40" />
      <circle cx={size === "lg" ? 70 : 45} cy={size === "lg" ? 70 : 45} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

// ── OAuth connector row ────────────────────────────────────────────────────────
function OAuthRow({ connector, onConnected }) {
  const [status, setStatus] = useState("idle");
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    base44.functions.invoke(connector.functionName, {})
      .then((res) => {
        if (res.data?.success) {
          setStatus("done");
          setStats({ total: res.data.total });
          onConnected(connector.id, res.data.total);
        }
      })
      .catch(() => {});
  }, []);

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
              setStats({ total: res.data.total });
              toast.success(`${connector.label}: synced ${res.data.total} users`);
              onConnected(connector.id, res.data.total);
            } else {
              setErrorMsg(res.data?.error || "Sync failed");
              setStatus("error");
            }
          } catch (err) {
            setErrorMsg(err?.message || "Sync failed");
            setStatus("error");
          }
        }
      }, 500);
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("credentials") || msg.includes("client_id") || msg.includes("not configured")) {
        setErrorMsg("OAuth app not configured in Base44 dashboard yet.");
      } else {
        setErrorMsg(msg);
      }
      setStatus("error");
    }
  };

  return (
    <div className={`glass-card p-4 flex items-center gap-4 ${status === "done" ? "border-emerald-400/40 ring-1 ring-emerald-400/20" : ""}`}>
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        <img src={connector.logo} alt={connector.label} className="w-7 h-7 object-contain" onError={(e) => { e.target.style.display = "none"; }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">{connector.label}</p>
          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">+{connector.coverage}% coverage</span>
        </div>
        <p className="text-xs text-muted-foreground">{connector.description}</p>
        {status === "done" && stats && (
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">✓ {stats.total} users synced</p>
        )}
        {status === "error" && <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>}
      </div>
      <div className="flex-shrink-0">
        {status === "idle" && (
          <Button size="sm" onClick={handleConnect} className="gap-1.5">
            <Plug className="w-3.5 h-3.5" /> Connect
          </Button>
        )}
        {(status === "connecting" || status === "syncing") && (
          <Button size="sm" disabled className="gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {status === "connecting" ? "Authorizing…" : "Syncing…"}
          </Button>
        )}
        {status === "done" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/40 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Live
          </span>
        )}
        {status === "error" && (
          <Button size="sm" variant="outline" onClick={handleConnect} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}

// ── API key connector row ──────────────────────────────────────────────────────
function ApiKeyRow({ connector, onConnected }) {
  const [status, setStatus] = useState("idle");
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [fields, setFields] = useState({});

  useEffect(() => {
    base44.functions.invoke(connector.functionName, {})
      .then((res) => {
        if (res.data?.success) {
          setStatus("done");
          setStats({ total: res.data.total });
          onConnected(connector.id, res.data.total);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAndSync = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      let savePayload;
      if (connector.fields) {
        const [first, ...rest] = connector.fields;
        const extra = {};
        rest.forEach((f) => { extra[f.key] = fields[f.key] || ""; });
        savePayload = { service: connector.id, api_key: fields[first.key] || "", extra_fields: extra };
      } else if (connector.multiSecret) {
        savePayload = { service: connector.id, api_key: fields.client_id || "", extra_fields: { client_secret: fields.client_secret || "", instance_url: fields.instance_url || "" } };
      } else {
        savePayload = { service: connector.id, api_key: fields.api_key || "" };
      }
      const saveRes = await base44.functions.invoke("saveApiCredential", savePayload);
      if (!saveRes.data?.success) { setErrorMsg(saveRes.data?.error || "Save failed"); setStatus("error"); return; }
      setShowForm(false);
      setStatus("syncing");
      const res = await base44.functions.invoke(connector.functionName, {});
      if (res.data?.success) {
        setStatus("done");
        setStats({ total: res.data.total });
        toast.success(`${connector.label}: synced ${res.data.total} users`);
        onConnected(connector.id, res.data.total);
      } else {
        setErrorMsg(res.data?.error || "Sync failed — check your credentials");
        setStatus("error");
        setShowForm(true);
      }
    } catch (err) {
      setErrorMsg(err?.message || "Failed");
      setStatus("error");
    }
  };

  return (
    <div className={`glass-card p-4 flex flex-col gap-3 ${status === "done" ? "border-emerald-400/40 ring-1 ring-emerald-400/20" : ""}`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={connector.logo} alt={connector.label} className="w-7 h-7 object-contain" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{connector.label}</p>
            <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">+{connector.coverage}% coverage</span>
          </div>
          <p className="text-xs text-muted-foreground">{connector.description}</p>
          {status === "done" && stats && <p className="text-xs text-emerald-600 font-semibold mt-0.5">✓ {stats.total} users synced</p>}
          {status === "error" && <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>}
        </div>
        <div className="flex-shrink-0">
          {(status === "idle" || status === "error") && !showForm && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5">
              <Key className="w-3.5 h-3.5" /> Connect
            </Button>
          )}
          {(status === "syncing" || status === "saving") && (
            <Button size="sm" disabled className="gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {status === "saving" ? "Saving…" : "Syncing…"}
            </Button>
          )}
          {status === "done" && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/40 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Live
            </span>
          )}
        </div>
      </div>

      {showForm && status !== "done" && (
        <div className="glass-subtle p-3 space-y-2 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Key className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs font-semibold">Enter {connector.label} credentials</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
          <a href={connector.setupUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary underline underline-offset-2">
            {connector.setupLabel} <ExternalLink className="w-3 h-3" />
          </a>
          {connector.fields ? (
            <div className="space-y-1.5 mt-1">
              {connector.fields.map((f) => (
                <Input key={f.key} type={f.key.toLowerCase().includes("secret") || f.key.toLowerCase().includes("token") ? "password" : "text"}
                  placeholder={f.placeholder} value={fields[f.key] || ""}
                  onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))} className="text-xs h-8" />
              ))}
            </div>
          ) : connector.multiSecret ? (
            <div className="space-y-1.5 mt-1">
              <Input placeholder="Client ID" value={fields.client_id || ""} onChange={(e) => setFields((f) => ({ ...f, client_id: e.target.value }))} className="text-xs h-8" />
              <Input type="password" placeholder="Client Secret" value={fields.client_secret || ""} onChange={(e) => setFields((f) => ({ ...f, client_secret: e.target.value }))} className="text-xs h-8" />
              <Input placeholder="Instance URL (https://...)" value={fields.instance_url || ""} onChange={(e) => setFields((f) => ({ ...f, instance_url: e.target.value }))} className="text-xs h-8" />
            </div>
          ) : (
            <Input type="password" placeholder={connector.placeholder} value={fields.api_key || ""}
              onChange={(e) => setFields((f) => ({ ...f, api_key: e.target.value }))} className="text-xs h-8 mt-1" />
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={handleSaveAndSync}>
              <Zap className="w-3 h-3" /> Save & Sync
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step components ────────────────────────────────────────────────────────────
const STEPS = [
  { id: "overview", label: "Coverage Overview" },
  { id: "oauth", label: "One-Click Connectors" },
  { id: "apikey", label: "API Key Connectors" },
  { id: "done", label: "You're Set" },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {STEPS.map((step, i) => {
        const idx = STEPS.findIndex((s) => s.id === current);
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.id} className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${active ? "bg-primary text-white shadow-md shadow-primary/30" : done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
              {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
            {i < STEPS.length - 1 && <div className={`w-6 h-px ${done ? "bg-emerald-400" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DataCoverageSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState("overview");
  const [connectedIds, setConnectedIds] = useState({});
  const [integrations, setIntegrations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.SaasIntegration.list(),
      base44.entities.UserActivity.list(),
    ]).then(([ints, acts]) => {
      setIntegrations(ints);
      setActivities(acts);
    }).finally(() => setLoadingData(false));
  }, []);

  const handleConnected = (id, total) => {
    setConnectedIds((prev) => ({ ...prev, [id]: total }));
  };

  // Coverage calc: live activities / total tools
  const totalTools = integrations.length || 1;
  const liveTools = [...new Set(activities.filter((a) => a.source === "live").map((a) => a.tool_name))].length;
  const baseCoverage = Math.round((liveTools / totalTools) * 100);
  const additionalFromWizard = Object.keys(connectedIds).length * 15;
  const liveCoverage = Math.min(100, baseCoverage + additionalFromWizard);

  const connectedCount = Object.keys(connectedIds).length;
  const allConnectors = [...OAUTH_CONNECTORS, ...API_KEY_CONNECTORS];
  const remainingConnectors = allConnectors.filter((c) => !connectedIds[c.id]);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h1 className="text-2xl font-bold">Data Coverage Setup</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect your tools to replace estimates with live data and unlock accurate savings analysis.
          </p>
        </div>

        <StepIndicator current={step} />

        {/* ── Step: Overview ─────────────────────────────────────────── */}
        {step === "overview" && (
          <div className="space-y-6">
            {/* Coverage meter */}
            <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative flex-shrink-0">
                <CoverageMeter pct={liveCoverage} size="lg" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold tabular-nums">{liveCoverage}%</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Live Coverage</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-bold text-lg">{liveCoverage >= 80 ? "Excellent coverage!" : liveCoverage >= 50 ? "Good start — keep going" : "Mostly estimates right now"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {liveTools} of {integrations.length} tools have live data. Connect more integrations to make your savings recommendations defensible.
                  </p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: "Estimated data only", icon: "⚠️", pct: "0–40%", desc: "Directional insights, low confidence" },
                    { label: "Partial live coverage", icon: "📊", pct: "40–80%", desc: "Good recommendations, some gaps" },
                    { label: "High live coverage", icon: "✅", pct: "80%+", desc: "Defensible savings numbers" },
                  ].map((tier) => (
                    <div key={tier.pct} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs
                      ${liveCoverage >= parseInt(tier.pct) ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "text-muted-foreground bg-muted/40"}`}>
                      <span>{tier.icon}</span>
                      <span className="font-semibold w-16">{tier.pct}</span>
                      <span>{tier.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What you'll gain */}
            <div className="glass-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What live data unlocks</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { IconComp: BarChart3, label: "Accurate CPAU", desc: "Real cost-per-active-user vs. seat cost guesses" },
                  { IconComp: Shield, label: "Renewal Risk", desc: "Flag tools with low utilization before auto-renew" },
                  { IconComp: TrendingUp, label: "Savings ROI", desc: "Specific dollar amounts you can present to leadership" },
                ].map(({ IconComp, label, desc }) => (
                  <div key={label} className="glass-subtle p-3 rounded-xl">
                    <IconComp className="w-4 h-4 text-primary mb-1.5" />
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full gap-2" onClick={() => setStep("oauth")}>
              Start Connecting Tools <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── Step: OAuth ─────────────────────────────────────────────── */}
        {step === "oauth" && (
          <div className="space-y-4">
            <div className="glass-card p-4 flex items-center gap-3 mb-2">
              <Plug className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">One-Click OAuth Connectors</p>
                <p className="text-xs text-muted-foreground">These connect in seconds — just click and authorize in the popup.</p>
              </div>
            </div>

            {OAUTH_CONNECTORS.map((c) => (
              <OAuthRow key={c.id} connector={c} onConnected={handleConnected} />
            ))}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep("overview")}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button className="flex-1 gap-2" onClick={() => setStep("apikey")}>
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: API Keys ───────────────────────────────────────────── */}
        {step === "apikey" && (
          <div className="space-y-4">
            <div className="glass-card p-4 flex items-center gap-3 mb-2">
              <Key className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">API Key Connectors</p>
                <p className="text-xs text-muted-foreground">These require a token from each vendor — follow the setup link to generate one.</p>
              </div>
            </div>

            {API_KEY_CONNECTORS.map((c) => (
              <ApiKeyRow key={c.id} connector={c} onConnected={handleConnected} />
            ))}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep("oauth")}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button className="flex-1 gap-2" onClick={() => setStep("done")}>
                Finish Setup <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Done ───────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="space-y-6">
            <div className="glass-card p-8 flex flex-col items-center text-center gap-4">
              <div className="relative">
                <CoverageMeter pct={liveCoverage} size="lg" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold tabular-nums">{liveCoverage}%</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Live</span>
                </div>
              </div>
              <div>
                <p className="text-xl font-bold mt-1">
                  {liveCoverage >= 80 ? "🎉 80%+ Live Coverage Achieved!" : connectedCount > 0 ? `${connectedCount} connector${connectedCount > 1 ? "s" : ""} connected` : "Setup complete"}
                </p>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
                  {liveCoverage >= 80
                    ? "Your savings recommendations are now based on real data. Head to Usage Analytics to see the results."
                    : "Your coverage is improving. Connect more tools anytime from the IT Dashboard to reach 80%+."}
                </p>
              </div>

              {remainingConnectors.length > 0 && liveCoverage < 80 && (
                <div className="w-full glass-subtle rounded-xl p-3 text-left">
                  <p className="text-xs font-semibold mb-2">Still to connect for 80%+ coverage:</p>
                  <div className="flex flex-wrap gap-2">
                    {remainingConnectors.slice(0, 4).map((c) => (
                      <span key={c.id} className="text-[11px] bg-muted/60 px-2 py-1 rounded-full text-muted-foreground">
                        {c.label} (+{c.coverage}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep("apikey")}>
                <ArrowLeft className="w-4 h-4" /> Connect More
              </Button>
              <Button className="flex-1 gap-2" onClick={() => navigate("/it-dashboard")}>
                View Usage Analytics <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}