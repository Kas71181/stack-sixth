import { Button } from "@/components/ui/button";

export default function RenewalEntryCard({ icon: Icon, title, description, action, onClick, featured, badge }) {
  return <article className={`relative flex h-full flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${featured ? "border-primary/30 shadow-sm" : "border-border"}`}>
    {badge && <span className="absolute right-4 top-4 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">{badge}</span>}
    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${featured ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}><Icon className="h-5 w-5" /></div>
    <h3 className="text-sm font-bold">{title}</h3><p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">{description}</p>
    <Button className="mt-5 w-full" variant={featured ? "default" : "outline"} onClick={onClick}>{action}</Button>
  </article>;
}