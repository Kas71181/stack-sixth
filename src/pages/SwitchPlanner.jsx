import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import NewSwitchPlanModal from "@/components/switchplan/NewSwitchPlanModal";
import SwitchPlanCard from "@/components/switchplan/SwitchPlanCard";
import SwitchPlanDetail from "@/components/switchplan/SwitchPlanDetail";

export default function SwitchPlanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["switch-plans", user?.id],
    queryFn: () => base44.entities.SwitchPlan.filter({ created_by_id: user?.id }, "-created_date", 50),
    enabled: !!user?.id,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["switch-plans", user?.id] });

  const handleCreated = (plan) => {
    refetch();
    setSelected(plan);
  };

  const handleUpdated = (updated) => {
    queryClient.setQueryData(["switch-plans", user?.id], (old) =>
      (old || []).map((p) => (p.id === updated.id ? updated : p))
    );
    setSelected(updated);
  };

  const handleDeleted = (id) => {
    queryClient.setQueryData(["switch-plans", user?.id], (old) =>
      (old || []).filter((p) => p.id !== id)
    );
    setSelected(null);
  };

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto">
        <SwitchPlanDetail
          plan={selected}
          onBack={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-primary" />
            Switch Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tool migrations with step-by-step change management checklists.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Switch Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : plans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 border border-dashed border-border rounded-2xl"
        >
          <ArrowLeftRight className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
          <p className="font-semibold text-sm mb-1">No switch plans yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Planning to replace a tool? Create a switch plan to track every step.
          </p>
          <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" /> Create First Plan
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <SwitchPlanCard key={plan.id} plan={plan} onClick={setSelected} />
          ))}
        </div>
      )}

      <NewSwitchPlanModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}