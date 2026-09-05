const questions = [
  ["What software are we paying for?", "Build a centralized view of applications, subscriptions, owners, and costs."],
  ["Who's actually using it?", "See verified usage where reliable evidence exists—and know when it doesn't."],
  ["Where could we be wasting money?", "Surface unused licenses, overlapping tools, renewal opportunities, and other areas that deserve review."],
  ["What should we do about it?", "Turn findings into decisions: Keep, Reduce, Renegotiate, Cancel, Replace, or Investigate."],
  ["Did the decision actually help?", "Track actions and their financial impact over time."],
];

export default function DecisionQuestionsSection() {
  return <section id="product" className="mx-auto max-w-7xl px-4 py-20 sm:px-6"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-primary">Everything you need to make a better software decision</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Start with the questions your business needs answered.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">{questions.map(([title,body])=><article key={title} className="rounded-2xl border bg-card p-5"><h3 className="font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</div><div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm font-black uppercase tracking-widest text-primary">{["See","Understand","Decide","Act","Measure"].map((step,index)=><span key={step} className="flex items-center gap-3"><span>{step}</span>{index<4&&<span aria-hidden="true" className="text-muted-foreground">→</span>}</span>)}</div></section>;
}