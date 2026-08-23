import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, isSameMonth } from "date-fns";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import ContractUploader from "@/components/contracts/ContractUploader";
import ManualRenewalForm from "@/components/contracts/ManualRenewalForm";
import RenewalActionHeader from "@/components/contracts/RenewalActionHeader";
import RenewalOverviewStrip from "@/components/contracts/RenewalOverviewStrip";
import RenewalDetectionPanel from "@/components/contracts/RenewalDetectionPanel";
import RenewalActionPanel from "@/components/contracts/RenewalActionPanel";
import RenewalEmptyState from "@/components/contracts/RenewalEmptyState";
import RenewalInsights from "@/components/contracts/RenewalInsights";
import RenewalTimeline from "@/components/contracts/RenewalTimeline";
import RenewalToolbar from "@/components/contracts/RenewalToolbar";
import RenewalList from "@/components/contracts/RenewalList";
import RenewalLoading from "@/components/contracts/RenewalLoading";
import useDiscountOpportunities from "@/hooks/useDiscountOpportunities";

const CONNECTOR_ID = "6a2c11c93a60aebc9a354fd8";
export default function ContractIntelligence() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showUploader, setShowUploader] = useState(false), [showManual, setShowManual] = useState(false), [gmailKey, setGmailKey] = useState(0);
  const [search, setSearch] = useState(""), [filter, setFilter] = useState("All"), [sort, setSort] = useState("date"), [view, setView] = useState("list");
  const query = useQuery({ queryKey: ["contracts", user?.id], queryFn: () => base44.entities.Contract.filter({ created_by_id: user.id }, "renewal_date", 100), enabled: !!user?.id });
  const contracts = query.data || [];
  const { data: discountData } = useDiscountOpportunities(contracts.map((contract) => contract.vendor_name));
  const offersByTool = discountData?.by_tool || {};
  const refresh = () => qc.invalidateQueries({ queryKey: ["contracts", user?.id] });
  const connectGmail = async () => { const popup = window.open("", "_blank"); const url = await base44.connectors.connectAppUser(CONNECTOR_ID); if (!popup) return toast.error("Please allow pop-ups to connect Gmail."); popup.location.href = url; const timer = setInterval(() => { if (popup.closed) { clearInterval(timer); setGmailKey((key) => key + 1); } }, 500); };
  const dueReminders = contracts.filter((c) => c.reminder_date && c.reminder_date <= new Date().toISOString().split("T")[0] && !c.reminder_dismissed && c.status !== "Cancelled");
  const visible = useMemo(() => {
    const now = new Date(), term = search.trim().toLowerCase();
    const rows = contracts.filter((c) => {
      const days = c.renewal_date ? differenceInDays(new Date(`${c.renewal_date}T12:00:00`), now) : null;
      const match = !term || [c.vendor_name, c.contract_name, c.contract_type].some((value) => value?.toLowerCase().includes(term));
      if (!match) return false;
      if (filter === "Upcoming") return c.status !== "Cancelled" && days !== null && days >= 0;
      if (filter === "Overdue") return c.status !== "Cancelled" && days !== null && days < 0;
      if (filter === "This month") return c.status !== "Cancelled" && c.renewal_date && isSameMonth(new Date(`${c.renewal_date}T12:00:00`), now);
      if (filter === "This quarter") return c.status !== "Cancelled" && days !== null && days >= 0 && days <= 90;
      if (filter === "Auto-renewing") return c.status !== "Cancelled" && c.auto_renews;
      if (filter === "Needs attention") return c.status !== "Cancelled" && (!c.decision_state || c.decision_state === "undecided") && (c.needs_confirmation || (days !== null && (days < 0 || days <= (c.notice_period_days || 7))));
      return true;
    });
    return rows.sort((a, b) => sort === "vendor" ? a.vendor_name.localeCompare(b.vendor_name) : sort === "value" ? (b.annual_cost || (b.monthly_cost || 0) * 12) - (a.annual_cost || (a.monthly_cost || 0) * 12) : (a.renewal_date || "9999").localeCompare(b.renewal_date || "9999"));
  }, [contracts, filter, search, sort]);
  const created = () => { refresh(); setShowManual(false); toast.success("Renewal added"); };
  const uploaded = () => { refresh(); setShowUploader(false); toast.success("Confirmed renewal added"); };

  return <div className="space-y-5"><RenewalActionHeader onAdd={() => setShowManual((open) => !open)} onUpload={() => setShowUploader(true)} />
    {showUploader && <ContractUploader onComplete={uploaded} onCancel={() => setShowUploader(false)} />}
    {showManual && <ManualRenewalForm onCreated={created} onCancel={() => setShowManual(false)} />}
    {query.isLoading ? <RenewalLoading /> : query.isError ? <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center"><AlertCircle className="mx-auto h-6 w-6 text-destructive" /><p className="mt-2 text-sm font-bold">Renewals couldn’t be loaded</p><p className="mt-1 text-xs text-muted-foreground">Try again without losing your work.</p><Button className="mt-4" size="sm" variant="outline" onClick={() => query.refetch()}>Try again</Button></div> : <><RenewalOverviewStrip contracts={contracts} /><RenewalDetectionPanel key={gmailKey} onConfirmed={refresh} /><RenewalActionPanel reminders={dueReminders} onUpdated={refresh} />{contracts.length === 0 ? <RenewalEmptyState onAdd={() => setShowManual(true)} onUpload={() => setShowUploader(true)} onGmail={connectGmail} /> : <><RenewalInsights contracts={contracts} /><div><h2 className="mb-3 text-base font-bold">Upcoming renewals</h2><RenewalToolbar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} view={view} setView={setView} /></div>{view === "timeline" ? <RenewalTimeline contracts={visible} /> : <RenewalList contracts={visible} onUpdated={refresh} offersByTool={offersByTool} />}</>}</>}
  </div>;
}