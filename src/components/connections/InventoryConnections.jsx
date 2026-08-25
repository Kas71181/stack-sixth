import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Plug } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { connectorFor } from "@/lib/inventoryConnectors";
import { buildConnectionMap, dedupeTools, normalizeToolName } from "@/lib/connectionStatus";
import ConnectionGuide from "@/components/connections/ConnectionGuide";
import InventoryConnectionCard from "@/components/connections/InventoryConnectionCard";

export default function InventoryConnections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-connections", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const [tools, activities, connections] = await Promise.all([
        base44.entities.SaasIntegration.filter({ created_by_id: user.id }),
        base44.entities.UserActivity.filter({ created_by_id: user.id, source: "live" }),
        base44.entities.IntegrationConnection.filter({ organization_id: user.id }),
      ]);
      return { tools: dedupeTools(tools), activities, connections };
    },
  });
  const liveNames = new Set((data?.activities || []).map((item) => normalizeToolName(item.tool_name)));
  const connectionMap = buildConnectionMap(data?.connections || []);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory-connections"] });
    queryClient.invalidateQueries({ queryKey: ["integrations"] });
    queryClient.invalidateQueries({ queryKey: ["user-activity"] });
    queryClient.invalidateQueries({ queryKey: ["evidence-connections"] });
    queryClient.invalidateQueries({ queryKey: ["integration-connections"] });
  };
  return (
    <div className="space-y-5">
      <div><h2 className="flex items-center gap-2 text-xl font-extrabold"><Plug className="h-5 w-5 text-primary" />Connect inventory</h2><p className="mt-1 text-sm text-muted-foreground">Use OAuth where available, verified API credentials where supported, or private evidence for any other tool.</p></div>
      <ConnectionGuide />
      {isLoading ? <div className="py-16 text-center text-sm text-muted-foreground">Loading inventory…</div> : !data?.tools.length ? (
        <div className="glass-card py-12 text-center"><Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold">Your inventory is empty</p><p className="mt-1 text-sm text-muted-foreground">Add tools in the Inventory tab first.</p></div>
      ) : <div className="space-y-3">{data.tools.map((tool) => <InventoryConnectionCard key={tool.id} tool={tool} connector={connectorFor(tool.tool_name)} connection={connectionMap.get(normalizeToolName(tool.tool_name))} isLive={liveNames.has(normalizeToolName(tool.tool_name))} onSynced={refresh} />)}</div>}
    </div>
  );
}