import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

const CATEGORIES = [
  { name: "Communication", benchmark: "Most SMBs spend $8–15/employee/month on Communication tools." },
  { name: "Project Management", benchmark: "Most SMBs spend $5–12/employee/month on Project Management." },
  { name: "CRM & Sales", benchmark: "Average SaaS spend on CRM is $25–50/seat/month." },
  { name: "Productivity & Docs", benchmark: "Google Workspace or M365 typically costs $12–22/user/month." },
  { name: "Analytics & BI", benchmark: "BI tools average $15–40/user/month for SMBs." },
  { name: "Marketing", benchmark: "Marketing stack averages $800–2,000/month for 50-person teams." },
  { name: "Customer Support", benchmark: "Support tools average $25–50/seat/month." },
  { name: "Identity & Security", benchmark: "Identity platforms like Okta run $4–8/user/month." },
  { name: "Dev Tools", benchmark: "Dev tools average $20–50/seat/month for engineering teams." },
  { name: "Finance & HR", benchmark: "HR and payroll tools average $8–15/employee/month." },
];

export default function CategoryExplorer() {
  const { data: integrations = [] } = useQuery({ queryKey: ["integrations"], queryFn: () => base44.entities.SaasIntegration.list() });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Category Explorer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat, idx) => {
          const tools = integrations.filter((i) => i.category === cat.name);
          const totalSpend = tools.reduce((s, t) => s + (t.monthly_cost || 0), 0);
          const avgUtil = tools.length > 0
            ? Math.round(tools.reduce((s, t) => s + (t.licensed_seats > 0 ? (t.active_users / t.licensed_seats) * 100 : 0), 0) / tools.length)
            : 0;
          const utilColor = avgUtil >= 70 ? "text-emerald-600" : avgUtil >= 40 ? "text-amber-600" : "text-red-600";

          return (
            <motion.div key={cat.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className="bg-card border border-border/60 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-bold text-sm">{cat.name}</h2>
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tools.length} tool{tools.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex gap-6 mb-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Spend</p>
                  <p className="text-xl font-bold font-mono">${totalSpend.toLocaleString()}</p>
                </div>
                {tools.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Utilization</p>
                    <p className={`text-xl font-bold ${utilColor}`}>{avgUtil}%</p>
                  </div>
                )}
              </div>
              {tools.length > 0 ? (
                <div className="space-y-1.5 mb-3">
                  {tools.map((t) => {
                    const util = t.licensed_seats > 0 ? Math.round((t.active_users / t.licensed_seats) * 100) : 0;
                    return (
                      <div key={t.id} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{t.tool_name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${util >= 70 ? "bg-emerald-500" : util >= 40 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${util}%` }} />
                          </div>
                          <span className="text-muted-foreground w-8 text-right">{util}%</span>
                          <span className="font-mono text-muted-foreground w-16 text-right">${t.monthly_cost || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic mb-3">No tools connected in this category.</p>
              )}
              <p className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{cat.benchmark}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}