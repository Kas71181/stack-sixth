import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PricingHeader from "@/components/pricing/PricingHeader";
import BillingToggle from "@/components/pricing/BillingToggle";
import PricingPlanCard from "@/components/pricing/PricingPlanCard";
import PartnerCodeField from "@/components/pricing/PartnerCodeField";
import PricingFAQ from "@/components/pricing/PricingFAQ";
import FeatureComparison from "@/components/pricing/FeatureComparison";
import { FALLBACK_PLANS } from "@/lib/pricingPlans";
import { trackAcquisition } from "@/lib/acquisitionEvents";

export default function Pricing() {
  const navigate = useNavigate();
  const [interval, setInterval] = useState("monthly");
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [promo, setPromo] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  useEffect(() => { trackAcquisition("pricing_page_viewed"); base44.entities.PlanDefinition.list("sort_order", 10).then((data) => data.length && setPlans(data.map((plan) => ({ ...FALLBACK_PLANS.find((item) => item.plan_key === plan.plan_key), ...plan })))).catch(() => null); }, []);
  const select = (plan) => { trackAcquisition("plan_selected", { plan: plan.plan_key, interval }); sessionStorage.setItem("stackSixthAccessChoice", JSON.stringify({ plan: plan.plan_key, billing_interval: interval, promo_code: promo })); navigate("/register"); };
  return <div className="min-h-screen bg-background"><PricingHeader /><main className="mx-auto max-w-7xl px-4 py-14 sm:px-6"><div className="mx-auto max-w-3xl text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Stack Sixth Pricing</p><h1 className="text-4xl font-black sm:text-5xl">Simple Pricing. Smarter Software Decisions.</h1><p className="mt-4 text-base leading-7 text-muted-foreground">Start free for 90 days. See what your software is costing, how it's being used, and where opportunities exist to optimize.</p><div className="mt-7"><BillingToggle value={interval} onChange={setInterval} /></div></div><div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">{plans.filter((plan) => plan.active !== false).map((plan) => <PricingPlanCard key={plan.plan_key} plan={plan} interval={interval} onSelect={select} />)}</div><button onClick={() => setShowComparison((value) => !value)} className="mx-auto mt-6 block text-sm font-semibold text-primary hover:underline">{showComparison ? "Hide feature comparison" : "Compare all features"}</button>{showComparison && <FeatureComparison />}<div className="mx-auto mt-10 max-w-xl"><PartnerCodeField onApply={(code) => { setPromo(code); sessionStorage.setItem("stackSixthPromoCode", code); trackAcquisition("promo_code_entered"); }} /></div><PricingFAQ /></main></div>;
}