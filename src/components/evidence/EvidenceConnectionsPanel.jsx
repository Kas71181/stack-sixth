import { useQuery } from "@tanstack/react-query";
import { PlugZap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const limits = { slack: "No login or message activity inferred", github: "No coding activity inferred from membership", notion: "User discovery is not seat or usage evidence" };

export default function EvidenceConnectionsPanel() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({ queryKey: ["evidence-connections", user?.id], queryFn: () => base44.entities.IntegrationConnection.filter({ organization_id: user.id }), enabled: !!user?.id });
  if (isLoading) return <div className="skeleton h-28 rounded-2xl" />;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3"><div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5"><PlugZap className="h-5 w-5 text-primary" /></div><div><h2 className="text-lg font-bold">Connection evidence</h2><p className="text-sm text-muted-foreground">Capabilities are explicit; unsupported signals stay unavailable.</p></div></div>
      <div className="grid gap-3 lg:grid-cols-2">
        {data.map((connection) => (
          <div key={connection.id} className="glass-card p-5">
            <div className="flex items-center justify-between gap-3"><p className="font-semibold capitalize">{connection.connector_type.replaceAll("-", " ")}</p><span className={`badge-pill ${connection.connected ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>{connection.connected ? "Connected" : "Not connected"}</span></div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground"><p>Authentication: {connection.authentication_status || "unknown"}</p><p>Members processed: {connection.records_processed || 0}</p><p>Live usage: {connection.usage_supported ? "Available" : "Not available from provider"}</p><p>Data current through: {connection.provider_data_current_through ? new Date(connection.provider_data_current_through).toLocaleString() : "Not available"}</p><p>Last sync: {connection.last_successful_sync_at ? new Date(connection.last_successful_sync_at).toLocaleString() : "No verified sync"}</p></div>
            <div className="mt-3 flex flex-wrap gap-1.5">{(connection.capabilities_enabled || []).map((item) => <span key={item} className="rounded-full border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium">{item.replaceAll("_", " ")}</span>)}</div>
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{limits[connection.connector_type] || "Only declared connector capabilities are used."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}