import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ExternalLink, CheckCircle2, Loader2, Key, Shield, Copy, CheckCheck, ArrowRight, Zap
} from "lucide-react";
import { toast } from "sonner";
import { getCredentialGuide } from "@/lib/credentialGuides";

// Tools with real native connectors wired up in the backend
const NATIVE_CONNECTORS = {
  "Slack":  { connectorId: "6a1dba44349cdfe5f00d8fb7", functionName: "getSlackActivity" },
  "GitHub": { connectorId: "6a1db9e6a90dd35761465e22", functionName: "getGitHubActivity" },
  "Notion": { connectorId: "6a1db8b6d0e9930c01976399", functionName: "getNotionActivity" },
};

// ─────────────────────────────────────────────
// Native OAuth flow (Slack / GitHub / Notion)
// ─────────────────────────────────────────────
function NativeOAuthFlow({ tool, onSuccess }) {
  const connector = NATIVE_CONNECTORS[tool.name];
  const [status, setStatus] = useState("idle"); // idle | connecting | syncing | done | error
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setStatus("connecting");
    setError("");
    const url = await base44.connectors.connectAppUser(connector.connectorId);
    const popup = window.open(url, "_blank", "width=600,height=700");
    const timer = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setStatus("syncing");
        try {
          const res = await base44.functions.invoke(connector.functionName, {});
          if (res.data?.success) {
            setStats({ total: res.data.total, created: res.data.created, updated: res.data.updated });
            setStatus("done");
            toast.success(`${tool.name} connected — ${res.data.total} users synced`);
            onSuccess?.();
          } else {
            setError(res.data?.error || "Sync failed");
            setStatus("error");
          }
        } catch (err) {
          setError(err.message || "Sync failed");
          setStatus("error");
        }
      }
    }, 500);
  };

  if (status === "done") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">{tool.name} connected!</p>
            <p className="text-xs text-emerald-700">Live data is now flowing into Usage Analytics.</p>
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[["Total Users", stats.total, "bg-muted/40"], ["New", stats.created, "bg-emerald-50"], ["Updated", stats.updated, "bg-blue-50"]].map(([label, val, bg]) => (
              <div key={label} className={`${bg} rounded-lg p-2`}>
                <p className="text-lg font-extrabold">{val}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">One-click OAuth</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Click below to authorize Stack Sixth to read your <strong>{tool.name}</strong> workspace data. No passwords stored — uses official OAuth.
        </p>
      </div>

      {status === "error" && (
        <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>
      )}

      <Button
        className="w-full gap-2"
        disabled={status === "connecting" || status === "syncing"}
        onClick={handleConnect}
      >
        {status === "connecting" && <><Loader2 className="w-4 h-4 animate-spin" /> Waiting for authorization…</>}
        {status === "syncing"    && <><Loader2 className="w-4 h-4 animate-spin" /> Pulling live data…</>}
        {status === "idle"       && <><Zap className="w-4 h-4" /> Connect {tool.name} with OAuth</>}
        {status === "error"      && <><Zap className="w-4 h-4" /> Try Again</>}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Guided OAuth flow for all other tools
// ─────────────────────────────────────────────
function GuidedOAuthFlow({ tool, onSuccess }) {
  const guide = getCredentialGuide(tool.name);
  const [step, setStep] = useState("intro");   // intro | authorizing | token | done
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  const oauthUrl = guide.oauthUrl || guide.apiUrl;

  const handleOpenLogin = () => {
    if (oauthUrl) {
      window.open(oauthUrl, "_blank", "width=900,height=700,noopener");
    }
    setStep("authorizing");
  };

  const handleCopySteps = () => {
    const text = guide.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Steps copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToken = async () => {
    if (!token.trim()) {
      toast.error("Please paste your API key or token first.");
      return;
    }
    await base44.functions.invoke("saveApiCredential", {
      service: tool.name.toLowerCase().replace(/\s+/g, "_"),
      api_key: token.trim(),
    });
    setStep("done");
    toast.success(`${tool.name} credentials saved!`);
    onSuccess?.();
  };

  // ── Intro step ──
  if (step === "intro") {
    return (
      <div className="space-y-3">
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Guided OAuth / API connect</p>
          </div>
          <p className="text-xs text-muted-foreground">
            We'll open <strong>{tool.name}</strong>'s official authorization page. Log in, approve access, then paste your token back here — no passwords stored.
          </p>
        </div>

        {/* Step list */}
        <div className="bg-muted/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What you'll do</p>
            <button onClick={handleCopySteps} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy steps"}
            </button>
          </div>
          <ol className="space-y-2">
            {guide.steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span className="text-foreground leading-snug">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        {guide.notes && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{guide.notes}</p>
        )}

        <Button className="w-full gap-2" onClick={handleOpenLogin}>
          <ExternalLink className="w-4 h-4" />
          Open {tool.name} &amp; Authorize
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Button>

        {guide.docsUrl && (
          <a href={guide.docsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            View API docs <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  // ── Authorizing step ──
  if (step === "authorizing") {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Waiting for you to authorize…</p>
            <p className="text-xs text-blue-700 mt-0.5">Complete the login in the popup, then come back here and paste your token below.</p>
          </div>
        </div>

        <div>
          <Label className="text-xs mb-1.5 block font-semibold">Paste your API Key / Access Token</Label>
          <Input
            type="password"
            placeholder="sk-… or paste your token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono text-sm"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep("intro")}>← Back</Button>
          <Button className="flex-1 gap-2" onClick={handleSaveToken} disabled={!token.trim()}>
            <Key className="w-4 h-4" /> Save & Connect
          </Button>
        </div>

        <button onClick={handleOpenLogin} className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full">
          <ExternalLink className="w-3.5 h-3.5" /> Re-open {tool.name} authorization page
        </button>
      </div>
    );
  }

  // ── Done step ──
  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="font-bold text-base">{tool.name} connected!</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your credentials are saved. Enter cost & seat data below and click Connect.</p>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────
// Main export — picks the right flow
// ─────────────────────────────────────────────
export default function OAuthConnectFlow({ tool, onSuccess }) {
  const isNative = !!NATIVE_CONNECTORS[tool.name];
  return isNative
    ? <NativeOAuthFlow tool={tool} onSuccess={onSuccess} />
    : <GuidedOAuthFlow tool={tool} onSuccess={onSuccess} />;
}