import { Check } from "lucide-react";

export default function PricingPlanCard({ plan, interval, selected, recommended, onSelect }) {
  const enterprise = plan.plan_key === "ENTERPRISE";
  const price = interval === "annual" ? plan.annual_price : plan.monthly_price;
  const annualSave = plan.monthly_price && plan.annual_price ? plan.monthly_price * 12 - plan.annual_price : 0;
  return <article className={`relative flex h-full flex-col rounded-2xl border p-5 transition-all ${selected ? "border-primary bg-primary/5 shadow-glow-sm" : "border-border/70 bg-card/80 shadow-sm"} ${plan.popular ? "ring-2 ring-primary/20" : ""}`}>
    {plan.popular && <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">Most Popular</span>}
    {recommended && <span className="mb-2 w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Recommended for your size</span>}
    <h2 className="text-xl font-extrabold">{plan.name}</h2><p className="mt-1 min-h-10 text-xs text-muted-foreground">{plan.description || plan.target}</p>
    <div className="my-5">{enterprise ? <p className="text-3xl font-black">Custom</p> : <><p className="text-3xl font-black">${price?.toLocaleString()}<span className="text-sm font-medium text-muted-foreground">/{interval === "annual" ? "year" : "month"}</span></p>{interval === "annual" && <p className="mt-1 text-xs font-semibold text-emerald-600">Save ${annualSave.toLocaleString()} annually</p>}<p className="mt-2 text-xs font-semibold text-primary">90 days free · card required</p></>}</div>
    <ul className="mb-6 flex-1 space-y-2.5">{(plan.features || []).slice(0, 7).map((feature) => <li key={feature} className="flex gap-2 text-xs"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{feature}</li>)}</ul>
    <button onClick={() => onSelect(plan)} className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold active:scale-[0.96] ${plan.popular ? "bg-primary text-primary-foreground" : "border border-border bg-background"}`}>{plan.cta || (enterprise ? "Contact Sales" : `Start ${plan.name} Trial`)}</button>
  </article>;
}