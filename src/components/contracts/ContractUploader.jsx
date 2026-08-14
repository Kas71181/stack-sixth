import { useRef, useState } from "react";
import { Check, Circle, FileText, Loader2, LockKeyhole, Sparkles, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";

export default function ContractUploader({ onComplete, onCancel }) {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [stage, setStage] = useState("idle");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [details, setDetails] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setDetails((current) => ({ ...current, [key]: value }));
  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return setError("Choose a file smaller than 20MB.");
    setError(""); setFileName(file.name); setStage("uploading");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url); setStage("extracting");
    const response = await base44.functions.invoke("extractContract", { file_url });
    if (!response.data?.success) { setStage("idle"); return setError(response.data?.error || "We couldn't read this contract."); }
    setDetails(response.data.extracted); setStage("review");
  };
  const save = async () => {
    setStage("saving");
    const days = details.renewal_date ? Math.ceil((new Date(details.renewal_date) - new Date()) / 86400000) : 999;
    const contract = await base44.entities.Contract.create({ ...details, monthly_cost: Number(details.monthly_cost) || 0, annual_cost: Number(details.annual_cost) || 0, notice_period_days: details.notice_period_days ? Number(details.notice_period_days) : undefined, file_url: fileUrl, renewal_source: "contract", needs_confirmation: false, decision_state: "undecided", status: days < 0 ? "Expired" : days <= 60 ? "Expiring Soon" : "Active" });
    if (user?.role === "admin") await base44.entities.AuditTrailEvent.create({ entity_type: "Contract", entity_id: contract.id, entity_label: contract.vendor_name, action: "created", actor_name: user.full_name || user.email, actor_email: user.email, new_value: contract.renewal_date || "Date not found", note: "Contract uploaded and renewal details confirmed." });
    onComplete();
  };
  const processing = stage === "uploading" || stage === "extracting";
  return <Dialog open onOpenChange={(open) => !open && onCancel()}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Extract renewal details</DialogTitle><DialogDescription>Upload a contract and Governance will identify important dates, renewal terms, and relevant information.</DialogDescription></DialogHeader>
    {stage === "idle" && <div onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }} onDragOver={(e) => e.preventDefault()} className="rounded-2xl border-2 border-dashed border-border p-9 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"><Upload className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 text-sm font-bold">Drop your contract here</p><p className="mt-1 text-xs text-muted-foreground">PDF or DOCX up to 20MB</p><input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} /><Button className="mt-4" variant="outline" onClick={() => inputRef.current?.click()}>Browse files</Button></div>}
    {processing && <div className="py-7"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div><div><p className="text-sm font-bold">Analyzing contract</p><p className="text-xs text-muted-foreground">{fileName}</p></div></div><div className="mt-5 space-y-2 text-xs">{["Reading document", "Identifying contract details", "Finding renewal dates", "Checking notice periods"].map((label, index) => { const done = stage === "extracting" && index < 2; const active = (stage === "uploading" && index === 0) || (stage === "extracting" && index === 2); return <p key={label} className="flex items-center gap-2">{done ? <Check className="h-4 w-4 text-emerald-600" /> : active ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground/40" />}{label}</p>; })}</div></div>}
    {stage === "review" && details && <div className="space-y-4"><div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3"><FileText className="h-5 w-5 text-primary" /><div><p className="text-sm font-bold">{details.vendor_name}</p><p className="text-xs text-muted-foreground">AI extraction ready for confirmation</p></div>{details.renewal_confidence != null && <span className="ml-auto text-xs font-semibold">{details.renewal_confidence}% confidence</span>}</div>
      {editing ? <div className="grid gap-3 sm:grid-cols-2"><Input aria-label="Vendor" value={details.vendor_name || ""} onChange={(e) => set("vendor_name", e.target.value)} /><Input aria-label="Contract name" value={details.contract_name || ""} onChange={(e) => set("contract_name", e.target.value)} /><Input aria-label="Renewal date" type="date" value={details.renewal_date || ""} onChange={(e) => set("renewal_date", e.target.value)} /><Input aria-label="Notice period" type="number" placeholder="Notice period (days)" value={details.notice_period_days || ""} onChange={(e) => set("notice_period_days", e.target.value)} /><Input aria-label="Annual value" type="number" placeholder="Annual value" value={details.annual_cost || ""} onChange={(e) => set("annual_cost", e.target.value)} /></div> : <dl className="grid grid-cols-2 gap-3">{[["Renewal date", details.renewal_date || "Not found"], ["Notice period", details.notice_period_days ? `${details.notice_period_days} days` : "Not found"], ["Auto-renewal", details.auto_renews == null ? "Not found" : details.auto_renews ? "Yes" : "No"], ["Contract value", details.annual_cost ? `$${details.annual_cost.toLocaleString()} / year` : "Not found"]].map(([label, value]) => <div key={label} className="rounded-xl border p-3"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-xs font-semibold">{value}</dd></div>)}</dl>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setEditing((value) => !value)}>{editing ? "Done reviewing" : "Review details"}</Button><Button onClick={save}><Sparkles className="h-4 w-4" />Add to renewals</Button></div></div>}
    {stage === "saving" && <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold"><Loader2 className="h-4 w-4 animate-spin text-primary" />Adding confirmed renewal…</div>}
    {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
    <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" />Nothing is added until you review and confirm the details.</p>
  </DialogContent></Dialog>;
}