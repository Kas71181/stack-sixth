import { Activity, BadgeCheck, Eye, CircleHelp } from "lucide-react";

const levels = [
  [Activity, "Verified Live", "Recent activity has been verified."],
  [BadgeCheck, "Verified Access", "Access or a seat has been confirmed, but usage hasn't."],
  [Eye, "Observed", "Supporting evidence indicates activity."],
  [CircleHelp, "Insufficient Evidence", "We don't have enough evidence to make a usage claim."],
];

export default function EvidencePrincipleSection() {
  return <section id="evidence" className="bg-slate-950 px-4 py-20 text-white"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-cyan-300">Software decisions should be based on evidence—not assumptions.</p><h2 className="mt-4 text-4xl font-black sm:text-5xl">No Evidence. No Claim.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Stack Sixth distinguishes between what we know, what we can observe, and what we cannot yet verify.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{levels.map(([Icon,title,body])=><article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="h-5 w-5 text-cyan-300"/><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></article>)}</div><p className="mt-8 max-w-3xl text-lg font-semibold">A connection doesn't automatically mean usage. And missing data doesn't automatically mean waste.</p></div></section>;
}