import { AlertTriangle } from "lucide-react";

export default function RedundancyDetector({ integrations }) {
  const categoryMap = {};
  integrations.forEach((i) => {
    if (!categoryMap[i.category]) categoryMap[i.category] = [];
    categoryMap[i.category].push(i);
  });

  const redundant = Object.entries(categoryMap).filter(([, tools]) => tools.length >= 2);
  if (redundant.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <h2 className="text-sm font-bold flex items-center gap-2 mb-3 text-amber-900">
        <AlertTriangle className="w-4 h-4" />Redundancy Detected
      </h2>
      <div className="space-y-3">
        {redundant.map(([cat, tools]) => (
          <div key={cat} className="bg-white/70 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-800 mb-1">{cat} — {tools.length} tools</p>
            <div className="flex flex-wrap gap-2">
              {tools.map((t) => (
                <span key={t.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {t.tool_name} (${t.monthly_cost || 0}/mo)
                </span>
              ))}
            </div>
            <p className="text-xs text-amber-700 mt-2">💡 Consider consolidating to one tool in this category.</p>
          </div>
        ))}
      </div>
    </div>
  );
}