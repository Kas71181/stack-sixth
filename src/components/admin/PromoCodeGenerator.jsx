import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function PromoCodeGenerator({ campaigns, onGenerated }) {
  const [campaignId, setCampaignId] = useState("");
  const [mode, setMode] = useState("reusable");
  const [quantity, setQuantity] = useState(10);
  const [maxUses, setMaxUses] = useState(100);
  const [prefix, setPrefix] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    await base44.functions.invoke("generatePromoCodes", { campaign_id: campaignId, mode, count: quantity, max_redemptions: maxUses, prefix });
    setLoading(false);
    onGenerated();
  };

  return <div className="glass-card space-y-4 p-5">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="rounded-xl border p-3"><input type="radio" checked={mode === "reusable"} onChange={() => setMode("reusable")} /> <strong>Reusable code</strong><span className="block pl-5 text-xs text-muted-foreground">One recognizable code with multiple uses.</span></label>
      <label className="rounded-xl border p-3"><input type="radio" checked={mode === "unique"} onChange={() => setMode("unique")} /> <strong>Unique codes</strong><span className="block pl-5 text-xs text-muted-foreground">Separate one-time codes for individual recipients.</span></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
      <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="rounded-xl border bg-background px-3 py-2 text-sm"><option value="">Select campaign</option>{campaigns.map((c) => <option key={c.id} value={c.campaign_id}>{c.campaign_name}</option>)}</select>
      <input value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} placeholder={mode === "reusable" ? "Reusable code, e.g. STARTER30" : "Unique code prefix"} className="rounded-xl border bg-background px-3 py-2 text-sm uppercase" />
      <input type="number" min="1" max="1000" value={mode === "reusable" ? maxUses : quantity} onChange={(e) => mode === "reusable" ? setMaxUses(Number(e.target.value)) : setQuantity(Number(e.target.value))} aria-label={mode === "reusable" ? "Maximum uses" : "Number of codes"} className="rounded-xl border bg-background px-3 py-2 text-sm" />
      <button disabled={!campaignId || !prefix.trim() || loading} onClick={generate} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">{loading ? "Generating..." : "Generate"}</button>
    </div>
    <p className="text-xs text-muted-foreground">{mode === "reusable" ? `Maximum uses: ${maxUses}` : `One-time codes to create: ${quantity}`}</p>
  </div>;
}