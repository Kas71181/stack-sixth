import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, BarChart3, FileText, Package, Monitor, ArrowLeftRight, Activity, DollarSign } from "lucide-react";

const STATIC_ROUTES = [
  { label: "Dashboard", path: "/", icon: Monitor, group: "Pages" },
  { label: "New Audit", path: "/audit", icon: BarChart3, group: "Pages" },
  { label: "Audit History", path: "/history", icon: FileText, group: "Pages" },
  { label: "IT Manager", path: "/it-dashboard", icon: Monitor, group: "Pages" },
  { label: "Monitoring", path: "/monitoring", icon: Activity, group: "Pages" },
  { label: "Switch Planner", path: "/switch-planner", icon: ArrowLeftRight, group: "Pages" },
  { label: "Contracts", path: "/contracts", icon: DollarSign, group: "Pages" },
  { label: "Usage Analytics", path: "/it-dashboard", state: { tab: "usage" }, icon: Activity, group: "Pages" },
  { label: "Tool Stack", path: "/it-dashboard", state: { tab: "tools" }, icon: Package, group: "Pages" },
  { label: "Benchmarks", path: "/it-dashboard", state: { tab: "benchmarks" }, icon: BarChart3, group: "Pages" },
  { label: "Integrations", path: "/it-dashboard", state: { tab: "integrations" }, icon: Monitor, group: "Pages" },
  { label: "Role Relevance", path: "/it-dashboard", state: { tab: "roles" }, icon: Monitor, group: "Pages" },
];

export default function GlobalSearch({ audits = [], recommendations = [], tools = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Dynamic results built from live data
  const dynamicItems = [
    ...audits.map((a) => ({
      label: a.company_name,
      sub: `Audit · ${a.existing_software?.length || 0} tools`,
      path: `/results/${a.id}`,
      icon: BarChart3,
      group: "Audits",
    })),
    ...recommendations.slice(0, 30).map((r) => ({
      label: r.tool_name,
      sub: `Recommendation · ${r.category}`,
      path: "/it-dashboard",
      state: { tab: "decisions" },
      icon: DollarSign,
      group: "Recommendations",
    })),
    ...tools.map((t) => ({
      label: t.tool_name || t.name,
      sub: `Tool · ${t.category || ""}`,
      path: "/it-dashboard",
      state: { tab: "tools" },
      icon: Package,
      group: "Tools",
    })),
  ];

  const allItems = [...STATIC_ROUTES, ...dynamicItems];

  const results = query.trim().length < 1
    ? STATIC_ROUTES.slice(0, 6)
    : allItems.filter((item) =>
        (item.label + " " + (item.sub || "") + " " + item.group)
          .toLowerCase()
          .includes(query.toLowerCase())
      ).slice(0, 8);

  // CMD+K / CTRL+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [open]);

  const go = (item) => {
    setOpen(false);
    navigate(item.path, item.state ? { state: item.state } : undefined);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/50 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Search</span>
        <kbd className="hidden md:inline text-[10px] font-mono bg-background border border-border/60 rounded px-1 py-0.5 ml-1">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, audits, tools, recommendations…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <button onClick={() => setOpen(false)}>
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>

        {/* Results */}
        <div className="py-2 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No results for "{query}"</p>
          ) : (
            (() => {
              const groups = [...new Set(results.map((r) => r.group))];
              return groups.map((group) => (
                <div key={group}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-1">{group}</p>
                  {results.filter((r) => r.group === group).map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => go(item)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          {item.sub && <p className="text-xs text-muted-foreground truncate">{item.sub}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ));
            })()
          )}
        </div>

        <div className="border-t border-border/60 px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span><kbd className="font-mono bg-muted border border-border/60 rounded px-1">↵</kbd> to open</span>
          <span><kbd className="font-mono bg-muted border border-border/60 rounded px-1">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}