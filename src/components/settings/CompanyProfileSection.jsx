import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const INDUSTRIES = ["SaaS", "Agency", "E-commerce", "Healthcare", "Finance", "Other"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CompanyProfileSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const company = companies[0];

  const [form, setForm] = useState({
    name: "", industry: "SaaS", employee_count: "", monthly_saas_budget: "",
    currency: "USD", fiscal_year_start: "January", cost_alert_threshold: ""
  });

  useEffect(() => {
    if (company) setForm({
      name: company.name || "",
      industry: company.industry || "SaaS",
      employee_count: company.employee_count || "",
      monthly_saas_budget: company.monthly_saas_budget || "",
      currency: company.currency || "USD",
      fiscal_year_start: company.fiscal_year_start || "January",
      cost_alert_threshold: company.cost_alert_threshold || "",
    });
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: (data) => company
      ? base44.entities.Company.update(company.id, data)
      : base44.entities.Company.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); toast({ title: "Company profile saved" }); },
  });

  const f = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm">Company Profile</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs mb-1 block">Company Name</Label>
          <Input value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="Acme Inc." />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Industry</Label>
          <select value={form.industry} onChange={(e) => f("industry", e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Employee Count</Label>
          <Input type="number" value={form.employee_count} onChange={(e) => f("employee_count", e.target.value)} placeholder="50" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Monthly SaaS Budget ($)</Label>
          <Input type="number" value={form.monthly_saas_budget} onChange={(e) => f("monthly_saas_budget", e.target.value)} placeholder="5000" />
        </div>
      </div>

      <div className="border-t border-border/40 pt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Audit Defaults</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs mb-1 block">Currency</Label>
            <select value={form.currency} onChange={(e) => f("currency", e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Fiscal Year Start</Label>
            <select value={form.fiscal_year_start} onChange={(e) => f("fiscal_year_start", e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
              {MONTHS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Cost Alert Threshold ($)</Label>
            <Input type="number" value={form.cost_alert_threshold} onChange={(e) => f("cost_alert_threshold", e.target.value)} placeholder="e.g. 500" />
          </div>
        </div>
      </div>

      <Button
        onClick={() => saveMutation.mutate({
          ...form,
          employee_count: Number(form.employee_count),
          monthly_saas_budget: Number(form.monthly_saas_budget),
          cost_alert_threshold: Number(form.cost_alert_threshold),
        })}
        disabled={saveMutation.isPending}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        {saveMutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}