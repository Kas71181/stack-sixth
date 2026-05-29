import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useAffiliateLinks() {
  const { data: links = [] } = useQuery({
    queryKey: ["affiliate-links"],
    queryFn: () => base44.entities.AffiliateLink.list("-created_date", 200),
    staleTime: 5 * 60 * 1000,
  });

  const getUrl = (toolName) => {
    if (!toolName) return null;
    const match = links.find(
      (l) => l.tool_name.toLowerCase().trim() === toolName.toLowerCase().trim()
    );
    return match?.affiliate_url || null;
  };

  return { links, getUrl };
}