import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Upload, ExternalLink, Key, Shield, ChevronRight, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCredentialGuide } from "@/lib/credentialGuides";
import { toast } from "sonner";

export default function ConnectToolModal({ tool, onClose }) {
  const qc = useQueryClient();
  const [method, setMethod] = useState("manual");
  const [form, setForm] = useState({ monthly_cost: "", licensed_seats: "", active_users: "" });
  const [copied, setCopied] = useState(false);

  const guide = getCredentialGuide(tool.name);

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

  const copySteps = () => {
    const text = guide.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Steps copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-all ${method === m ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground"}`}>
                {m === "manual" ? <><Upload className="w-3.5 h-3.5" /> Manual Entry</> : <><Key className="w-3.5 h-3.5" /> API / OAuth Guide</>}
              </button>
            ))}
          </div>

          {/* API / OAuth credential guide */}
          {method === "api" && (
            <div className="space-y-3">
              {/* Quick-link buttons */}
              <div className="flex flex-wrap gap-2">
                {guide.apiUrl && (
                  <a href={guide.apiUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                    <Key className="w-3.5 h-3.5" /> Get API Key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {guide.oauthUrl && (
                  <a href={guide.oauthUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground border border-border text-xs font-semibold hover:bg-accent/80 transition-colors">
                    <Shield className="w-3.5 h-3.5" /> Set Up OAuth
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {guide.docsUrl && (
                  <a href={guide.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-muted-foreground text-xs font-semibold hover:text-foreground transition-colors">
                    Docs <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Step-by-step instructions */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Steps</p>
                  <button onClick={copySteps} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <ol className="space-y-2">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="text-foreground leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Notes */}
              {guide.notes && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {guide.notes}
                </div>
              )}

              <p className="text-xs text-muted-foreground">Once you have your credentials, enter your cost & seat data below, then click Connect.</p>
            </div>
          )}

          {/* Always-visible cost/seat fields */}
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