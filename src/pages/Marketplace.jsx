import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Store, Plus, Trophy, Megaphone, Mail, Loader2 } from "lucide-react";
import RfqForm from "@/components/marketplace/RfqForm";
import BidCard from "@/components/marketplace/BidCard";
import { toast } from "sonner";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function Marketplace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState("board");
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const { data: rfqs, isLoading: rfqLoading } = useQuery({
    queryKey: ["rfqs", user?.id],
    queryFn: () => base44.entities.PurchaseRequest.filter({ created_by_id: user?.id, status: "pending" }, "-created_date", 20),
    enabled: !!user?.id,
  });

  const { data: bids, isLoading: bidsLoading } = useQuery({
    queryKey: ["vendor-bids", user?.id],
    queryFn: () => base44.entities.VendorBid.filter({ created_by_id: user?.id }, "-created_date", 100),
    enabled: !!user?.id,
  });

  const handlePostRfq = async (data) => {
    setSubmitting(true);
    try {
      // Create a purchase request as the RFQ
      await base44.entities.PurchaseRequest.create({
        ...data,
        status: "pending",
        justification: `RFQ posted to marketplace. Must-haves: ${(data.must_haves || []).join(", ")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["rfqs", user?.id] });
      toast.success("Posted to marketplace! Vendors can now submit bids.");
      setView("board");
      base44.analytics.track({ eventName: "rfq_posted", properties: { tool: data.tool_name } });
    } catch {
      toast.error("Failed to post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBidAction = async (bid, status) => {
    setSavingId(bid.id);
    try {
      await base44.entities.VendorBid.update(bid.id, { status });
      // If selected, reject all other bids for the same tool
      if (status === "selected") {
        const competing = (bids || []).filter((b) => b.id !== bid.id && b.tool_name === bid.tool_name && b.status !== "rejected");
        for (const comp of competing) {
          await base44.entities.VendorBid.update(comp.id, { status: "rejected" });
        }
        toast.success(`${bid.vendor_name} selected as winner! ${competing.length} other bid(s) rejected.`);
      } else {
        toast.success(`Bid ${status}`);
      }
      queryClient.invalidateQueries({ queryKey: ["vendor-bids", user?.id] });
    } catch {
      toast.error("Failed to update bid");
    } finally {
      setSavingId(null);
    }
  };

  // Group bids by tool_name
  const bidsByTool = (bids || []).reduce((acc, bid) => {
    const key = bid.tool_name || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(bid);
    return acc;
  }, {});

  // Sort each group by price (lowest first)
  Object.values(bidsByTool).forEach((group) => group.sort((a, b) => (a.proposed_monthly_cost || 0) - (b.proposed_monthly_cost || 0)));

  const activeBids = (bids || []).filter((b) => b.status === "submitted" || b.status === "shortlisted").length;
  const selectedBids = (bids || []).filter((b) => b.status === "selected").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fade()}>
        <h1 className="text-page flex items-center gap-2">
          <Store className="w-6 h-6 text-primary" />
          Vendor Marketplace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Post your software needs, let vendors compete, and pick the best offer — side-by-side.</p>
      </motion.div>

      {/* Stats */}
      {bids && bids.length > 0 && (
        <motion.div {...fade(0.05)} className="grid grid-cols-3 gap-3">
          <div className="stat-card">
            <Megaphone className="w-4 h-4 text-muted-foreground mb-1" />
            <p className="text-2xl font-black">{Object.keys(bidsByTool).length}</p>
            <p className="text-xs text-muted-foreground">Open RFQs</p>
          </div>
          <div className="stat-card">
            <Mail className="w-4 h-4 text-primary mb-1" />
            <p className="text-2xl font-black">{activeBids}</p>
            <p className="text-xs text-muted-foreground">Active Bids</p>
          </div>
          <div className="stat-card">
            <Trophy className="w-4 h-4 text-amber-500 mb-1" />
            <p className="text-2xl font-black">{selectedBids}</p>
            <p className="text-xs text-muted-foreground">Winners Selected</p>
          </div>
        </motion.div>
      )}

      {/* Tab toggle */}
      <motion.div {...fade(0.1)} className="tab-track inline-flex p-1 gap-1">
        <button
          onClick={() => setView("board")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === "board" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Store className="w-3.5 h-3.5" /> Bid Board
        </button>
        <button
          onClick={() => setView("post")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === "post" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Plus className="w-3.5 h-3.5" /> Post RFQ
        </button>
      </motion.div>

      {/* Content */}
      {view === "post" ? (
        <motion.div {...fade(0.1)}>
          <RfqForm user={user} onSubmit={handlePostRfq} submitting={submitting} />
        </motion.div>
      ) : bidsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : Object.keys(bidsByTool).length === 0 ? (
        <motion.div {...fade(0.1)} className="glass-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
            <Store className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-sm">No bids yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">Post a software need to your marketplace and vendors will submit competitive bids.</p>
          <button
            onClick={() => setView("post")}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Post Your First RFQ
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(bidsByTool).map(([toolName, toolBids]) => {
            const bestPrice = toolBids.find((b) => b.status !== "rejected")?.proposed_monthly_cost;
            const hasWinner = toolBids.some((b) => b.status === "selected");
            return (
              <div key={toolName}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-section font-bold">{toolName}</h2>
                  <span className="text-xs text-muted-foreground">({toolBids.length} bid{toolBids.length !== 1 ? "s" : ""})</span>
                  {hasWinner && <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">Winner selected</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toolBids.map((bid) => (
                    <BidCard
                      key={bid.id}
                      bid={bid}
                      isBestPrice={bid.proposed_monthly_cost === bestPrice}
                      onAction={handleBidAction}
                      isSaving={savingId === bid.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}