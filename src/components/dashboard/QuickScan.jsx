import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function QuickScan() {
  const navigate = useNavigate();
  const [teamSize, setTeamSize] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);

  const handleScan = async () => {
    if (!teamSize) return;
    setLoading(true);
    const size = parseInt(teamSize);
    const monthlyBudget = parseFloat(budget) || size * 150; // ~$150/person average SaaS spend

    // Industry benchmark: 30-40% waste, quick estimate
    const wasteMin = Math.round(monthlyBudget * 0.28);
    const wasteMax = Math.round(monthlyBudget * 0.40);
    const avgToolsPerPerson = 8;
    const estimatedTools = Math.round(size * (size < 20 ? 0.8 : size < 100 ? 0.5 : 0.3));

    // Quick AI validation of the estimate
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `A company has ${size} employees and spends approximately $${monthlyBudget}/month on SaaS.
        Based on industry benchmarks, estimate:
        1. The likely monthly waste (duplicate tools, idle licenses, over-provisioned plans)
        2. How many SaaS tools they likely have
        3. The top 3 categories where they're likely wasting money
        Be specific and realistic. Use SMB industry benchmark data.`,
        response_json_schema: {
          type: "object",
          properties: {
            waste_low: { type: "number" },
            waste_high: { type: "number" },
            estimated_tools: { type: "number" },
            top_waste_categories: { type: "array", items: { type: "string" } },
            key_insight: { type: "string" },
          },
        },
      });
      setEstimate({
        wasteMin: res.waste_low || wasteMin,
        wasteMax: res.waste_high || wasteMax,
        tools: res.estimated_tools || estimatedTools,
        categories: res.top_waste_categories || ["Communication", "Project Management", "CRM"],
        insight: res.key_insight || `Companies your size typically save $${wasteMin}–$${wasteMax}/mo with a full audit.`,
        budget: monthlyBudget,
      });
    } catch {
      setEstimate({
        wasteMin,
        wasteMax,
        tools: estimatedTools,
        categories: ["Communication tools", "Project management", "CRM & Sales"],
        insight: `Companies with ${size} people typically waste 30–40% of their SaaS budget.`,
        budget: monthlyBudget,
      });
    }
    setLoading(false);
  };

  if (estimate) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="font-bold text-sm">Your Quick Estimate</p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/80 rounded-xl p-3 border border-white">
            <p className="text-2xl font-extrabold text-destructive">${estimate.wasteMin.toLocaleString()}–${estimate.wasteMax.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Estimated monthly waste</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 border border-white">
            <p className="text-2xl font-extrabold">{estimate.tools}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Tools you likely have</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 border border-white">
            <p className="text-2xl font-extrabold text-primary">{Math.round((estimate.wasteMin / estimate.budget) * 100)}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Of budget at risk</p>
          </div>
        </div>

        <div className="bg-white/60 rounded-xl p-3 border border-white/80">
          <p className="text-xs font-semibold mb-1.5">Likely waste sources:</p>
          <div className="flex flex-wrap gap-1.5">
            {estimate.categories.map((c) => (
              <span key={c} className="text-[11px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">{estimate.insight}</p>

        <Button onClick={() => navigate("/audit")} className="w-full gap-2">
          Run Full Audit to Find Exact Savings
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-primary" />
        <p className="font-bold text-sm">30-Second Waste Estimate</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Tell us two numbers — we'll estimate your monthly SaaS waste instantly.
      </p>

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-wider">Team Size</p>
          <Input
            type="number"
            placeholder="e.g. 25"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            className="h-10"
            min={1}
          />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-wider">Monthly SaaS Budget ($)</p>
          <Input
            type="number"
            placeholder="Optional"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="h-10"
            min={0}
          />
        </div>
      </div>

      <Button
        onClick={handleScan}
        disabled={!teamSize || loading}
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Estimating your waste...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Show My Estimate
          </>
        )}
      </Button>
    </div>
  );
}