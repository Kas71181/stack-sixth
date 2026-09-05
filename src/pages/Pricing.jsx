import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import BillingToggle from "@/components/pricing/BillingToggle";
import PricingPlanCard from "@/components/pricing/PricingPlanCard";
import PartnerCodeField from "@/components/pricing/PartnerCodeField";
import PricingFAQ from "@/components/pricing/PricingFAQ";
import FeatureComparison from "@/components/pricing/FeatureComparison";
import { FALLBACK_PLANS } from "@/lib/pricingPlans";
import { trackAcquisition } from "@/lib/acquisitionEvents";
import usePlanCheckout from "@/hooks/usePlanCheckout";

export default function Pricing() {
  const { selectPlan, pendingPlan, checkoutError } = usePlanCheckout();
  const [interval, setInterval] = useState("monthly");
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [promo, setPromo] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  useEffect(() => { trackAcquisition("pricing_page_viewed"); base44.entities.PlanDefinition.list("sort_order", 10).then((data) => data.length && setPlans(data.map((plan) => { const marketing = FALLBACK_PLANS.find((item) => item.plan_key === plan.plan_key); return { ...plan, description: marketing?.description || plan.description, features: marketing?.features || plan.features, cta: marketing?.cta || plan.cta, popular: marketing?.popular || false }; }))).catch(() => null); }, []);
  const select = (plan) => { trackAcquisition("plan_selected", { plan: plan.plan_key, interval }); selectPlan({ plan, interval, promoCode: promo }); };
  return <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6"><div className="mx-auto max-w-3xl text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">One better software decision can pay for Stack Sixth.</p><h1 className="text-4xl font-black sm:text-5xl">Pricing built around better decisions.</h1><p className="mt-4 text-base leading-7 text-muted-foreground">Growing businesses can spend thousands every month across SaaS and AI tools. Start with a 30-day free trial • Card required • Cancel before trial ends to avoid billing.</p><div className="mt-7"><BillingToggle value={interval} onChange={setInterval} /></div></div><div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plans.filter((plan) => plan.active !== false && plan.plan_key !== "FREE_LAUNCH").map((plan) => <PricingPlanCard key={plan.plan_key} plan={plan} interval={interval} loading={pendingPlan === plan.plan_key} onSelect={select} />)}</div>{checkoutError && <p role="alert" className="mt-4 text-center text-sm text-destructive">{checkoutError}</p>}<button onClick={() => setShowComparison((value) => !value)} className="mx-auto mt-6 block text-sm font-semibold text-primary hover:underline">{showComparison ? "Hide feature comparison" : "Compare all features"}</button>{showComparison && <FeatureComparison />}<div className="mx-auto mt-10 max-w-xl"><PartnerCodeField onApply={(code) => { setPromo(code); sessionStorage.setItem("stackSixthPromoCode", code); trackAcquisition("promo_code_entered"); }} /></div><PricingFAQ /></main>;
}