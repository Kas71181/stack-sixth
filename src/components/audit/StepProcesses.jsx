import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

const SUGGESTED_PROCESSES = [
  "Sales & CRM",
  "Marketing & Ads",
  "Customer Support",
  "Project Management",
  "Accounting & Finance",
  "HR & Recruiting",
  "Product Development",
  "Communication",
  "Design",
  "Analytics & Reporting",
  "Inventory Management",
  "E-commerce",
];

const SUGGESTED_PAINS = [
  "Too many overlapping tools",
  "High monthly costs",
  "Poor integrations between tools",
  "Team not using tools we pay for",
  "Outgrowing current tools",
  "No single source of truth",
  "Manual data entry between systems",
  "Security & compliance concerns",
];

export default function StepProcesses({ data, onChange }) {
  const [processInput, setProcessInput] = useState("");
  const [painInput, setPainInput] = useState("");

  const processes = data.business_processes || [];
  const pains = data.pain_points || [];

  const addProcess = (val) => {
    const trimmed = val.trim();
    if (trimmed && !processes.includes(trimmed)) {
      onChange({ business_processes: [...processes, trimmed] });
    }
    setProcessInput("");
  };

  const removeProcess = (val) => {
    onChange({ business_processes: processes.filter((p) => p !== val) });
  };

  const addPain = (val) => {
    const trimmed = val.trim();
    if (trimmed && !pains.includes(trimmed)) {
      onChange({ pain_points: [...pains, trimmed] });
    }
    setPainInput("");
  };

  const removePain = (val) => {
    onChange({ pain_points: pains.filter((p) => p !== val) });
  };

  return (
    <div className="space-y-8">
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Business Processes
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Select or type the workflows your team needs software for.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_PROCESSES.map((p) => (
            <button
              key={p}
              onClick={() => (processes.includes(p) ? removeProcess(p) : addProcess(p))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                processes.includes(p)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add custom process..."
            value={processInput}
            onChange={(e) => setProcessInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProcess(processInput))}
            className="h-10 rounded-xl flex-1"
          />
          <button
            onClick={() => addProcess(processInput)}
            className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {processes.filter((p) => !SUGGESTED_PROCESSES.includes(p)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {processes
              .filter((p) => !SUGGESTED_PROCESSES.includes(p))
              .map((p) => (
                <Badge key={p} variant="secondary" className="gap-1 pr-1">
                  {p}
                  <button onClick={() => removeProcess(p)} className="ml-0.5 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
          </div>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Pain Points</Label>
        <p className="text-xs text-muted-foreground mb-3">
          What problems are you facing with your current software?
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_PAINS.map((p) => (
            <button
              key={p}
              onClick={() => (pains.includes(p) ? removePain(p) : addPain(p))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                pains.includes(p)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add custom pain point..."
            value={painInput}
            onChange={(e) => setPainInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPain(painInput))}
            className="h-10 rounded-xl flex-1"
          />
          <button
            onClick={() => addPain(painInput)}
            className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {pains.filter((p) => !SUGGESTED_PAINS.includes(p)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pains
              .filter((p) => !SUGGESTED_PAINS.includes(p))
              .map((p) => (
                <Badge key={p} variant="secondary" className="gap-1 pr-1">
                  {p}
                  <button onClick={() => removePain(p)} className="ml-0.5 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}