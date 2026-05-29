import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Building2, Clock, Trash2, AlertCircle } from "lucide-react";
import moment from "moment";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";

export default function History() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: audits, isLoading } = useQuery({
    queryKey: ["audits-all", user?.email],
    queryFn: () => base44.entities.SoftwareAudit.filter({ created_by: user?.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SoftwareAudit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits-all"] });
      setConfirmDelete(null);
    },
    onError: () => setConfirmDelete(null),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const list = audits || [];

  if (!audits && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="font-semibold">Failed to load audit history</p>
        <p className="text-sm text-muted-foreground">Please refresh the page or try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Audit History</h1>
      {deleteMutation.isError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Failed to delete audit. Please try again.
        </div>
      )}

      {list.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border/60 rounded-2xl">
          <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No audits yet</p>
          <Link to="/audit" className="text-primary text-sm font-medium hover:underline">
            Start your first audit
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((audit, i) => {
            const totalSavings = audit.analysis_result?.recommendations?.reduce(
              (s, r) => s + (r.estimated_savings_opportunity || 0),
              0
            ) || 0;

            return (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-2">
                  <Link
                    to={`/results/${audit.id}`}
                    className="flex-1 flex items-center justify-between bg-card border border-border/60 rounded-xl px-5 py-4 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{audit.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {audit.team_size} people · {moment(audit.created_date).fromNow()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {totalSavings > 0 && (
                        <span className="text-sm font-mono font-semibold text-primary">
                          ${totalSavings.toLocaleString()} savings
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          audit.status === "completed"
                            ? "bg-primary/10 text-primary"
                            : audit.status === "error"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {audit.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                  {confirmDelete === audit.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate(audit.id)}
                        className="px-3 py-2 bg-destructive text-destructive-foreground text-xs font-semibold rounded-lg hover:bg-destructive/90 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(audit.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}