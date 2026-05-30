import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Save, Building2, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const INDUSTRIES = ["SaaS", "Agency", "E-commerce", "Healthcare", "Finance", "Other"];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const company = companies[0];

  const [form, setForm] = useState({ name: "", industry: "SaaS", employee_count: "", monthly_saas_budget: "" });
  useEffect(() => { if (company) setForm({ name: company.name || "", industry: company.industry || "SaaS", employee_count: company.employee_count || "", monthly_saas_budget: company.monthly_saas_budget || "" }); }, [company]);

  const saveMutation = useMutation({
    mutationFn: (data) => company ? base44.entities.Company.update(company.id, data) : base44.entities.Company.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); toast({ title: "Settings saved" }); },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>

      {/* Company Profile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm">Company Profile</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1 block">Company Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Industry</Label>
            <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Employee Count</Label>
            <Input type="number" value={form.employee_count} onChange={(e) => setForm({ ...form, employee_count: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Monthly SaaS Budget ($)</Label>
            <Input type="number" value={form.monthly_saas_budget} onChange={(e) => setForm({ ...form, monthly_saas_budget: e.target.value })} />
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate({ ...form, employee_count: Number(form.employee_count), monthly_saas_budget: Number(form.monthly_saas_budget) })} disabled={saveMutation.isPending} className="gap-2">
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border/60 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm">Notification Preferences</h2>
        </div>
        <div className="space-y-3">
          {["Weekly digest email", "Inactive user alerts", "Cost spike alerts"].map((pref) => (
            <label key={pref} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              <span className="text-sm">{pref}</span>
            </label>
          ))}
        </div>
      </motion.div>
    </div>
  );
}