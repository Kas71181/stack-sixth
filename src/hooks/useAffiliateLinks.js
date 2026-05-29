import { base44 } from "@/api/base44Client";

// Returns the affiliate URL for a given tool name by calling the backend.
// The actual URLs are hardcoded server-side and never exposed to the client.
export function useAffiliateLinks() {
  const getUrl = async (toolName) => {
    if (!toolName) return null;
    try {
      const res = await base44.functions.invoke("getAffiliateUrl", { tool_name: toolName });
      return res.data?.url || null;
    } catch {
      return null;
    }
  };

  return { getUrl };
}