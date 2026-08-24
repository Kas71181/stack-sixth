import { useState } from "react";
import { Navigate } from "react-router-dom";
import { BadgeDollarSign } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import PlansAdmin from "@/components/admin/PlansAdmin";
import PartnersAdmin from "@/components/admin/PartnersAdmin";
import CampaignsAdmin from "@/components/admin/CampaignsAdmin";
import CodesAdmin from "@/components/admin/CodesAdmin";
import PartnerPerformance from "@/components/admin/PartnerPerformance";
const tabs = ["Plans", "Partners", "Campaigns", "Codes", "Performance"];
export default function PricingPartners() {
  const { user } = useAuth(), [tab, setTab] = useState("Plans");
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <div className="space-y-6"><div><h1 className="flex items-center gap-2 text-2xl font-extrabold"><BadgeDollarSign className="h-6 w-6 text-primary" />Pricing & Partners</h1><p className="mt-1 text-sm text-muted-foreground">Manage plans, reusable partner campaigns, codes, and acquisition performance.</p></div><div className="tab-track flex w-fit">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{item}</button>)}</div>{tab === "Plans" && <PlansAdmin />}{tab === "Partners" && <PartnersAdmin />}{tab === "Campaigns" && <CampaignsAdmin />}{tab === "Codes" && <CodesAdmin />}{tab === "Performance" && <PartnerPerformance />}</div>;
}