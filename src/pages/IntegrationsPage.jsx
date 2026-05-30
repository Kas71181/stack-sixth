import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConnectToolModal from "@/components/integrations/ConnectToolModal";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

const TOOL_LIBRARY = {
  "Communication": ["Slack", "Microsoft Teams", "Zoom", "Google Meet", "Webex"],
  "Project Management": ["Jira", "Asana", "Monday.com", "Linear", "Notion", "ClickUp", "Trello"],
  "CRM & Sales": ["Salesforce", "HubSpot", "Pipedrive", "Zoho CRM"],
  "Productivity & Docs": ["Google Workspace", "Microsoft 365"],
  "Analytics & BI": ["Looker", "Tableau", "Mixpanel", "Amplitude", "Google Analytics", "Metabase"],
  "Marketing": ["HubSpot Marketing", "Mailchimp", "Klaviyo", "Marketo", "Semrush", "Buffer"],
  "Customer Support": ["Zendesk", "Intercom", "Freshdesk", "Gorgias"],
  "Identity & Security": ["Okta", "Azure AD", "1Password", "Duo", "LastPass"],
  "Dev Tools": ["GitHub", "GitLab", "Vercel", "AWS", "Datadog", "PagerDuty", "Sentry", "Figma"],
  "Finance & HR": ["QuickBooks", "Xero", "Gusto", "Rippling", "Workday", "Expensify", "BambooHR", "Greenhouse"],
};

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const [selectedTool, setSelectedTool] = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const [showWizard, setShowWizard] = useState(false);

  const handleWizardComplete = async ({ company, tools }) => {
    for (const tool of tools) {
      const existing = integrations.find((i) => i.tool_name?.toLowerCase() === tool.tool_name?.toLowerCase());
      if (!existing) {
        await base44.entities.SaasIntegration.create({
          tool_name: tool.tool_name,
          category: tool.category || "Other",
          monthly_cost: tool.monthly_cost || null,
          licensed_seats: tool.licensed_seats || null,
          active_users: tool.active_users || null,
          connection_status: tool.connection_status || "Connected",
          last_synced: new Date().toISOString().split("T")[0],
        });
      }
    }
    qc.invalidateQueries({ queryKey: ["integrations"] });
    setShowWizard(false);
  };

  const { data: integrations = [] } = useQuery({ queryKey: ["integrations"], queryFn: () => base44.entities.SaasIntegration.list() });
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
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="All">All Categories</option>
            {Object.keys(TOOL_LIBRARY).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

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

      {selectedTool && <ConnectToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />}
      {showWizard && <OnboardingWizard onComplete={handleWizardComplete} onDismiss={() => setShowWizard(false)} />}
    </div>
  );
}