const audiences = [
  ["Founders & CEOs", "Know where your software dollars are going."],
  ["Finance & Operations", "Control spend, contracts, and renewals."],
  ["IT Leaders", "Understand applications, access, and available usage evidence without chasing spreadsheets."],
];

export default function AudienceSection() {
  return <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-primary">Built for growing businesses—not enterprise software-management teams</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">You've outgrown spreadsheets, but you're not building an entire software asset-management department.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{audiences.map(([title,body])=><article key={title} className="border-t-2 border-primary pt-5"><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</div><p className="mt-10 rounded-2xl bg-primary/5 p-5 text-center font-bold">Best suited for software-dependent businesses with approximately 20–250 employees.</p></section>;
}