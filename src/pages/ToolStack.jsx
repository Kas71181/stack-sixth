import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Plus, Search, Layers, Trash2, Pencil, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AddToolModal from "@/components/stack/AddToolModal";

const STATUS_COLORS = {
  Connected: "bg-emerald-500/12 text-emerald-500 border-emerald-500/25",
  "Manual Upload": "bg-primary/10 text-primary border-primary/20",
  Pending: "bg-amber-500/12 text-amber-500 border-amber-500/25",
  Failed: "bg-red-500/12 text-red-500 border-red-500/25",
};

const CATEGORIES = ["All", "Communication", "Project Management", "CRM & Sales", "Productivity & Docs", "Analytics & BI", "Marketing", "Customer Support", "Identity & Security", "Dev Tools", "Finance & HR"];

export default function ToolStack() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editTool, setEditTool] = useState(null);
  const [sortBy, setSortBy] = useState("cost");

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["integrations", user?.id],
    queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: latestAudit } = useQuery({
    queryKey: ["latest-audit-for-stack", user?.id],
    queryFn: async () => {
      const audits = await base44.entities.SoftwareAudit.filter(
        { created_by_id: user?.id, status: "completed" },
        "-created_date",
        1
      );
      return audits[0] || null;
    },
    enabled: !!user?.id,
  });

  const importMutation = useMutation({
    mutationFn: async (tools) => {
      const CATEGORY_MAP = {
        communication: "Communication",
        "project management": "Project Management",
        crm: "CRM & Sales",
        sales: "CRM & Sales",
        productivity: "Productivity & Docs",
        docs: "Productivity & Docs",
        analytics: "Analytics & BI",
        bi: "Analytics & BI",
        marketing: "Marketing",
        support: "Customer Support",
        identity: "Identity & Security",
        security: "Identity & Security",
        dev: "Dev Tools",
        finance: "Finance & HR",
        hr: "Finance & HR",
      };
      const guessCategory = (cat) => {
        if (!cat) return "Productivity & Docs";
        const lower = cat.toLowerCase();
        for (const [k, v] of Object.entries(CATEGORY_MAP)) {
          if (lower.includes(k)) return v;
        }
        return "Productivity & Docs";
      };
      for (const t of tools) {
        await base44.entities.SaasIntegration.create({
          tool_name: t.name,
          category: guessCategory(t.category),
          monthly_cost: t.monthly_cost || null,
          connection_status: "Manual Upload",
          last_synced: new Date().toISOString().split("T")[0],
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SaasIntegration.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });

  let filtered = integrations.filter((i) => {
    const matchSearch = i.tool_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  if (sortBy === "cost") filtered = [...filtered].sort((a, b) => (b.monthly_cost || 0) - (a.monthly_cost || 0));
  else if (sortBy === "util") {
    filtered = [...filtered].sort((a, b) => {
      const rateA = a.licensed_seats > 0 ? (a.active_users || 0) / a.licensed_seats : 0;
      const rateB = b.licensed_seats > 0 ? (b.active_users || 0) / b.licensed_seats : 0;
      return rateA - rateB;
    });
  } else filtered = [...filtered].sort((a, b) => a.tool_name.localeCompare(b.tool_name));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Tool Stack</h1>
        <Button onClick={() => { setEditTool(null); setShowAdd(true); }} className="gap-1.5">
          <Plus className="w-4 h-4" />Add Tool
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools..." className="pl-9 h-9" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="cost">Sort: Cost</option>
          <option value="util">Sort: Utilization</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : integrations.length === 0 ? (
        /* Empty state — no tools at all */
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/5 to-accent/20 border border-primary/20 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold mb-1">No tools added yet</h2>
          {latestAudit?.existing_software?.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                We found <strong>{latestAudit.existing_software.length} tools</strong> from your last audit (<em>{latestAudit.company_name}</em>). Import them automatically or add manually.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => importMutation.mutate(latestAudit.existing_software)}
                  disabled={importMutation.isPending}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {importMutation.isPending ? "Importing..." : `Import ${latestAudit.existing_software.length} Tools from Audit`}
                </Button>
                <Button variant="outline" onClick={() => { setEditTool(null); setShowAdd(true); }} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Manually
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                Manually add any software your scan didn't pick up — enter the name, cost, and seat info to get full visibility.
              </p>
              <Button onClick={() => { setEditTool(null); setShowAdd(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Add Your First Tool
              </Button>
            </>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tool, idx) => {
            const util = tool.licensed_seats > 0 ? Math.round((tool.active_users / tool.licensed_seats) * 100) : 0;
            const inactive = (tool.licensed_seats || 0) - (tool.active_users || 0);
            const utilColor = util >= 70 ? "bg-emerald-500" : util >= 40 ? "bg-amber-400" : "bg-red-500";
            return (
              <motion.div key={tool.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                className="bg-card border border-border/60 rounded-xl px-5 py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[160px]">
                  <p className="font-semibold text-sm">{tool.tool_name}</p>
                  <Badge variant="outline" className="text-[10px] mt-0.5">{tool.category}</Badge>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[tool.connection_status] || ""}`}>{tool.connection_status}</span>
                <div className="text-sm font-mono font-medium w-20 text-right">${(tool.monthly_cost || 0).toLocaleString()}/mo</div>
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{tool.active_users}/{tool.licensed_seats}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
                    <div className={`h-full rounded-full ${utilColor}`} style={{ width: `${util}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-8">{util}%</span>
                </div>
                {tool.last_synced && <span className="text-[10px] text-muted-foreground hidden md:block">{tool.last_synced}</span>}
                {inactive > 0 && <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">{inactive} idle</span>}
                {/* Actions */}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => { setEditTool(tool); setShowAdd(true); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Remove ${tool.tool_name}?`)) deleteMutation.mutate(tool.id); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && integrations.length > 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tools match your filters</p>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <AddToolModal
          tool={editTool}
          onClose={() => { setShowAdd(false); setEditTool(null); }}
        />
      )}
    </div>
  );
}