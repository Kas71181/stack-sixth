import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, Plug, Upload, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OAUTH_CONNECTORS = [
  {
    id: "slack",
    connectorId: "6a1dba44349cdfe5f00d8fb7",
    functionName: "getSlackActivity",
    label: "Slack",
    desc: "Members & activity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png",
  },
  {
    id: "github",
    connectorId: "6a1db9e6a90dd35761465e22",
    functionName: "getGitHubActivity",
    label: "GitHub",
    desc: "Org members & usage",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
  },
  {
    id: "notion",
    connectorId: "6a1db8b6d0e9930c01976399",
    functionName: "getNotionActivity",
    label: "Notion",
    desc: "Workspace members",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
  },
];

export default function StepConnectFirst({ onToolsFound, toolsFound }) {
  const [connectedTools, setConnectedTools] = useState({});
  const [stripeKey, setStripeKey] = useState("");
  const [stripeStatus, setStripeStatus] = useState("idle"); // idle | loading | done | error
  const [stripeTools, setStripeTools] = useState([]);

  const handleOAuthConnect = async (connector) => {
    setConnectedTools((c) => ({ ...c, [connector.id]: "connecting" }));
    try {
      const url = await base44.connectors.connectAppUser(connector.connectorId);
      const popup = window.open(url, "_blank");
      const timer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setConnectedTools((c) => ({ ...c, [connector.id]: "syncing" }));
          try {
            const res = await base44.functions.invoke(connector.functionName, {});
            if (res.data?.success) {
              setConnectedTools((c) => ({ ...c, [connector.id]: "done" }));
              onToolsFound((prev) => ({ ...prev, [connector.id]: res.data.total || 0 }));
            } else {
              setConnectedTools((c) => ({ ...c, [connector.id]: "error" }));
            }
          } catch {
            setConnectedTools((c) => ({ ...c, [connector.id]: "error" }));
          }
        }
      }, 500);
    } catch {
      setConnectedTools((c) => ({ ...c, [connector.id]: "error" }));
    }
  };

  const handleStripeConnect = async () => {
    if (!stripeKey.trim()) return;
    setStripeStatus("loading");
    try {
      const existing = await base44.entities.ApiCredential.filter({ service: 'stripe' });
      if (existing[0]) {
        await base44.entities.ApiCredential.update(existing[0].id, { api_key: stripeKey });
      } else {
        await base44.entities.ApiCredential.create({ service: 'stripe', api_key: stripeKey });
      }
      const res = await base44.functions.invoke("getStripeSubscriptions", {});
      const tools = res.data?.tools || [];
      setStripeTools(tools);
      setStripeStatus("done");
      onToolsFound((prev) => ({ ...prev, stripe: tools.length }));
    } catch {
      setStripeStatus("error");
    }
  };

  const totalConnected = Object.values(toolsFound || {}).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold mb-0.5">Connect your tools — we'll do the rest</p>
        <p className="text-xs text-muted-foreground">
          One-click connect to instantly pull your real software spend and usage. No manual entry needed.
        </p>
      </div>

      {totalConnected > 0 && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">
            {totalConnected} users pulled across {Object.keys(toolsFound).length} tool{Object.keys(toolsFound).length > 1 ? "s" : ""} — great start!
          </p>
        </div>
      )}

      {/* OAuth tools */}
      <div className="grid grid-cols-3 gap-2">
        {OAUTH_CONNECTORS.map((c) => {
          const st = connectedTools[c.id];
          const done = st === "done";
          const loading = st === "connecting" || st === "syncing";
          return (
            <button
              key={c.id}
              onClick={() => !done && !loading && handleOAuthConnect(c)}
              disabled={loading}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                done
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-card border-border/60 hover:border-primary/40 hover:bg-accent/50"
              }`}
            >
              <img src={c.logo} alt={c.label} className="w-8 h-8 object-contain" onError={(e) => { e.target.style.display = "none"; }} />
              <p className="text-xs font-semibold">{c.label}</p>
              <p className="text-[10px] text-muted-foreground">{c.desc}</p>
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : done ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> {toolsFound[c.id]} users
                </span>
              ) : (
                <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                  <Plug className="w-3 h-3" /> Connect
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stripe */}
      <div className="border border-border/60 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <img src="https://logo.clearbit.com/stripe.com" className="w-5 h-5 rounded object-contain" onError={(e) => { e.target.style.display = "none"; }} alt="" />
          <p className="text-xs font-semibold">Stripe — import all subscription costs</p>
          {stripeStatus === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
        </div>
        {stripeStatus !== "done" && (
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="sk_live_... or sk_test_..."
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
              className="h-8 text-xs font-mono"
            />
            <Button size="sm" onClick={handleStripeConnect} disabled={!stripeKey || stripeStatus === "loading"} className="gap-1 flex-shrink-0 h-8">
              {stripeStatus === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            </Button>
          </div>
        )}
        {stripeStatus === "done" && (
          <p className="text-xs text-emerald-700 font-medium">✓ {stripeTools.length} subscriptions imported</p>
        )}
        {stripeStatus === "error" && (
          <p className="text-xs text-destructive">Connection failed — check your key</p>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-1">
        Or skip and add tools manually on the next step →
      </p>
    </div>
  );
}