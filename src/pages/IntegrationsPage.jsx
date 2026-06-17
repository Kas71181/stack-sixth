import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Zap, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConnectToolModal from "@/components/integrations/ConnectToolModal";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useAuth } from "@/lib/AuthContext";
import { useWizardImport } from "@/hooks/useWizardImport";
import { Link } from "react-router-dom";
import { TOOL_CATALOG } from "@/lib/toolCatalog";

export default function IntegrationsPage({ onLiveSynced, onGoToUsage }) {
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showWizard, setShowWizard] = useState(false);

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

      {/* Live data coverage nudge */}
      <div className="glass-card border-primary/20 bg-primary/5 flex items-center gap-3 px-4 py-3 rounded-xl">
        <Zap className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-sm flex-1">Want live per-user activity data? Use the <strong>Data Coverage Setup</strong> wizard to connect API sources.</p>
        <Link to="/data-coverage">
          <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5 flex-shrink-0">
            Set Up Coverage <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Tool Stack */}
      {(
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
              className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-bold mb-3">{cat} <span className="text-muted-foreground font-normal">({tools.length})</span></h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {tools.map((tool) => {
                  const connected = connectedSet.has(tool.name);
                  const integration = integrations.find((i) => i.tool_name === tool.name);
                  return (
                    <button key={tool.name} onClick={() => setSelectedTool({ name: tool.name, category: cat })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover-lift ${
                        connected
                          ? "border-emerald-500/25 bg-emerald-500/8 hover:border-emerald-500/40"
                          : "border-border/50 bg-transparent hover:bg-white/5 dark:hover:bg-white/4 hover:border-border"
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                        connected ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/60 text-muted-foreground"
                      }`}>
                        {tool.name.charAt(0)}
                      </div>
                      <p className="text-xs font-semibold leading-tight text-foreground">{tool.name}</p>
                      {connected ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-500">
                          <CheckCircle2 className="w-3 h-3" />Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />Connect
                        </span>
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