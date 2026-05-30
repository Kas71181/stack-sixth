import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConnectToolModal({ tool, onClose }) {
  const qc = useQueryClient();
  const [method, setMethod] = useState("manual");
  const [form, setForm] = useState({ monthly_cost: "", licensed_seats: "", active_users: "" });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SaasIntegration.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["integrations"] }); onClose(); },
  });

  const handleSave = () => {
    createMutation.mutate({
      tool_name: tool.name,
      category: tool.category,
      connection_status: method === "api" ? "Connected" : "Manual Upload",
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
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold">Connect {tool.name}</h2>
            <p className="text-xs text-muted-foreground">{tool.category}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Method selector */}
          <div className="flex gap-2">
            {["manual", "api"].map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${method === m ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground"}`}>
                {m === "manual" ? "Manual Entry" : "API / OAuth"}
              </button>
            ))}
          </div>

          {method === "api" && (
            <div className="bg-muted/40 rounded-xl p-4 text-sm text-muted-foreground">
              Native API integration coming soon. Use Manual Entry to get started immediately.
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs mb-1 block">Monthly Cost ($)</Label><Input type="number" value={form.monthly_cost} onChange={(e) => setForm({ ...form, monthly_cost: e.target.value })} placeholder="0" /></div>
            <div><Label className="text-xs mb-1 block">Licensed Seats</Label><Input type="number" value={form.licensed_seats} onChange={(e) => setForm({ ...form, licensed_seats: e.target.value })} placeholder="0" /></div>
            <div><Label className="text-xs mb-1 block">Active Users</Label><Input type="number" value={form.active_users} onChange={(e) => setForm({ ...form, active_users: e.target.value })} placeholder="0" /></div>
          </div>

          <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs text-primary hover:underline">
            <Upload className="w-3.5 h-3.5" />Download CSV template for user activity upload
          </button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending} className="flex-1">{createMutation.isPending ? "Saving..." : "Connect"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}