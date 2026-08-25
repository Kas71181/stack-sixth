const TOOL_ALIASES = {
  "apollo": "apollo.io",
  "apollo io": "apollo.io",
  "g suite": "google workspace",
  "google apps": "google workspace",
  "github.com": "github",
  "notion.so": "notion",
  "quickbooks online": "quickbooks",
  "salesforce crm": "salesforce",
};

export function normalizeToolName(value = "") {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  return TOOL_ALIASES[normalized] || normalized;
}

export function dedupeTools(tools = []) {
  const ranks = { live: 5, access: 4, observed: 3, financial: 2, snapshot: 1, insufficient: 0 };
  const unique = new Map();
  tools.forEach((tool) => {
    const key = normalizeToolName(tool.tool_name);
    if (!key) return;
    const current = unique.get(key);
    const nextRank = ranks[tool.evidence_type] ?? 0;
    const currentRank = ranks[current?.evidence_type] ?? 0;
    if (!current || nextRank > currentRank || (nextRank === currentRank && new Date(tool.updated_date || 0) > new Date(current.updated_date || 0))) unique.set(key, tool);
  });
  return [...unique.values()];
}

export function getLiveToolNames(activities = []) {
  return new Set(activities.filter((activity) => activity.source === "live").map((activity) => normalizeToolName(activity.tool_name)).filter(Boolean));
}

export function isToolLive(toolName, activities = []) {
  return getLiveToolNames(activities).has(normalizeToolName(toolName));
}

export function getToolConnectionDisplay(tool = {}, hasLiveActivity = false) {
  if (hasLiveActivity || (tool.connection_status === "Connected" && tool.evidence_type === "live")) return { key: "live", label: "Live", connected: true };
  if (tool.connection_status === "Connected") return { key: "connected", label: "Connected", connected: true };
  if (tool.connection_status === "Evidence") return { key: "evidence", label: "Evidence connected", connected: true };
  if (tool.connection_status === "Manual Upload") return { key: "evidence", label: "Report connected", connected: true };
  if (tool.connection_status === "Manual Auth") return { key: "pending", label: "Verification pending", connected: true };
  return { key: "offline", label: "Not connected", connected: false };
}