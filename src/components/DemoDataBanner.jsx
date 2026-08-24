import { FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function DemoDataBanner() {
  const { user } = useAuth();
  const { data: hasDemoData = false } = useQuery({
    queryKey: ["demo-data-banner", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const apps = await base44.entities.OrganizationApp.filter({ organization_id: user.id });
      return apps.some((app) => app.display_name?.startsWith("[DEMO]"));
    },
  });

  if (!hasDemoData) return null;
  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-900 dark:text-amber-200">
      <span className="inline-flex items-center gap-2"><FlaskConical className="h-3.5 w-3.5" />Demo data active. Records labeled [DEMO] are illustrative, not verified customer evidence.</span>
    </div>
  );
}