import { ArrowRight } from "lucide-react";

const examples = [
  ["Slack", "5 seats show no verified activity for 60+ days.", "Potential impact: $900/year", "Review seats"],
  ["HubSpot", "Annual renewal in 34 days.", "Current annual cost: $14,400", "Prepare for renewal"],
  ["Calendly + Chili Piper", "Potential functional overlap detected.", "Two tools deserve comparison", "Compare tools"],
];

export default function AttentionSection() {
  return <section className="bg-slate-50 px-4 py-20 dark:bg-slate-950/40"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-widest text-primary">Product outcome</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Stack Sixth tells you what deserves your attention.</h2><p className="mt-3 text-sm text-muted-foreground">Illustrative examples—not validated customer results.</p><div className="mt-10 grid gap-4 lg:grid-cols-3">{examples.map(([name,signal,impact,action])=><article key={name} className="rounded-2xl border bg-background p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-primary">Decision to review</p><h3 className="mt-3 text-xl font-black">{name}</h3><p className="mt-4 text-sm leading-6">{signal}</p><p className="mt-2 text-sm font-bold">{impact}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">{action} <ArrowRight className="h-4 w-4"/></span></article>)}</div><p className="mt-8 text-xl font-bold">You shouldn't have to become a SaaS-management expert to manage your software.</p></div></section>;
}