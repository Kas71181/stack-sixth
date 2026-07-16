import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { FileText, Upload, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import ContractUploader from "@/components/contracts/ContractUploader";
import ContractCard from "@/components/contracts/ContractCard";
import AuditTrailPanel from "@/components/audit/AuditTrailPanel";
import ManualRenewalForm from "@/components/contracts/ManualRenewalForm";
import RenewalDetectionPanel from "@/components/contracts/RenewalDetectionPanel";

export default function ContractIntelligence() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);
  const [showManual, setShowManual] = useState(false);

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

  const handleRenewalCreated = () => {
    qc.invalidateQueries({ queryKey: ["contracts", user?.id] });
    setShowManual(false);
    toast.success("Renewal added");
  };

  const expiringSoon = contracts.filter((c) => c.status === "Expiring Soon");
  const totalAnnual = contracts.filter(c => c.status === "Active" || c.status === "Expiring Soon")
    .reduce((s, c) => s + (c.annual_cost || (c.monthly_cost || 0) * 12), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Renewals</h1>
            <p className="text-xs text-muted-foreground">Track renewal dates manually, detect them from invoices, or upload a contract</p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setShowManual(!showManual); setShowUploader(false); }}><Plus className="w-3.5 h-3.5" />Add manually</Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setShowUploader(!showUploader); setShowManual(false); }}><Upload className="w-3.5 h-3.5" />Upload contract</Button>
        </div>
      </div>

      {/* Uploader */}
      {showUploader && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <ContractUploader onComplete={handleUploaded} onCancel={() => setShowUploader(false)} />
        </motion.div>
      )}
      {showManual && <ManualRenewalForm onCreated={handleRenewalCreated} onCancel={() => setShowManual(false)} />}
      <RenewalDetectionPanel onConfirmed={() => qc.invalidateQueries({ queryKey: ["contracts", user?.id] })} />

      {/* Stats */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{contracts.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Renewals tracked</p>
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

      {/* Audit Trail — recent playbook activity */}
      {contracts.length > 0 && (
        <div className="glass-card p-5">
          <AuditTrailPanel entityType="NegotiationPlaybook" entityId={contracts[0]?.id} title="Recent Negotiation Activity" />
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
          <p className="font-semibold text-sm">No renewals tracked yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Add a date manually, scan Gmail, or upload a contract.</p>
          <Button size="sm" onClick={() => setShowManual(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" />Add your first renewal</Button>
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