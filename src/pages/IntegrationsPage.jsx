import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Zap, Activity, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConnectToolModal from "@/components/integrations/ConnectToolModal";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useAuth } from "@/lib/AuthContext";
import { useWizardImport } from "@/hooks/useWizardImport";
import LiveConnectPanel from "@/components/usage/LiveConnectPanel";
import { TOOL_CATALOG } from "@/lib/toolCatalog";

export default function IntegrationsPage({ onLiveSynced, onGoToUsage }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedTool, setSelectedTool] = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [activeSection, setActiveSection] = useState("tools"); // "tools" | "live-data"
  const [hasSynced, setHasSynced] = useState(false);

  // Build grouped catalog from TOOL_CATALOG
  const allCategories = useMemo(() => [...new Set(TOOL_CATALOG.map((t) => t.category))].sort(), []);

  const filteredCatalog = useMemo(() => {
    const q = search.toLowerCase();
    return TOOL_CATALOG.filter((t) =>
      (!q || t.name.toLowerCase().includes(q)) &&
      (catFilter === "All" || t.category === catFilter)
    );
  }, [search, catFilter]);

  const groupedTools = useMemo(() => {
    const groups = {};
    filteredCatalog.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredCatalog]);

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
          <LiveConnectPanel onSynced={() => {
            qc.invalidateQueries({ queryKey: ["user-activity", user?.id] });
            setHasSynced(true);
            onLiveSynced?.();
          }} />
          {hasSynced && onGoToUsage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-800 font-medium">Live data synced — Usage Health is now updated with real user activity.</p>
              </div>
              <Button size="sm" onClick={onGoToUsage} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0">
                <Activity className="w-3.5 h-3.5" /> View Usage Health
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Tool Stack section */}
      {activeSection === "tools" && (
        <>
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search 200+ tools…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-fit">
              <option value="All">All Categories</option>
              {allCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {Object.keys(groupedTools).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">No tools match your search.</p>
          )}

          {Object.entries(groupedTools).map(([cat, tools], ci) => (
            <motion.div key={cat} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.03 }}
              className="bg-card border border-border/60 rounded-2xl p-5">
              <h2 className="text-sm font-bold mb-3">{cat} <span className="text-muted-foreground font-normal">({tools.length})</span></h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {tools.map((tool) => {
                  const connected = connectedSet.has(tool.name);
                  const integration = integrations.find((i) => i.tool_name === tool.name);
                  return (
                    <button key={tool.name} onClick={() => setSelectedTool({ name: tool.name, category: cat })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:shadow-md ${connected ? "border-emerald-200 bg-emerald-50/50" : "border-border/60 bg-muted/30 hover:bg-card"}`}>
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                        {tool.name.charAt(0)}
                      </div>
                      <p className="text-xs font-medium leading-tight">{tool.name}</p>
                      {connected ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-700"><CheckCircle2 className="w-3 h-3" />Connected</span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" />Connect</span>
                      )}
                      {tool.avg_monthly_cost > 0 && !connected && (
                        <span className="text-[10px] font-mono text-muted-foreground">~${tool.avg_monthly_cost}/mo</span>
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
        </>
      )}

      {selectedTool && <ConnectToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />}
      {showWizard && <OnboardingWizard onComplete={handleWizardComplete} onDismiss={() => setShowWizard(false)} />}
    </div>
  );
}