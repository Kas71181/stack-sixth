import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { X, User, Calendar, TrendingDown, CheckCircle2, AlertTriangle, Clock, Wifi } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

const STATUS_CFG = {
  Active:           { label: "Active",         cls: "text-emerald-700 bg-emerald-50 border-emerald-200",       Icon: CheckCircle2 },
  Dormant:          { label: "Dormant",        cls: "text-amber-700 bg-amber-50 border-amber-200",             Icon: Clock },
  Inactive:         { label: "Inactive",       cls: "text-destructive bg-destructive/10 border-destructive/20", Icon: AlertTriangle },
  "Never Logged In":{ label: "Never Used",     cls: "text-destructive bg-destructive/10 border-destructive/20", Icon: AlertTriangle },
};

function ActivityBar({ days }) {
  const pct = Math.min(100, Math.round((days / 30) * 100));
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{days}/30d</span>
    </div>
  );
}

export default function UserActivityDrilldown({ toolName, onClose }) {
  const { user } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["user-activity-detail", toolName, user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ tool_name: toolName, created_by_id: user?.id }),
    enabled: !!user?.id && !!toolName,
  });

  // Separate aggregate placeholder from real users
  const realUsers = users.filter((u) => u.user_email !== "aggregate@placeholder");
  const hasLiveData = realUsers.some((u) => u.source === "live");

  const inactive = realUsers.filter((u) => u.status === "Inactive" || u.status === "Never Logged In" || u.status === "Dormant");
  const active   = realUsers.filter((u) => u.status === "Active");

  const wastedCost = inactive.reduce((s, u) => s + (u.license_cost_per_month || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-base">{toolName} — User Activity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasLiveData ? (
                <span className="inline-flex items-center gap-1 text-emerald-700"><Wifi className="w-3 h-3" /> Live data</span>
              ) : (
                "Estimated data — connect via OAuth for real-time tracking"
              )}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && realUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold">No per-user data yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Connect {toolName} via OAuth in the <strong>Integrations → Live Usage Data</strong> tab to pull real per-user activity.
              </p>
            </div>
          )}

          {!isLoading && realUsers.length > 0 && (
            <>
              {/* Summary banner */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-emerald-700">{active.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Active Users</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-amber-700">{inactive.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Inactive / Dormant</p>
                </div>
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-destructive">${Math.round(wastedCost)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Wasted / Month</p>
                </div>
              </div>

              {/* Inactive users first — most actionable */}
              {inactive.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                    <p className="text-xs font-bold uppercase tracking-wider text-destructive">Inactive / Dormant ({inactive.length})</p>
                  </div>
                  <div className="space-y-1.5">
                    {inactive.map((u) => <UserRow key={u.id} user={u} />)}
                  </div>
                </div>
              )}

              {/* Active users */}
              {active.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Active ({active.length})</p>
                  </div>
                  <div className="space-y-1.5">
                    {active.map((u) => <UserRow key={u.id} user={u} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UserRow({ user }) {
  const cfg = STATUS_CFG[user.status] || STATUS_CFG.Dormant;
  const Icon = cfg.Icon;

  let lastSeen = null;
  if (user.last_active_date) {
    try { lastSeen = formatDistanceToNow(parseISO(user.last_active_date), { addSuffix: true }); } catch {}
  }

  return (
    <div className="flex items-center gap-3 bg-muted/30 hover:bg-muted/50 rounded-xl px-3 py-2.5 transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-primary">
          {user.user_name?.charAt(0)?.toUpperCase() || "?"}
        </span>
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.user_name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{user.user_email}</p>
      </div>

      {/* Activity bar */}
      <ActivityBar days={user.days_active_last_30 ?? 0} />

      {/* Last seen */}
      {lastSeen && (
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
          <Calendar className="w-3 h-3" />
          {lastSeen}
        </div>
      )}

      {/* Status badge */}
      <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
        <Icon className="w-2.5 h-2.5" />
        {cfg.label}
      </span>
    </div>
  );
}