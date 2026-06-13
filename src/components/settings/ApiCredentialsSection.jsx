import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Key, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const SERVICE_LABELS = {
  zoom: "Zoom",
  apollo: "Apollo.io",
  hubspot: "HubSpot",
  quickbooks: "QuickBooks",
  salesforce: "Salesforce",
};

export default function ApiCredentialsSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(null);

  const { data: creds = [], isLoading } = useQuery({
    queryKey: ["api-credentials"],
    queryFn: () => base44.entities.ApiCredential.list(),
  });

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