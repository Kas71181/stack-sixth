import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const REFRESHERS = {
  slack: "getSlackActivity",
  github: "getGitHubActivity",
  notion: "getNotionActivity",
};
const REFRESH_AFTER_MS = 4 * 60 * 60 * 1000;
const normalize = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const running = new Set();

export default function OAuthAutoRefresh({ userId, enabled }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !enabled) return;
    const refresh = async () => {
      const tools = await base44.entities.SaasIntegration.filter({ created_by_id: userId });
      const connected = new Map(tools.filter((tool) => ["Connected", "Evidence"].includes(tool.connection_status)).map((tool) => [normalize(tool.tool_name), tool]));
      const jobs = Object.entries(REFRESHERS).filter(([provider]) => connected.has(provider)).map(async ([provider, functionName]) => {
        const key = `stackSixthOAuthRefresh:${userId}:${provider}`;
        const lastRun = Number(localStorage.getItem(key) || 0);
        if (running.has(key) || Date.now() - lastRun < REFRESH_AFTER_MS) return;
        running.add(key);
        try {
          const result = await base44.functions.invoke(functionName, {});
          if (result.data?.success) {
            const refreshedAt = new Date().toISOString();
            localStorage.setItem(key, String(Date.now()));
            await base44.entities.SaasIntegration.update(connected.get(provider).id, { last_synced: refreshedAt.slice(0, 10), evidence_checked_at: refreshedAt });
          }
        } finally {
          running.delete(key);
        }
      });
      await Promise.allSettled(jobs);
      queryClient.invalidateQueries({ queryKey: ["inventory-connections"] });
      queryClient.invalidateQueries({ queryKey: ["activity-layout"] });
    };
    const safelyRefresh = () => refresh().catch(() => {});
    safelyRefresh();
    const timer = window.setInterval(safelyRefresh, 15 * 60 * 1000);
    window.addEventListener("focus", safelyRefresh);
    window.addEventListener("online", safelyRefresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", safelyRefresh); window.removeEventListener("online", safelyRefresh); };
  }, [enabled, queryClient, userId]);

  return null;
}