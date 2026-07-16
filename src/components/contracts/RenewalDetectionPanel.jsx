import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MailSearch, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import RenewalSuggestion from "@/components/contracts/RenewalSuggestion";

const CONNECTOR_ID = "6a2c11c93a60aebc9a354fd8";
export default function RenewalDetectionPanel({ onConfirmed }) {
  const [connected, setConnected] = useState(null), [scanning, setScanning] = useState(false), [suggestions, setSuggestions] = useState([]), [confirming, setConfirming] = useState(null);
  const checkConnection = useCallback(async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return setConnected(false);
    const response = await base44.functions.invoke("detectRenewalsFromGmail", { checkOnly: true });
    setConnected(Boolean(response.data?.connected));
  }, []);
  useEffect(() => { checkConnection(); }, [checkConnection]);
  const connect = async () => {
    const popup = window.open("", "_blank");
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    if (!popup) return toast.error("Please allow pop-ups to connect Gmail.");
    popup.location.href = url;
    const timer = setInterval(() => { if (popup.closed) { clearInterval(timer); checkConnection(); } }, 500);
  };
  const scan = async () => {
    setScanning(true);
    const response = await base44.functions.invoke("detectRenewalsFromGmail", {});
    setScanning(false);
    if (response.data?.error) return toast.error(response.data.error);
    setSuggestions(response.data?.suggestions || []);
    if (!response.data?.suggestions?.length) toast.info("No clear renewal dates were found.");
  };
  const confirm = async (item) => {
    setConfirming(item.vendor_name);
    const days = Math.ceil((new Date(item.renewal_date) - new Date()) / 86400000);
    await base44.entities.Contract.create({ vendor_name: item.vendor_name, last_renewal_date: item.last_renewal_date, renewal_date: item.renewal_date, billing_frequency: item.billing_frequency, renewal_source: "gmail", renewal_confidence: item.renewal_confidence, contract_type: "Other", needs_confirmation: false, status: days <= 60 ? "Expiring Soon" : "Active" });
    setSuggestions((current) => current.filter((suggestion) => suggestion.vendor_name !== item.vendor_name));
    setConfirming(null); onConfirmed();
  };
  if (connected === null) return null;
  return <div className="glass-card space-y-3 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex-1"><p className="flex items-center gap-2 text-sm font-bold"><MailSearch className="h-4 w-4 text-primary" />Find renewals in Gmail</p><p className="mt-0.5 text-xs text-muted-foreground">Uses read-only Gmail access to scan invoice and renewal emails. Messages are not stored; every detected date requires confirmation.</p></div><Button size="sm" variant="outline" onClick={connected ? scan : connect} disabled={scanning} className="gap-1.5"><RefreshCw className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />{connected ? (scanning ? "Scanning…" : "Scan Gmail") : "Connect Gmail"}</Button></div>
    {suggestions.map((suggestion) => <RenewalSuggestion key={suggestion.vendor_name} suggestion={suggestion} confirming={confirming === suggestion.vendor_name} onConfirm={confirm} />)}
  </div>;
}