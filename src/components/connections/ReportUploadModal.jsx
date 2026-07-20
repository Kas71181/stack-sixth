import { createPortal } from "react-dom";
import { FileUp, Loader2, X } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReportUploadModal({ tool, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (!file) return setError("Choose a report first.");
    setSaving(true); setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.SaasIntegration.update(tool.id, {
        connection_status: "Manual Upload", evidence_type: "snapshot",
        evidence_file_uri: file_uri, evidence_checked_at: new Date().toISOString(),
        evidence_note: `Private report uploaded: ${file.name}`,
      });
      onSaved();
    } catch (err) { setError(err?.message || "Upload failed."); setSaving(false); }
  };
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="glass-strong relative w-full max-w-md p-5 animate-scale-in">
        <div className="mb-5 flex justify-between gap-4"><div><h2 className="font-bold">Upload {tool.tool_name} report</h2><p className="mt-1 text-sm text-muted-foreground">Stored privately as snapshot evidence.</p></div><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        <Input type="file" accept=".csv,.xlsx,.xls,.json,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-5 flex gap-3"><Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" disabled={saving} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <FileUp />}Upload privately</Button></div>
      </div>
    </div>, document.body
  );
}