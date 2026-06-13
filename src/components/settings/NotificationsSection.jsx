import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const PREFS = [
  { key: "notif_weekly_digest", label: "Weekly digest email", description: "Summary of spend, waste, and new recommendations every Monday." },
  { key: "notif_inactive_alerts", label: "Inactive user alerts", description: "Alert when a licensed user hasn't logged in for 30+ days." },
  { key: "notif_cost_spike", label: "Cost spike alerts", description: "Alert when monthly SaaS spend exceeds your alert threshold." },
  { key: "notif_renewal_reminders", label: "Renewal reminders", description: "Email 30 days before any contract auto-renews." },
  { key: "notif_audit_complete", label: "Audit completion", description: "Notify when a monitoring report is ready." },
];

export default function NotificationsSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const company = companies[0];

  const [prefs, setPrefs] = useState({
    notif_weekly_digest: true,
    notif_inactive_alerts: true,
    notif_cost_spike: true,
    notif_renewal_reminders: true,
    notif_audit_complete: false,
  });

  useEffect(() => {
    if (company) {
      const saved = {};
      PREFS.forEach(({ key }) => {
        saved[key] = company[key] !== undefined ? company[key] : prefs[key];
      });
      setPrefs(saved);
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: (data) => company
      ? base44.entities.Company.update(company.id, data)
      : base44.entities.Company.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); toast({ title: "Notification preferences saved" }); },
  });

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm">Notification Preferences</h2>
      </div>

      <div className="space-y-3">
        {PREFS.map(({ key, label, description }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={!!prefs[key]}
              onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
              className="w-4 h-4 mt-0.5 rounded accent-primary flex-shrink-0"
            />
            <div>
              <p className="text-sm font-medium group-hover:text-primary transition-colors">{label}</p>
              <p className="text-[11px] text-muted-foreground">{description}</p>
            </div>
          </label>
        ))}
      </div>

      <Button onClick={() => saveMutation.mutate(prefs)} disabled={saveMutation.isPending} className="gap-2">
        <Save className="w-4 h-4" />
        {saveMutation.isPending ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
}