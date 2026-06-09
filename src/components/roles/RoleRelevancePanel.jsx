import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import RolePolicyModal from "./RolePolicyModal";
import RoleRelevanceFlags from "./RoleRelevanceFlags";

export default function RoleRelevancePanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editPolicy, setEditPolicy] = useState(null);
  const [activeView, setActiveView] = useState("flags"); // "flags" | "policies"

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["role-policies", user?.id],
    queryFn: () => base44.entities.RolePolicy.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["user-activity", user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RolePolicy.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["role-policies"] }),
  });

  const realUsers = activities.filter((a) => a.user_email !== "aggregate@placeholder");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Role Relevance</h2>
            <p className="text-xs text-muted-foreground">Flag mismatches between user roles and their tool access</p>
          </div>
        </div>
        <Button onClick={() => { setEditPolicy(null); setShowModal(true); }} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Role Policy
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1.5">
        {[["flags", "Mismatch Flags"], ["policies", "Role Policies"]].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeView === v
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeView === "flags" && (
        <RoleRelevanceFlags policies={policies} users={realUsers} />
      )}

      {activeView === "policies" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : policies.length === 0 ? (
            <div className="bg-card border border-dashed border-border/60 rounded-2xl p-10 text-center">
              <ShieldCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-sm">No role policies defined</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Define which tools each role should or shouldn't have. Stack Sixth will flag mismatches automatically.
              </p>
              <Button onClick={() => { setEditPolicy(null); setShowModal(true); }} className="mt-5 gap-2">
                <Plus className="w-4 h-4" /> Create First Policy
              </Button>
            </div>
          ) : (
            policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onEdit={() => { setEditPolicy(policy); setShowModal(true); }}
                onDelete={() => { if (confirm(`Delete role "${policy.role_name}"?`)) deleteMutation.mutate(policy.id); }}
              />
            ))
          )}
        </div>
      )}

      {showModal && (
        <RolePolicyModal
          policy={editPolicy}
          onClose={() => { setShowModal(false); setEditPolicy(null); }}
        />
      )}
    </div>
  );
}

function PolicyCard({ policy, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const totalRules =
    (policy.required_tools?.length || 0) +
    (policy.allowed_tools?.length || 0) +
    (policy.blocked_tools?.length || 0);

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{policy.role_name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{policy.role_name}</p>
            <p className="text-[11px] text-muted-foreground">{totalRules} rule{totalRules !== 1 ? "s" : ""} defined</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      {open && (
        <div className="px-5 pb-4 border-t border-border/40 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ToolList icon={CheckCircle2} color="text-emerald-600" label="Required" tools={policy.required_tools} emptyLabel="None defined" />
          <ToolList icon={ShieldCheck} color="text-primary" label="Allowed" tools={policy.allowed_tools} emptyLabel="None defined" />
          <ToolList icon={XCircle} color="text-destructive" label="Blocked (waste)" tools={policy.blocked_tools} emptyLabel="None defined" />
        </div>
      )}
    </div>
  );
}

function ToolList({ icon: Icon, color, label, tools, emptyLabel }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <p className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</p>
      </div>
      {tools?.length > 0 ? (
        <ul className="space-y-1">
          {tools.map((t) => (
            <li key={t} className="text-xs text-foreground bg-muted/40 rounded-lg px-2.5 py-1">{t}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground italic">{emptyLabel}</p>
      )}
    </div>
  );
}