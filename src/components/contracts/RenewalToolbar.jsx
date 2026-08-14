import { List, Search, Waypoints } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const filters = ["All", "Upcoming", "Overdue", "This month", "This quarter", "Auto-renewing", "Needs attention"];
export default function RenewalToolbar({ search, setSearch, filter, setFilter, sort, setSort, view, setView }) {
  return <div className="space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search renewals" className="pl-9" placeholder="Search software, vendors or contracts..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <select aria-label="Sort renewals" className="h-9 rounded-lg border border-input bg-background px-3 text-xs" value={sort} onChange={(e) => setSort(e.target.value)}><option value="date">Renewal date</option><option value="vendor">Vendor</option><option value="value">Contract value</option></select>
      <div className="flex rounded-lg border p-0.5"><Button aria-label="List view" size="icon" variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")}><List /></Button><Button aria-label="Timeline view" size="icon" variant={view === "timeline" ? "secondary" : "ghost"} onClick={() => setView("timeline")}><Waypoints /></Button></div>
    </div>
    <div className="flex gap-1 overflow-x-auto pb-1">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${filter === item ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{item}</button>)}</div>
  </div>;
}