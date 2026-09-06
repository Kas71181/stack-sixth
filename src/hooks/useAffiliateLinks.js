import { base44 } from "@/api/base44Client";

// Returns the affiliate URL for a given tool name by calling the backend.
// The actual URLs are hardcoded server-side and never exposed to the client.
export function useAffiliateLinks() {
  const getLink = async (toolName) => {
    if (!toolName) return { url: null, isAffiliate: false };
    try { const res = await base44.functions.invoke("getAffiliateUrl", { tool_name: toolName }); return { url: res.data?.url || null, isAffiliate: res.data?.is_affiliate === true }; }
    catch { return { url: null, isAffiliate: false }; }
  };
  const getUrl = async (toolName) => (await getLink(toolName)).url;
  return { getUrl, getLink };
}