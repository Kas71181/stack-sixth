import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PromoRedemptionCard({ hasActiveBilling = false }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const redeem = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke("redeemPromoCode", { code });
      setSuccess(response.data);
      setCode("");
      await queryClient.invalidateQueries({ queryKey: ["settings-subscription"] });
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return <div className="mt-6 border-t pt-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Gift className="h-5 w-5" /></div><div><h3 className="font-bold">Redeem partner code</h3><p className="mt-1 text-sm text-muted-foreground">{hasActiveBilling ? "Your current plan and price stay the same. The complimentary period is added before your next charge, then billing resumes automatically." : "Apply a partner code to activate complimentary access on this account."}</p></div></div>{success ? <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Complimentary access scheduled through {new Date(success.promotional_ends_at).toLocaleDateString()}.</div> : <form onSubmit={redeem} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Label htmlFor="billing-promo-code">Partner code</Label><Input id="billing-promo-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter your code" className="mt-2 uppercase" required /></div><Button type="submit" disabled={loading || !code.trim()}>{loading ? "Applying…" : "Apply code"}</Button></form>}{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}</div>;
}