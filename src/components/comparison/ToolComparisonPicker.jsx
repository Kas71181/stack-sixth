import { Library, Search, X } from "lucide-react";

export default function ToolComparisonPicker({ tools, selected, query, onQuery, onToggle }) {
  const selectedIds = new Set(selected.map((tool) => tool.id));
  return (
    <div className="glass-card p-4">
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search your stack or the software catalog" className="h-11 w-full rounded-xl border border-input bg-background/70 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/25" /></div>
      <div className="mt-3 flex flex-wrap gap-2">{selected.map((tool) => <button key={tool.id} onClick={() => onToggle(tool)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground active:scale-[0.96]">{tool.name}<X className="h-3.5 w-3.5" /></button>)}</div>
      <div className="mt-4 max-h-64 space-y-1 overflow-y-auto">
        {tools.map((tool) => { const active = selectedIds.has(tool.id); const blocked = !active && selected.length >= 4; return <button key={tool.id} disabled={blocked} onClick={() => onToggle(tool)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-muted/60 active:scale-[0.99] disabled:opacity-40"><span><span className="block text-sm font-semibold">{tool.name}</span><span className="text-xs text-muted-foreground">{tool.category} · {tool.source}</span></span><Library className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} /></button>; })}
        {!tools.length && <p className="py-6 text-center text-sm text-muted-foreground">No matching tools found.</p>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Select up to four tools. Catalog prices are directional estimates and should be verified with the vendor.</p>
    </div>
  );
}