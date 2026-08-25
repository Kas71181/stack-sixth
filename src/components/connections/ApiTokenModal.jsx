import { createPortal } from "react-dom";
import { KeyRound, Loader2, X } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import CredentialFields from "@/components/connections/CredentialFields";

export default function ApiTokenModal({ tool, connector, onClose, onSaved }) {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    const fields = connector?.credentialFields || [{ name: "api_key" }];
    if (fields.some((field) => !values[field.name]?.trim())) return setError("Complete every credential field.");
    setSaving(true); setError("");
    try {
      const service = connector?.id || tool.tool_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const extraFields = Object.fromEntries(fields.filter((field) => field.name !== "api_key").map((field) => [field.name, values[field.name].trim()]));
      await base44.functions.invoke("saveApiCredential", { service, api_key: values.api_key.trim(), extra_fields: extraFields, integration_id: tool.id });
      if (connector?.functionName) {
        const sync = await base44.functions.invoke(connector.functionName, {});
        if (!sync.data?.success) throw new Error(sync.data?.error || "The credentials were saved but could not be verified.");
        const evidenceType = sync.data.evidence_type || "live";
        await base44.entities.SaasIntegration.update(tool.id, {
          connection_status: evidenceType === "live" ? "Connected" : "Evidence", evidence_type: evidenceType,
          last_synced: new Date().toISOString().slice(0, 10),
          evidence_checked_at: new Date().toISOString(), evidence_note: sync.data.evidence_note || "Verified through API credentials",
        });
      }
      onSaved();
    } catch (err) { setError(err?.response?.data?.error || err?.message || "Token could not be saved."); setSaving(false); }
  };
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="glass-strong relative w-full max-w-md p-5 animate-scale-in">
        <div className="mb-5 flex justify-between gap-4"><div><h2 className="font-bold">Authorize {tool.tool_name}</h2><p className="mt-1 text-sm text-muted-foreground">Enter read-only credentials. They are encrypted before storage and never displayed again.</p></div><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        <CredentialFields connector={connector} values={values} onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))} />
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" disabled={saving} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <KeyRound />}Save securely</Button></div>
      </div>
    </div>, document.body
  );
}