import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConnectToolModal from "@/components/integrations/ConnectToolModal";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useAuth } from "@/lib/AuthContext";
import { useWizardImport } from "@/hooks/useWizardImport";
import LiveConnectPanel from "@/components/usage/LiveConnectPanel";

const TOOL_LIBRARY = {
  "Communication": ["Slack", "Microsoft Teams", "Zoom", "Google Meet", "Webex"],
  "Project Management": ["Jira", "Asana", "Monday.com", "Linear", "Notion", "ClickUp", "Trello"],
  "CRM & Sales": ["Salesforce", "HubSpot", "Apollo.io", "Pipedrive", "Zoho CRM"],
  "Productivity & Docs": ["Google Workspace", "Microsoft 365"],
  "Analytics & BI": ["Looker", "Tableau", "Mixpanel", "Amplitude", "Google Analytics", "Metabase"],
  "Marketing": ["HubSpot Marketing", "Mailchimp", "Klaviyo", "Marketo", "Semrush", "Buffer"],
  "Customer Support": ["Zendesk", "Intercom", "Freshdesk", "Gorgias"],
  "Identity & Security": ["Okta", "Azure AD", "1Password", "Duo", "LastPass"],
  "Dev Tools": ["GitHub", "GitLab", "Vercel", "AWS", "Datadog", "PagerDuty", "Sentry", "Figma"],
  "Finance & HR": ["QuickBooks", "Xero", "Gusto", "Rippling", "Workday", "Expensify", "BambooHR", "Greenhouse"],
};

export default function IntegrationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedTool, setSelectedTool] = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const [showWizard, setShowWizard] = useState(false);
  const [activeSection, setActiveSection] = useState("tools"); // "tools" | "live-data"

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations", user?.id],
    queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const { handleWizardComplete: _handleWizardComplete } = useWizardImport({ integrations });
  const handleWizardComplete = async (data) => {
    await _handleWizardComplete(data);
    setShowWizard(false);
  };
  const connectedSet = new Set(integrations.map((i) => i.tool_name));

  const categories = catFilter === "All" ? Object.keys(TOOL_LIBRARY) : [catFilter];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Integrations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{integrations.length} tools connected</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowWizard(true)} className="gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Auto-Import
          </Button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setActiveSection("tools")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activeSection === "tools" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`}
        >
          <Zap className="w-3.5 h-3.5" /> Tool Stack
        </button>
        <button
          onClick={() => setActiveSection("live-data")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activeSection === "live-data" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`}
        >
          <Activity className="w-3.5 h-3.5" /> Live Usage Data
          <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-full">BETA</span>
        </button>
      </div>

      {/* Live Data section */}
      {activeSection === "live-data" && (
        <div className="space-y-3">
          <div className="bg-accent/40 border border-primary/10 rounded-xl px-4 py-3">
            <p className="text-sm text-foreground">Connect your tools below to pull <strong>real per-user activity data</strong> into Usage Health. Connected sources replace estimates with live utilization scores that feed directly into your monitoring reports.</p>
          </div>
          <LiveConnectPanel onSynced={() => qc.invalidateQueries({ queryKey: ["user-activity", user?.id] })} />
        </div>
      )}

      {/* Tool Stack section */}
      {activeSection === "tools" && <>
      <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-fit">
        <option value="All">All Categories</option>
        {Object.keys(TOOL_LIBRARY).map((c) => <option key={c}>{c}</option>)}
      </select>
      {categories.map((cat, ci) => (
        <motion.div key={cat} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.04 }}
          className="bg-card border border-border/60 rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-3">{cat}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {TOOL_LIBRARY[cat].map((tool) => {
              const connected = connectedSet.has(tool);
              const integration = integrations.find((i) => i.tool_name === tool);
              return (
                <button key={tool} onClick={() => setSelectedTool({ name: tool, category: cat })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:shadow-md ${connected ? "border-emerald-200 bg-emerald-50/50" : "border-border/60 bg-muted/30 hover:bg-card"}`}>
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                    {tool.charAt(0)}
                  </div>
                  <p className="text-xs font-medium leading-tight">{tool}</p>
                  {connected ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-700"><CheckCircle2 className="w-3 h-3" />Connected</span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" />Connect</span>
                  )}
                  {connected && integration?.monthly_cost && (
                    <span className="text-[10px] font-mono text-muted-foreground">${integration.monthly_cost}/mo</span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      </>}

      {selectedTool && <ConnectToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />}
      {showWizard && <OnboardingWizard onComplete={handleWizardComplete} onDismiss={() => setShowWizard(false)} />}
    </div>
  );
}