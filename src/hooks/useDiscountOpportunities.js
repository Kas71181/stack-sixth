import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function useDiscountOpportunities(toolNames = []) {
  const names = [...new Set(toolNames.filter(Boolean))].sort();
  return useQuery({
    queryKey: ["discount-opportunities", names.join("|")],
    queryFn: async () => {
      const response = await base44.functions.invoke("getDiscountOpportunities", { tool_names: names });
      return response.data;
    },
    enabled: names.length > 0,
    staleTime: 6 * 60 * 60 * 1000,
    refetchInterval: (query) => query.state.data?.refreshing ? 90000 : false,
    retry: false,
  });
}