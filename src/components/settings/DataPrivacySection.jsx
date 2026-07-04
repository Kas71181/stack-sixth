import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, CheckCircle2, XCircle, ChevronDown, ChevronUp, Trash2, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ALL_CONNECTORS = [
  {
    id: "slack", label: "Slack", type: "oauth",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png",
    reads: ["Workspace member names and email addresses", "Message activity counts (last 30 days)", "Days active, last active date"],
    never: ["Message content or text", "DMs or private channels", "Files or attachments"],
    scope: "users:read, users:read.email, channels:read",
  },
  {
    id: "github", label: "GitHub", type: "oauth",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
    reads: ["Org member names and email addresses", "Event counts (pushes, PRs) — last 30 days", "Last active date, activity score"],
    never: ["Repository code or contents", "Commit messages or diffs", "Secrets or credentials"],
    scope: "read:user, user:email, read:org",
  },
  {
    id: "notion", label: "Notion", type: "oauth",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    reads: ["Workspace member names and email addresses", "Last page edit timestamps", "Activity frequency (page count)"],
    never: ["Page content or documents", "Database records", "Proprietary content"],
    scope: "read_users, read_content",
  },
  {
    id: "zoom", label: "Zoom", type: "api",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Zoom_Logo_2022.svg/2560px-Zoom_Logo_2022.svg.png",
    reads: ["Meeting participant names and emails", "Meeting frequency and duration counts"],
    never: ["Meeting recordings or transcripts", "Chat messages", "Customer data"],
    scope: "Server-to-Server OAuth — meeting:read, user:read",
  },
  {
    id: "apollo", label: "Apollo.io", type: "api",
    logo: "https://assets-global.website-files.com/60b86da97e58f877a9d4e89f/60e5db46929e39b89bed2e96_apollo-logo.png",
    reads: ["Team member names and emails", "Sequence and activity counts per user"],
    never: ["Contact or lead data", "Email content", "Customer records"],
    scope: "Read-only API key",
  },
  {
    id: "hubspot", label: "HubSpot", type: "api",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HubSpot_Logo.svg/2560px-HubSpot_Logo.svg.png",
    reads: ["CRM user names and emails", "Engagement counts (last 30 days)", "Last active date"],
    never: ["Contact or deal data", "Email content", "Customer records"],
    scope: "crm.objects.owners.read, crm.objects.contacts.read (engagements only)",
  },
  {
    id: "quickbooks", label: "QuickBooks", type: "api",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Intuit_QuickBooks_logo.svg/2560px-Intuit_QuickBooks_logo.svg.png",
    reads: ["Employee/user names and emails", "Account activity timestamps"],
    never: ["Financial transactions", "Customer or vendor data", "Tax information"],
    scope: "Read-only access token",
  },
  {
    id: "bamboohr", label: "BambooHR", type: "api",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/BambooHR_logo.svg/2560px-BambooHR_logo.svg.png",
    reads: ["Employee names, emails, and departments", "Headcount and employment status"],
    never: ["Salary or compensation data", "Performance reviews", "Personal HR records"],
    scope: "Read-only API key — employees endpoint only",
  },
  {
    id: "google_workspace", label: "Google Workspace", type: "api",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/2048px-Google_%22G%22_Logo.svg.png",
    reads: ["Org-wide OAuth app list (shadow IT detection)", "App names and install counts"],
    never: ["Email content", "Drive files or documents", "User credentials"],
    scope: "Service account — admin.directory.user.readonly",
  },
];

function ConnectorRow({ connector, isConnected, onRevoke }) {
  const [expanded, setExpanded] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    setRevoking(true);
    await onRevoke(connector.id);
    setRevoking(false);
  };

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        className="w-full px-5 py-4 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={connector.logo} alt={connector.label} className="w-6 h-6 object-contain" onError={e => e.target.style.display = 'none'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{connector.label}</p>
          <p className="text-xs text-muted-foreground">{connector.type === "oauth" ? "OAuth" : "API Key"} connection</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </span>
          ) : (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Not connected</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> We read
              </p>
              <ul className="space-y-1">
                {connector.reads.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />{r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <XCircle className="w-3 h-3 text-red-500" /> We never access
              </p>
              <ul className="space-y-1">
                {connector.never.map((n, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />{n}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-muted/20 rounded-lg px-3 py-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground"><span className="font-medium">Scopes:</span> {connector.scope}</p>
          </div>
          {isConnected && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-900/20"
              onClick={handleRevoke}
              disabled={revoking}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {revoking ? "Revoking…" : "Revoke Access"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function DataPrivacySection() {
  const [connectedIds, setConnectedIds] = useState(new Set());

  useEffect(() => {
    base44.entities.ApiCredential.list().then(creds => {
      const ids = new Set(creds.map(c => c.service));
      // Also try pinging OAuth functions to detect connection
      Promise.allSettled([
        base44.functions.invoke("getSlackActivity", {}).then(r => r.data?.success && ids.add("slack")),
        base44.functions.invoke("getGitHubActivity", {}).then(r => r.data?.success && ids.add("github")),
        base44.functions.invoke("getNotionActivity", {}).then(r => r.data?.success && ids.add("notion")),
      ]).finally(() => setConnectedIds(new Set(ids)));
    }).catch(() => {});
  }, []);

  const handleRevoke = async (id) => {
    try {
      const creds = await base44.entities.ApiCredential.filter({ service: id });
      await Promise.all(creds.map(c => base44.entities.ApiCredential.delete(c.id)));
      setConnectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      toast.success("Access revoked");
    } catch {
      toast.error("Failed to revoke — try again");
    }
  };

  const connected = ALL_CONNECTORS.filter(c => connectedIds.has(c.id));
  const notConnected = ALL_CONNECTORS.filter(c => !connectedIds.has(c.id));

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-base">Data & Privacy</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage what Stack Sixth can access from each connected tool.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        {connected.length === 0 && notConnected.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No connectors configured yet.</p>
        )}
        {[...connected, ...notConnected].map(c => (
          <ConnectorRow key={c.id} connector={c} isConnected={connectedIds.has(c.id)} onRevoke={handleRevoke} />
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        All data is stored exclusively in your Stack Sixth account and never shared with third parties.{" "}
        <a href="https://www.stacksixth.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy →</a>
      </p>

      {/* Platform trust & compliance */}
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
        <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground">Secured by Base44</p>
          <p className="text-[10px] text-muted-foreground">SOC 2 Type II · ISO 27001 · GDPR · Encryption at rest & in transit</p>
        </div>
        <a
          href="https://base44.com/security"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline flex-shrink-0"
        >
          Trust Center <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}