import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function DangerZoneSection() {
  const { toast } = useToast();
  const [clearing, setClearing] = useState(false);
  const [confirm, setConfirm] = useState("");

  const handleExportData = async () => {
    const [activities, integrations, contracts] = await Promise.all([
      base44.entities.UserActivity.list(),
      base44.entities.SaasIntegration.list(),
      base44.entities.Contract.list(),
    ]);
    const payload = { exported_at: new Date().toISOString(), user_activity: activities, integrations, contracts };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stack-sixth-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported successfully" });
  };

  const handleClearActivity = async () => {
    if (confirm !== "DELETE") return;
    setClearing(true);
    const records = await base44.entities.UserActivity.list();
    await Promise.all(records.map((r) => base44.entities.UserActivity.delete(r.id)));
    setClearing(false);
    setConfirm("");
    toast({ title: "All user activity data cleared", variant: "destructive" });
  };

  return (
    <div className="glass-card p-6 space-y-4 border-destructive/30">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h2 className="font-bold text-sm text-destructive">Data & Danger Zone</h2>
      </div>

      {/* Export */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/20 border border-border/40">
        <div>
          <p className="text-sm font-semibold">Export All Data</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Download a JSON file with all your integrations, user activity, and contracts.</p>
        </div>
        <Button size="sm" variant="outline" className="gap-2 flex-shrink-0" onClick={handleExportData}>
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      {/* Clear activity */}
      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
        <div>
          <p className="text-sm font-semibold text-destructive">Clear All User Activity Data</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Permanently deletes all synced user activity records. This cannot be undone. Your integrations and contracts are kept.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="flex-1 h-8 px-3 rounded-lg border border-destructive/30 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-destructive/50"
          />
          <Button
            size="sm"
            variant="destructive"
            className="gap-2 flex-shrink-0"
            disabled={confirm !== "DELETE" || clearing}
            onClick={handleClearActivity}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {clearing ? "Clearing..." : "Clear Data"}
          </Button>
        </div>
      </div>
    </div>
  );
}