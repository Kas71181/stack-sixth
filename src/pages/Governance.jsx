import { ClipboardCheck, FileClock, History, RefreshCw, ShieldCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import GovernanceOverview from "@/components/governance/GovernanceOverview";
import PurchaseRequests from "@/pages/PurchaseRequests";
import ContractIntelligence from "@/pages/ContractIntelligence";
import LifecycleGovernance from "@/pages/LifecycleGovernance";
import AuditTrailPanel from "@/components/audit/AuditTrailPanel";

const TABS = [
  { key: "overview", label: "Overview", icon: ShieldCheck },
  { key: "purchases", label: "Purchases", icon: ClipboardCheck },
  { key: "renewals", label: "Renewals", icon: FileClock },
  { key: "lifecycle", label: "Lifecycle", icon: RefreshCw },
  { key: "history", label: "History", icon: History },
];

export default function Governance() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab = TABS.some((item) => item.key === requested) ? requested : "overview";
  const selectTab = (key) => setParams(key === "overview" ? {} : { tab: key }, { replace: true });
  return <div className="space-y-6">
    <div><div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /><h1 className="text-page">Governance</h1></div><p className="mt-1 text-sm text-muted-foreground">One control center for software requests, renewals, lifecycle decisions, ownership, and history.</p></div>
    <div className="tab-track flex gap-1 overflow-x-auto">{TABS.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => selectTab(key)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${tab === key ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-card/60 hover:text-foreground"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
    {tab === "overview" && <GovernanceOverview onSelect={selectTab} />}
    {tab === "purchases" && <PurchaseRequests embedded />}
    {tab === "renewals" && <ContractIntelligence embedded showAudit={false} />}
    {tab === "lifecycle" && <LifecycleGovernance embedded />}
    {tab === "history" && <div className="glass-card p-5"><AuditTrailPanel title="Governance decision history" /></div>}
  </div>;
}