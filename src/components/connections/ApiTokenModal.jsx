import { createPortal } from "react-dom";
import { KeyRound, Loader2, X } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ApiTokenModal({ tool, connector, onClose, onSaved }) {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (!token.trim()) return setError("Enter an API token.");
    setSaving(true); setError("");
    try {
      const service = connector?.id || tool.tool_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      await base44.functions.invoke("saveApiCredential", { service, api_key: token.trim(), integration_id: tool.id });
      if (connector?.functionName) {
        const sync = await base44.functions.invoke(connector.functionName, {});
        if (!sync.data?.success) throw new Error(sync.data?.error || "The token was saved but could not be verified.");
        await base44.entities.SaasIntegration.update(tool.id, {
          connection_status: "Connected", evidence_type: "live",
          last_synced: new Date().toISOString().slice(0, 10),
          evidence_checked_at: new Date().toISOString(), evidence_note: "Verified through an API token",
        });
      }
      onSaved();
    } catch (err) { setError(err?.response?.data?.error || err?.message || "Token could not be saved."); setSaving(false); }
  };
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="glass-strong relative w-full max-w-md p-5 animate-scale-in">
        <div className="mb-5 flex justify-between gap-4"><div><h2 className="font-bold">Authorize {tool.tool_name}</h2><p className="mt-1 text-sm text-muted-foreground">Paste a read-only API token. It is encrypted before storage and never displayed again.</p></div><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        <Input type="password" autoComplete="off" placeholder="Paste API token" value={token} onChange={(event) => setToken(event.target.value)} />
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" disabled={saving} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <KeyRound />}Save securely</Button></div>
      </div>
    </div>, document.body
  );
}