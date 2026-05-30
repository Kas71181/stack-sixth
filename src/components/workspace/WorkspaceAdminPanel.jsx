import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, RefreshCw, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCircle2, AlertCircle, Zap, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  active: { label: "Active", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  idle_30d: { label: "Idle 30d", color: "text-amber-700 bg-amber-50 border-amber-200" },
  idle_90d: { label: "Idle 90d", color: "text-orange-700 bg-orange-50 border-orange-200" },
  suspended: { label: "Suspended", color: "text-red-700 bg-red-50 border-red-200" },
};

export default function WorkspaceAdminPanel({ onImport }) {
  const [accessToken, setAccessToken] = useState("");
  const [domain, setDomain] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState("all");

  const handleConnect = async () => {
    if (!accessToken.trim() || !domain.trim()) {
      setError("Both access token and domain are required");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("getWorkspaceUsers", {
      access_token: accessToken.trim(),
      domain: domain.trim(),
    });
    setLoading(false);
    const result = res.data;
    if (result.error) {
      setError(result.error);
      return;
    }
    setData(result);
    setAccessToken("");
  };

  const handleImportIdleSeats = () => {
    if (!data) return;
    const idleCount = data.summary.idle_90d + data.summary.suspended;
    // Pass idle seat info as a tool to the audit form
    onImport({
      name: "Google Workspace",
      category: "Productivity",
      monthly_cost: null,
      idle_seats: idleCount,
      total_seats: data.summary.total,
      note: `${idleCount} idle/suspended seats detected out of ${data.summary.total} total`,
    });
  };

  const filteredUsers = data?.users?.filter((u) =>
    filter === "all" ? true : u.status === filter
  ) || [];

  const summary = data?.summary;

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Google Workspace Admin</p>
            <p className="text-xs text-muted-foreground">
              {data
                ? `${summary.total} users · ${summary.idle_90d + summary.suspended} idle/suspended seats`
                : "Connect to detect unused licenses"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/40 px-5 py-4 space-y-4">
          {!data && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Provide a Google Workspace Admin OAuth access token and your domain to analyze user activity and detect idle seats.{" "}
                <a
                  href="https://developers.google.com/admin-sdk/directory/v1/guides/authorizing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-0.5 hover:underline"
                >
                  How to get a token <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="space-y-2">
                <Input
                  placeholder="your-domain.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="h-9 text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="OAuth Access Token (ya29.xxx)"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                  <Button
                    onClick={handleConnect}
                    disabled={loading || !accessToken.trim() || !domain.trim()}
                    size="sm"
                    className="gap-1.5 flex-shrink-0"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    {loading ? "Pulling..." : "Analyze"}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
              )}
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Total", value: summary.total, color: "text-foreground" },
                  { label: "Active", value: summary.active, color: "text-emerald-600" },
                  { label: "Idle 30d+", value: summary.idle_30d + summary.idle_90d, color: "text-amber-600" },
                  { label: "Suspended", value: summary.suspended, color: "text-red-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-muted/40 rounded-xl px-3 py-2 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Idle seat savings callout */}
              {(summary.idle_90d + summary.suspended) > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">
                      {summary.idle_90d + summary.suspended} seats may be wasted
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {summary.idle_90d} users inactive 90+ days · {summary.suspended} suspended
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleImportIdleSeats} className="flex-shrink-0 text-xs border-amber-300 text-amber-800 hover:bg-amber-100">
                    Add to Audit
                  </Button>
                </div>
              )}

              {/* Filter tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {["all", "active", "idle_30d", "idle_90d", "suspended"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      filter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "all" ? "All" : STATUS_CONFIG[f]?.label}
                    {f !== "all" && (
                      <span className="ml-1 opacity-70">
                        ({data.users.filter((u) => u.status === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* User list */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {filteredUsers.slice(0, 50).map((u, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {u.days_since_login != null && (
                        <span className="text-[11px] text-muted-foreground">{u.days_since_login}d ago</span>
                      )}
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${STATUS_CONFIG[u.status]?.color}`}>
                        {STATUS_CONFIG[u.status]?.label}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredUsers.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-1">+{filteredUsers.length - 50} more</p>
                )}
              </div>

              <button onClick={() => setData(null)} className="text-xs text-muted-foreground hover:text-foreground underline">
                Re-connect
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}