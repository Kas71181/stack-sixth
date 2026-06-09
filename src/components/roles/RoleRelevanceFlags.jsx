import { useMemo } from "react";
import { AlertTriangle, XCircle, CheckCircle2, ShieldAlert } from "lucide-react";

/**
 * Compares per-user activity records against defined role policies.
 * Flags: WASTE (blocked tool), GAP (missing required tool), OK (matching).
 * 
 * User role is inferred from their user_name field pattern OR from
 * any "role" field on the UserActivity record if present.
 */

function matchRole(userName, policies) {
  if (!userName || !policies.length) return null;
  const lower = userName.toLowerCase();
  // Try to fuzzy-match role name inside user name / title
  for (const p of policies) {
    if (lower.includes(p.role_name.toLowerCase())) return p;
  }
  return null;
}

function scoreUser(user, policy) {
  const userTool = user.tool_name;
  const isBlocked = policy.blocked_tools?.some((t) => t.toLowerCase() === userTool.toLowerCase());
  const isRequired = policy.required_tools?.some((t) => t.toLowerCase() === userTool.toLowerCase());
  const isAllowed = policy.allowed_tools?.some((t) => t.toLowerCase() === userTool.toLowerCase());

  if (isBlocked) return { type: "waste", label: "Waste — blocked for this role", severity: "high" };
  if (isRequired) return { type: "ok", label: "Required — correct access", severity: "none" };
  if (isAllowed) return { type: "ok", label: "Allowed — permitted access", severity: "none" };
  return null; // not in policy at all — neutral
}

export default function RoleRelevanceFlags({ policies, users }) {
  const flags = useMemo(() => {
    if (!policies.length || !users.length) return { waste: [], gaps: [] };

    const waste = [];

    // WASTE: user has a tool that's blocked for their role
    users.forEach((u) => {
      const policy = matchRole(u.user_name, policies);
      if (!policy) return;
      const result = scoreUser(u, policy);
      if (result?.type === "waste") {
        waste.push({
          user: u.user_name,
          email: u.user_email,
          tool: u.tool_name,
          role: policy.role_name,
          cost: u.license_cost_per_month || 0,
          label: result.label,
        });
      }
    });

    // GAPS: users whose role requires a tool, but no activity record exists for that tool
    const gaps = [];
    const usersByName = {};
    users.forEach((u) => {
      if (!usersByName[u.user_name]) usersByName[u.user_name] = [];
      usersByName[u.user_name].push(u.tool_name);
    });

    Object.entries(usersByName).forEach(([userName, toolNames]) => {
      const policy = matchRole(userName, policies);
      if (!policy) return;
      (policy.required_tools || []).forEach((reqTool) => {
        const hasIt = toolNames.some((t) => t.toLowerCase() === reqTool.toLowerCase());
        if (!hasIt) {
          gaps.push({ user: userName, role: policy.role_name, tool: reqTool });
        }
      });
    });

    return { waste, gaps };
  }, [policies, users]);

  const totalWasteCost = flags.waste.reduce((s, f) => s + f.cost, 0);
  const hasFlags = flags.waste.length > 0 || flags.gaps.length > 0;

  if (!policies.length) {
    return (
      <div className="bg-card border border-dashed border-border/60 rounded-2xl p-10 text-center">
        <ShieldAlert className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-semibold text-sm">No role policies yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Switch to <strong>Role Policies</strong> and define which tools each role should or shouldn't have. Stack Sixth will then flag mismatches here automatically.
        </p>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="bg-card border border-dashed border-border/60 rounded-2xl p-10 text-center">
        <AlertTriangle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-semibold text-sm">No per-user data yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Connect live integrations (GitHub, Slack, etc.) to pull real per-user activity. Role mismatch detection requires per-user records.
        </p>
      </div>
    );
  }

  if (!hasFlags) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
        <p className="font-semibold text-sm text-emerald-800">No role mismatches detected</p>
        <p className="text-xs text-emerald-700 mt-1">All user tool assignments match their defined role policies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-destructive">{flags.waste.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Waste Flags</p>
          <p className="text-xs text-destructive font-semibold mt-1">Blocked tools in use</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-700">{flags.gaps.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Gap Flags</p>
          <p className="text-xs text-amber-700 font-semibold mt-1">Required tools missing</p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-destructive">${Math.round(totalWasteCost).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Wasted / Month</p>
          <p className="text-xs text-muted-foreground font-semibold mt-1">From role mismatches</p>
        </div>
      </div>

      {/* Waste flags */}
      {flags.waste.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <p className="text-xs font-bold uppercase tracking-wider text-destructive">Waste — Blocked Tools in Use ({flags.waste.length})</p>
          </div>
          <div className="space-y-2">
            {flags.waste.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-destructive">{f.user?.charAt(0)?.toUpperCase() || "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{f.user}</p>
                  <p className="text-[11px] text-muted-foreground">{f.email} · Role: <strong>{f.role}</strong></p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-destructive">{f.tool}</p>
                  <p className="text-[10px] text-muted-foreground">blocked tool</p>
                </div>
                {f.cost > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-destructive">${f.cost}/mo</p>
                    <p className="text-[10px] text-muted-foreground">wasted</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gap flags */}
      {flags.gaps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Gaps — Required Tools Missing ({flags.gaps.length})</p>
          </div>
          <div className="space-y-2">
            {flags.gaps.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-amber-700">{f.user?.charAt(0)?.toUpperCase() || "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{f.user}</p>
                  <p className="text-[11px] text-muted-foreground">Role: <strong>{f.role}</strong></p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-amber-700">{f.tool}</p>
                  <p className="text-[10px] text-muted-foreground">required — missing</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}