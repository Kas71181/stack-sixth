const items = [
  ["Do I need a credit card for Free Launch?", "No. Free Launch gives you 30 days of access without payment details."],
  ["What happens when free access ends?", "Your data remains intact and your workspace becomes read-only until you choose a paid plan."],
  ["Can I change plans later?", "Yes. Upgrade at any time without resetting your software inventory, evidence, or reports."],
  ["Will a partner promotion auto-renew?", "Not unless you explicitly add payment details and consent to renewal."],
  ["How does Stack Sixth verify savings?", "We only show usage, spend, and savings claims supported by your evidence. No evidence, no claim."]
];
export default function PricingFAQ() { return <section className="mx-auto max-w-3xl py-16"><h2 className="text-center text-2xl font-extrabold">Frequently asked questions</h2><div className="mt-8 divide-y divide-border rounded-2xl border border-border/60 bg-card/70 px-6">{items.map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer list-none text-sm font-bold">{question}<span className="float-right text-muted-foreground group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></section>; }