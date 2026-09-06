import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { TOOL_CATALOG } from "@/lib/toolCatalog";
import ToolComparisonPicker from "@/components/comparison/ToolComparisonPicker";
import ToolComparisonCard from "@/components/comparison/ToolComparisonCard";

const stackTool = (tool, fallback = false) => ({ id: `stack-${tool.id || tool.name}`, name: tool.tool_name || tool.name, category: tool.category, monthlyCost: tool.monthly_cost ?? null, source: "Your stack", priceLabel: "Current recorded spend", seatDetail: tool.licensed_seats ? `${tool.active_users || 0} of ${tool.licensed_seats} seats active` : null, fallback });
const catalogTool = (tool) => ({ id: `catalog-${tool.name}`, name: tool.name, category: tool.category, monthlyCost: tool.avg_monthly_cost, source: "Catalog", priceLabel: "Estimated market price" });

export default function IndependentToolComparison({ existingSoftware = [] }) {
  const { user } = useAuth(); const [query, setQuery] = useState(""); const [selected, setSelected] = useState([]);
  const { data: savedStack = [] } = useQuery({ queryKey: ["comparison-stack", user?.id], enabled: !!user?.id, queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user.id }, "tool_name", 200) });
  const tools = useMemo(() => { const stack = (savedStack.length ? savedStack : existingSoftware).map((tool) => stackTool(tool, !savedStack.length)); const names = new Set(stack.map((tool) => tool.name?.toLowerCase())); return [...stack, ...TOOL_CATALOG.filter((tool) => !names.has(tool.name.toLowerCase())).map(catalogTool)]; }, [savedStack, existingSoftware]);
  const visible = useMemo(() => { const term = query.trim().toLowerCase(); const matches = term ? tools.filter((tool) => `${tool.name} ${tool.category}`.toLowerCase().includes(term)) : tools; return matches.slice(0, term ? 30 : 16); }, [tools, query]);
  const toggle = (tool) => setSelected((current) => current.some((item) => item.id === tool.id) ? current.filter((item) => item.id !== tool.id) : current.length < 4 ? [...current, tool] : current);
  const priced = selected.map((tool) => tool.monthlyCost).filter((value) => value != null); const baseline = priced.length ? Math.min(...priced) : null;
  return <div className="space-y-4"><div><h2 className="text-lg font-bold">Compare tools for your next decision</h2><p className="mt-1 text-sm text-muted-foreground">Choose products from your current stack and the catalog—recommendations are not required.</p></div><ToolComparisonPicker tools={visible} selected={selected} query={query} onQuery={setQuery} onToggle={toggle} />{selected.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{selected.map((tool) => <ToolComparisonCard key={tool.id} tool={tool} baseline={baseline} />)}</div> : <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Select at least two tools to begin a decision comparison.</div>}</div>;
}