import { Cable, FileText, PlusCircle, Layers3 } from "lucide-react";

const methods = [
  [Cable, "Connect your business systems", "Connect supported sources such as Google Workspace, Gmail, and other business applications."],
  [FileText, "Bring your financial evidence", "Invoices, subscriptions, and contracts help establish what your business actually pays for."],
  [PlusCircle, "Add what we can't see", "Add applications manually or provide supporting evidence when automated discovery isn't available."],
  [Layers3, "Stack Sixth connects the evidence", "Applications, costs, access, renewals, and available usage signals become one software intelligence layer."],
];

export default function DiscoverySection() {
  return <section id="integrations" className="bg-slate-50 px-4 py-20 dark:bg-slate-950/40"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-primary">How discovery works</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">See Your Software Stack—Even Without Enterprise SSO.</h2><p className="mt-4 text-muted-foreground">Stack Sixth brings together signals from the systems your business already uses to build a clearer picture of your software environment.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{methods.map(([Icon,title,body])=><article key={title} className="rounded-2xl border bg-background p-6"><Icon className="h-5 w-5 text-primary"/><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</div><div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6"><p className="font-bold">Don't have SSO? That's okay.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Stack Sixth doesn't require an enterprise identity stack to get started. It is built for businesses without an enterprise IT department.</p></div></div></section>;
}