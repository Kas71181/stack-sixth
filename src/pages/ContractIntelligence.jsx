import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { FileText, Upload, AlertTriangle, CheckCircle2, Clock, Loader2, Trash2, TrendingDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import ContractUploader from "@/components/contracts/ContractUploader";
import ContractCard from "@/components/contracts/ContractCard";

export default function ContractIntelligence() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts", user?.id],
    queryFn: () => base44.entities.Contract.filter({ created_by_id: user?.id }, "renewal_date", 50),
    enabled: !!user?.id,
  });

  const handleUploaded = () => {
    qc.invalidateQueries({ queryKey: ["contracts", user?.id] });
    setShowUploader(false);
    toast.success("Contract extracted and saved!");
  };

  const expiringSoon = contracts.filter((c) => c.status === "Expiring Soon");
  const totalAnnual = contracts.filter(c => c.status === "Active" || c.status === "Expiring Soon")
    .reduce((s, c) => s + (c.annual_cost || (c.monthly_cost || 0) * 12), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Contract Intelligence</h1>
            <p className="text-xs text-muted-foreground">Upload invoices & contracts — AI extracts renewal dates, costs & leverage</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowUploader(!showUploader)}>
          <Upload className="w-3.5 h-3.5" />
          Upload Contract
        </Button>
      </div>

      {/* Uploader */}
      {showUploader && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <ContractUploader onComplete={handleUploaded} onCancel={() => setShowUploader(false)} />
        </motion.div>
      )}

      {/* Stats */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{contracts.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Contracts Tracked</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-amber-600">{expiringSoon.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Expiring in 60d</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold">${Math.round(totalAnnual / 1000)}k</p>
            <p className="text-xs text-muted-foreground mt-0.5">Annual Spend</p>
          </div>
        </div>
      )}

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{expiringSoon.length} contract{expiringSoon.length > 1 ? "s" : ""}</strong> renewing within 60 days —{" "}
            {expiringSoon.map(c => c.vendor_name).join(", ")}
          </p>
        </div>
      )}

      {/* Contract list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-semibold text-sm">No contracts yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Upload a PDF invoice or contract and AI will extract all the details automatically.</p>
          <Button size="sm" onClick={() => setShowUploader(true)} className="gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Upload Your First Contract
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contracts.map((contract) => (
            <motion.div key={contract.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <ContractCard contract={contract} onDeleted={() => qc.invalidateQueries({ queryKey: ["contracts", user?.id] })} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}