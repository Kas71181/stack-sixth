/**
 * Calculates a data confidence score (0-100) for a tool's usage data.
 * Factors: source reliability, data freshness, and field completeness.
 */
export function calculateConfidence(tool, liveUsers = []) {
  let score = 0;

  // ── Source factor (0-50) ──
  if (tool.source !== 'live') return 0;
  score += 50;

  // ── Data freshness factor (0-30) ──
  const updatedDate = tool.updated_date || liveUsers[0]?.updated_date;
  if (updatedDate) {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(updatedDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate <= 1) score += 30;
    else if (daysSinceUpdate <= 3) score += 25;
    else if (daysSinceUpdate <= 7) score += 18;
    else if (daysSinceUpdate <= 14) score += 10;
    else if (daysSinceUpdate <= 30) score += 4;
  }

  // ── Completeness factor (0-20) ──
  let completeness = 0;
  if (tool.license_cost_per_month > 0) completeness += 5;
  if (tool.licensed_seats > 0) completeness += 5;
  if (tool.activity_score != null) completeness += 5;
  if (liveUsers.length > 0 || tool.days_active_last_30 != null) completeness += 5;
  score += completeness;

  return Math.min(100, score);
}

/**
 * Returns a human-readable staleness label and severity level.
 */
export function getStaleness(updatedDate) {
  if (!updatedDate) return { label: 'Unknown', level: 'unknown', days: null };
  const days = Math.floor((Date.now() - new Date(updatedDate)) / (1000 * 60 * 60 * 24));
  if (days <= 1) return { label: 'Today', level: 'fresh', days };
  if (days <= 3) return { label: `${days}d ago`, level: 'fresh', days };
  if (days <= 7) return { label: `${days}d ago`, level: 'ok', days };
  if (days <= 14) return { label: `${days}d ago`, level: 'stale', days };
  if (days <= 30) return { label: `${days}d ago`, level: 'stale', days };
  return { label: `${Math.floor(days / 7)}w ago`, level: 'stale', days };
}

export const STALENESS_STYLES = {
  fresh: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/40', dot: 'bg-emerald-500' },
  ok: { badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/40', dot: 'bg-blue-500' },
  stale: { badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/40', dot: 'bg-amber-400' },
  unknown: { badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
};

export const CONFIDENCE_STYLES = {
  high: { label: 'High', color: 'text-emerald-600' },
  medium: { label: 'Medium', color: 'text-amber-600' },
  low: { label: 'Low', color: 'text-red-500' },
};

export function getConfidenceLevel(score) {
  if (score >= 75) return CONFIDENCE_STYLES.high;
  if (score >= 50) return CONFIDENCE_STYLES.medium;
  return CONFIDENCE_STYLES.low;
}