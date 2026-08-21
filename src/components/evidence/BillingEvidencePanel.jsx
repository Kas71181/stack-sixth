import { useCallback, useEffect, useState } from "react";
import { MailSearch, ReceiptText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import BillingCandidateCard from "@/components/evidence/BillingCandidateCard";
import BillingInvoiceDialog from "@/components/evidence/BillingInvoiceDialog";

const GMAIL_CONNECTOR_ID = "6a2c11c93a60aebc9a354fd8";
export default function BillingEvidencePanel() {
  const [state, setState] = useState({ loading: true, connected: false, candidates: [], error: "" }); const [uploadOpen, setUploadOpen] = useState(false); const [confirming, setConfirming] = useState(""); const [confirmed, setConfirmed] = useState(new Set());
  const scan = useCallback(async () => { setState((current) => ({ ...current, loading: true, error: "" })); const authenticated = await base44.auth.isAuthenticated(); if (!authenticated) return setState({ loading: false, connected: false, candidates: [], error: "Sign in to connect billing evidence." }); const response = await base44.functions.invoke("detectRenewalsFromGmail", {}); setState({ loading: false, connected: response.data?.connected === true, candidates: response.data?.candidates || [], error: response.data?.error || "" }); }, []);
  useEffect(() => { scan(); }, [scan]);
  const connect = async () => { const url = await base44.connectors.connectAppUser(GMAIL_CONNECTOR_ID); const popup = window.open(url, "_blank"); const timer = window.setInterval(() => { if (!popup || popup.closed) { window.clearInterval(timer); scan(); } }, 500); };
  const confirm = async (candidate) => { setConfirming(candidate.source_record_id); const response = await base44.functions.invoke("confirmBillingEvidence", { candidate }); if (response.data?.success) setConfirmed((current) => new Set([...current, candidate.source_record_id])); setConfirming(""); };
  return <section className="glass-card p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold">Billing evidence</h3><p className="text-sm text-muted-foreground">Confirm invoices, receipts, renewals, and subscription discoveries from Gmail or private uploads.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setUploadOpen(true)}><ReceiptText className="h-4 w-4" />Upload invoice</Button>{!state.connected && <Button onClick={connect}><MailSearch className="h-4 w-4" />Connect Gmail</Button>}</div></div>
    {state.loading ? <p className="py-8 text-center text-sm text-muted-foreground">Scanning billing evidence…</p> : state.error && !state.connected ? <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{state.error}</p> : state.candidates.length ? <div className="mt-4 space-y-3">{state.candidates.map((candidate) => <BillingCandidateCard key={candidate.source_record_id} candidate={candidate} confirming={confirming === candidate.source_record_id} confirmed={confirmed.has(candidate.source_record_id)} onConfirm={confirm} />)}</div> : state.connected ? <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">No recent billing messages found.</p> : null}
    <BillingInvoiceDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onConfirmed={() => { setUploadOpen(false); scan(); }} />
  </section>;
}