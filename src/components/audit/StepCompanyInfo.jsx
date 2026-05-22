import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Sparkles } from "lucide-react";

export default function StepCompanyInfo({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="company_name" className="text-sm font-medium mb-2 block">
          Company Name
        </Label>
        <Input
          id="company_name"
          placeholder="Acme Corp"
          value={data.company_name || ""}
          onChange={(e) => onChange({ company_name: e.target.value })}
          className="h-11 rounded-xl"
        />
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">What best describes you?</Label>
        <RadioGroup
          value={data.user_type || ""}
          onValueChange={(val) => onChange({ user_type: val })}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <label
            className={`flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-all ${
              data.user_type === "startup"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <RadioGroupItem value="startup" className="mt-0.5" />
            <div>
              <p className="font-medium text-sm">Building from scratch</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                I need to pick the right tools for a new or early-stage company
              </p>
            </div>
          </label>
          <label
            className={`flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-all ${
              data.user_type === "optimize"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <RadioGroupItem value="optimize" className="mt-0.5" />
            <div>
              <p className="font-medium text-sm">Optimizing existing stack</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                I already use tools but want to cut waste and improve fit
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="company_website" className="text-sm font-medium mb-2 block">
          Company Website or LinkedIn URL
          <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> ICP Auto-detect
          </span>
        </Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="company_website"
            placeholder="https://yourcompany.com"
            value={data.company_website || ""}
            onChange={(e) => onChange({ company_website: e.target.value })}
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          We'll analyze your online presence to build your ICP and align recommendations to your business model.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="team_size" className="text-sm font-medium mb-2 block">
            Team Size
          </Label>
          <Input
            id="team_size"
            type="number"
            min={1}
            placeholder="e.g. 15"
            value={data.team_size || ""}
            onChange={(e) => onChange({ team_size: parseInt(e.target.value) || "" })}
            className="h-11 rounded-xl"
          />
        </div>
        <div>
          <Label htmlFor="monthly_budget" className="text-sm font-medium mb-2 block">
            Monthly Software Budget ($)
          </Label>
          <Input
            id="monthly_budget"
            type="number"
            min={0}
            placeholder="e.g. 2000"
            value={data.monthly_budget || ""}
            onChange={(e) => onChange({ monthly_budget: parseInt(e.target.value) || "" })}
            className="h-11 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}