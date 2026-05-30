import { AlertTriangle, Info } from "lucide-react";

// Known typical monthly cost ranges per tool (rough benchmarks)
const KNOWN_COSTS = {
  slack: [7, 15],
  notion: [8, 16],
  hubspot: [45, 800],
  salesforce: [25, 300],
  jira: [7, 15],
  github: [4, 21],
  zoom: [15, 20],
  "google workspace": [6, 18],
  linear: [8, 16],
  figma: [12, 45],
  intercom: [74, 500],
  zendesk: [55, 200],
  asana: [10, 25],
  monday: [9, 16],
  dropbox: [11, 18],
  "microsoft 365": [6, 22],
  quickbooks: [30, 90],
  stripe: [0, 0], // usage-based
  twilio: [0, 0],
  datadog: [15, 500],
  mixpanel: [0, 999],
};

function getWarnings(tools) {
  const warnings = [];
  const names = tools.map((t) => t.name.toLowerCase());

  // Duplicate detection
  const seen = {};
  names.forEach((n, i) => {
    if (seen[n] !== undefined) {
      warnings.push({ type: "duplicate", message: `"${tools[i].name}" appears more than once in your stack.`, index: i });
    }
    seen[n] = i;
  });

  // Cost outlier detection
  tools.forEach((tool, i) => {
    if (!tool.monthly_cost) return;
    const key = Object.keys(KNOWN_COSTS).find((k) => tool.name.toLowerCase().includes(k));
    if (!key) return;
    const [min, max] = KNOWN_COSTS[key];
    if (max === 0) return; // usage-based, skip
    if (tool.monthly_cost > max * 3) {
      warnings.push({
        type: "high_cost",
        message: `${tool.name}: $${tool.monthly_cost}/mo seems high. Typical range is $${min}–$${max}/mo. Is this the total team cost?`,
        index: i,
      });
    } else if (tool.monthly_cost > 0 && tool.monthly_cost < min * 0.5) {
      warnings.push({
        type: "low_cost",
        message: `${tool.name}: $${tool.monthly_cost}/mo seems low. Typical range is $${min}–$${max}/mo. Is this per seat or total?`,
        index: i,
      });
    }
  });

  return warnings;
}

export default function CostValidationWarnings({ tools }) {
  const warnings = getWarnings(tools);
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`flex items-start gap-2.5 text-xs px-3 py-2.5 rounded-lg border ${
            w.type === "duplicate"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : w.type === "high_cost"
              ? "bg-orange-50 border-orange-200 text-orange-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {w.type === "duplicate" ? (
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          )}
          {w.message}
        </div>
      ))}
    </div>
  );
}