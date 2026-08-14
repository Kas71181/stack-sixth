import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function useEvidenceAnalytics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["evidence-analytics", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      let response = await base44.functions.invoke("getEvidenceAnalytics", {});
      if (response.data.summary.totalApplications === 0) {
        await base44.functions.invoke("initializeEvidenceFoundation", {});
        response = await base44.functions.invoke("getEvidenceAnalytics", {});
      }
      return response.data;
    },
    staleTime: 60_000,
  });
}