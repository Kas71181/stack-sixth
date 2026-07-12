import { useState } from "react";
import { motion } from "framer-motion";
import { Presentation, Loader2, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportRoadmapToPptx, THEMES } from "@/utils/exportRoadmapToPptx";

const themeStyles = {
  cost: {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500",
    light: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
    ring: "ring-emerald-500/20",
  },
  usage: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500",
    light: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800/40",
    ring: "ring-blue-500/20",
  },
  governance: {
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500",
    light: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800/40",
    ring: "ring-violet-500/20",
  },
};

const months = ["July", "August", "September"];

export default function Roadmap() {
  const [exporting, setExporting] = useState(false);
  const [view, setView] = useState("themes");

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportRoadmapToPptx();
    } finally {
      setExporting(false);
    }
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35 },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="badge-pill bg-primary/10 text-primary">Q3 2026</span>
          </div>
          <h1 className="text-page mb-1">Product Roadmap</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Three focus areas driving measurable IT outcomes this quarter — cost recovery, live usage intelligence, and governance.
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="btn-glow shrink-0">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
          {exporting ? "Generating…" : "Export to Slides"}
        </Button>
      </motion.div>

      {/* View toggle */}
      <motion.div {...fadeUp(0.05)} className="flex gap-1 tab-track p-1 w-fit">
        {[
          { key: "themes", label: "By Theme" },
          { key: "timeline", label: "By Month" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              view === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Themes view */}
      {view === "themes" && (
        <div className="space-y-6">
          {THEMES.map((theme, ti) => {
            const s = themeStyles[theme.key];
            return (
              <motion.div
                key={theme.key}
                {...fadeUp(0.08 + ti * 0.06)}
                className="glass-card overflow-hidden"
              >
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.bg}`} />
                  <div>
                    <h2 className="text-card-title">{theme.name}</h2>
                    <p className="text-xs text-muted-foreground">{theme.tagline}</p>
                  </div>
                </div>
                <div className="divide-y divide-border/30">
                  {theme.initiatives.map((init, ii) => (
                    <div key={ii} className="flex gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col items-center gap-1 shrink-0 w-14">
                        <span className={`badge-pill ${s.light} ${s.color} ${s.border} border`}>{init.month}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-0.5">{init.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{init.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Timeline view */}
      {view === "timeline" && (
        <motion.div {...fadeUp(0.08)} className="glass-card overflow-hidden">
          <div className="grid grid-cols-3 border-b border-border/40">
            {months.map((month) => (
              <div key={month} className="px-5 py-3 text-center border-l border-border/30 first:border-l-0">
                <span className="font-bold text-sm">{month}</span>
                <p className="text-xs text-muted-foreground">2026</p>
              </div>
            ))}
          </div>
          {THEMES.map((theme, ti) => {
            const s = themeStyles[theme.key];
            return (
              <div key={theme.key} className="grid grid-cols-3 border-t border-border/30">
                {theme.initiatives.map((init, ii) => (
                  <div
                    key={ii}
                    className={`px-4 py-4 border-l border-border/30 first:border-l-0 ${s.light} border-t-2`}
                    style={{ borderTopColor: undefined }}
                  >
                    <div className={`h-1 w-full ${s.bg} rounded-full mb-3`} />
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.bg}`} />
                      <span className={`text-xs font-bold ${s.color}`}>{theme.name}</span>
                    </div>
                    <h3 className="font-semibold text-xs mb-1 leading-snug">{init.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{init.desc}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Outcome card */}
      <motion.div {...fadeUp(0.2)} className="glass-card p-6">
        <h2 className="text-section mb-4">The Outcome</h2>
        <div className="space-y-3">
          {[
            "Every dollar of SaaS spend traced to a live, verified user — not an estimate.",
            "Offboarded employees' seats flagged and reclaimed within days, not quarters.",
            "Every purchase request auto-evaluated against policy before it hits a credit card.",
            "A single dashboard IT leaders trust for cost, usage, and compliance — demoed today.",
          ].map((text, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-foreground/80 pt-0.5">{text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}