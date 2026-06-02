import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Upload, Zap, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OAuthConnectFlow from "./OAuthConnectFlow";

export default function ConnectToolModal({ tool, onClose }) {
  const qc = useQueryClient();
  const [method, setMethod] = useState("oauth"); // "oauth" | "manual"
  const [form, setForm] = useState({ monthly_cost: "", licensed_seats: "", active_users: "" });
  const [oauthDone, setOauthDone] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SaasIntegration.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["integrations"] }); onClose(); },
  });

  const handleSave = () => {
    createMutation.mutate({
      tool_name: tool.name,
      category: tool.category,
      connection_status: oauthDone ? "Connected" : "Manual Upload",
      monthly_cost: Number(form.monthly_cost) || null,
      licensed_seats: Number(form.licensed_seats) || null,
      active_users: Number(form.active_users) || null,
      last_synced: new Date().toISOString().split("T")[0],
    });
  };

  const downloadTemplate = () => {
    const csv = "user_email,user_name,last_active_date,days_active_last_30\nuser@example.com,John Doe,2024-01-15,18";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${tool.name.toLowerCase()}-users-template.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {tool.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold leading-tight">Connect {tool.name}</h2>
              <p className="text-xs text-muted-foreground">{tool.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Method tabs */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setMethod("oauth")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold border transition-all ${method === "oauth" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Zap className="w-3.5 h-3.5" /> Connect via OAuth
            </button>
            <button
              onClick={() => setMethod("manual")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold border transition-all ${method === "manual" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"}`}
            >
              <ClipboardList className="w-3.5 h-3.5" /> Manual Entry
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">

          {/* OAuth flow */}
          {method === "oauth" && (
            <OAuthConnectFlow tool={tool} onSuccess={() => setOauthDone(true)} />
          )}

          {/* Manual entry */}
          {method === "manual" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Enter your cost and seat data manually. You can always upgrade to OAuth later.</p>
              <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs text-primary hover:underline">
                <Upload className="w-3.5 h-3.5" /> Download CSV template for user activity upload
              </button>
            </div>
          )}

          {/* Cost/seat fields — always shown */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tool Details</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Monthly Cost ($)</Label>
                <Input type="number" value={form.monthly_cost} onChange={(e) => setForm({ ...form, monthly_cost: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Licensed Seats</Label>
                <Input type="number" value={form.licensed_seats} onChange={(e) => setForm({ ...form, licensed_seats: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Active Users</Label>
                <Input type="number" value={form.active_users} onChange={(e) => setForm({ ...form, active_users: e.target.value })} placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={createMutation.isPending} className="flex-1">
            {createMutation.isPending ? "Saving…" : oauthDone ? "Save & Finish" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}