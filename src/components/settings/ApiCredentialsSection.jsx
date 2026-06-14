import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Key, Trash2, CheckCircle2, AlertCircle, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

const SERVICE_LABELS = {
  zoom: "Zoom",
  apollo: "Apollo.io",
  hubspot: "HubSpot",
  quickbooks: "QuickBooks",
  salesforce: "Salesforce",
  slack_bot: "Slack Bot",
  linear: "Linear",
};

const QUICK_ADD_SERVICES = [
  { id: "slack_bot", label: "Slack Bot Token", placeholder: "xoxb-...", hint: "Create a Slack App → Bot Token", url: "https://api.slack.com/apps" },
  { id: "linear", label: "Linear API Key", placeholder: "lin_api_...", hint: "Linear → Settings → API → Personal API keys", url: "https://linear.app/settings/api" },
];

export default function ApiCredentialsSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(null);
  const [quickAdd, setQuickAdd] = useState({}); // { [serviceId]: { value, saving } }

  const { data: creds = [], isLoading } = useQuery({
    queryKey: ["api-credentials"],
    queryFn: () => base44.entities.ApiCredential.list(),
  });

  const handleQuickSave = async (svc) => {
    const val = quickAdd[svc.id]?.value?.trim();
    if (!val) return sonnerToast.error("Enter a value first");
    setQuickAdd((prev) => ({ ...prev, [svc.id]: { ...prev[svc.id], saving: true } }));
    await base44.functions.invoke("saveApiCredential", { service: svc.id, api_key: val });
    qc.invalidateQueries({ queryKey: ["api-credentials"] });
    setQuickAdd((prev) => ({ ...prev, [svc.id]: { value: "", saving: false } }));
    sonnerToast.success(`${svc.label} saved`);
  };

  const handleDelete = async (cred) => {
    setDeleting(cred.id);
    await base44.entities.ApiCredential.delete(cred.id);
    qc.invalidateQueries({ queryKey: ["api-credentials"] });
    toast({ title: `${SERVICE_LABELS[cred.service] || cred.service} credentials removed` });
    setDeleting(null);
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Key className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm">Saved API Credentials</h2>
      </div>
      <p className="text-xs text-muted-foreground">These are credentials saved for live data connectors. Remove any you no longer want stored.</p>

      {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}

      {!isLoading && creds.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No API credentials saved yet. Connect tools from the IT Dashboard → Live Data tab.</p>
        </div>
      )}

      {/* Quick-add for Slack bot + Linear */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <p className="text-xs font-semibold text-muted-foreground">Quick Add</p>
        {QUICK_ADD_SERVICES.filter((svc) => !creds.some((c) => c.service === svc.id)).map((svc) => (
          <div key={svc.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder={svc.placeholder}
                value={quickAdd[svc.id]?.value || ""}
                onChange={(e) => setQuickAdd((prev) => ({ ...prev, [svc.id]: { ...prev[svc.id], value: e.target.value } }))}
                className="flex-1 h-8 text-xs"
              />
              <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => handleQuickSave(svc)} disabled={quickAdd[svc.id]?.saving}>
                <Save className="w-3 h-3" /> Save {svc.label}
              </Button>
            </div>
            <a href={svc.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">{svc.hint} →</a>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {creds.map((cred) => (
          <div key={cred.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">{SERVICE_LABELS[cred.service] || cred.service}</p>
                <p className="text-[11px] text-muted-foreground">
                  {cred.api_key ? `Token: ••••••••${cred.api_key.slice(-4)}` : "Token saved"}
                  {cred.extra_fields && Object.keys(cred.extra_fields).length > 0
                    ? ` · ${Object.keys(cred.extra_fields).join(", ")}`
                    : ""}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
              onClick={() => handleDelete(cred)}
              disabled={deleting === cred.id}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}