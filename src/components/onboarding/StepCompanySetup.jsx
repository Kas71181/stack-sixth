import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INDUSTRIES = ["SaaS", "Agency", "E-commerce", "Healthcare", "Finance", "Other"];

export default function StepCompanySetup({ data, onChange }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Tell us a bit about your company so we can tailor your audit.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold mb-1 block">Company Name *</Label>
          <Input placeholder="Acme Corp" value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1 block">Industry</Label>
          <select
            value={data.industry}
            onChange={(e) => onChange({ ...data, industry: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1 block">Team Size</Label>
          <Input type="number" min={1} placeholder="50" value={data.employee_count} onChange={(e) => onChange({ ...data, employee_count: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1 block">Monthly SaaS Budget ($)</Label>
          <Input type="number" min={0} placeholder="10000" value={data.monthly_saas_budget} onChange={(e) => onChange({ ...data, monthly_saas_budget: e.target.value })} />
        </div>
      </div>
    </div>
  );
}