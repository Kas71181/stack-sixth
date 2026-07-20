export function normalizeToolName(value = "") {
  return value.trim().toLowerCase();
}

export function getLiveToolNames(activities = []) {
  return new Set(
    activities
      .filter((activity) => activity.source === "live")
      .map((activity) => normalizeToolName(activity.tool_name))
      .filter(Boolean)
  );
}

export function isToolLive(toolName, activities = []) {
  return getLiveToolNames(activities).has(normalizeToolName(toolName));
}