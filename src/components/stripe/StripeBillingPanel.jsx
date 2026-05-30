import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, RefreshCw, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StripeBillingPanel({ onImport }) {
  const [stripeKey, setStripeKey] = useState("");
  const [savedKey, setSavedKey] = useState(() => localStorage.getItem("stripe_key_hint") || "");
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    const key = stripeKey.trim();
    if (!key.startsWith("sk_")) {
      setError("Key must start with sk_live_ or sk_test_");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("getStripeSubscriptions", { stripe_key: key });
    setLoading(false);
    const data = res.data;
    if (data.error) {
      setError(data.error);
      return;
    }
    setTools(data.tools || []);
    setConnected(true);
    // Save a hint (masked) so the user knows they've connected
    localStorage.setItem("stripe_key_hint", key.slice(0, 8) + "••••••••");
    setSavedKey(key.slice(0, 8) + "••••••••");
    setStripeKey("");
  };

  const handleImportAll = () => {
    onImport(tools);
  };

  const totalMonthly = tools.reduce((s, t) => s + (t.monthly_cost || 0), 0);

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Stripe Billing</p>
            <p className="text-xs text-muted-foreground">
              {connected ? `${tools.length} subscriptions pulled · $${totalMonthly.toFixed(0)}/mo` : savedKey ? `Last connected: ${savedKey}` : "Connect to auto-import subscription costs"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected && (
            <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/40 px-5 py-4 space-y-4">
          {!connected && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Enter your Stripe <strong>Secret Key</strong> to pull active subscriptions. Your key is never stored — it's used only for this session.{" "}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-0.5 hover:underline">
                  Get your key <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="sk_live_... or sk_test_..."
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  className="h-9 text-sm font-mono"
                />
                <Button
                  onClick={handleConnect}
                  disabled={loading || !stripeKey.trim()}
                  size="sm"
                  className="gap-1.5 flex-shrink-0"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {loading ? "Pulling..." : "Connect"}
                </Button>
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
              )}
            </div>
          )}

          {connected && tools.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subscriptions Found</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Total: <strong className="text-foreground font-mono">${totalMonthly.toFixed(2)}/mo</strong></span>
                  <button onClick={() => setConnected(false)} className="text-xs text-muted-foreground hover:text-foreground underline">Re-connect</button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {tools.map((t, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      {t.quantity > 1 && <p className="text-[11px] text-muted-foreground">{t.quantity} seats</p>}
                    </div>
                    <span className="text-sm font-mono font-medium">
                      {t.monthly_cost != null ? `$${t.monthly_cost}/mo` : "—"}
                    </span>
                  </div>
                ))}
              </div>
              <Button onClick={handleImportAll} className="w-full gap-2" size="sm">
                <Zap className="w-3.5 h-3.5" />
                Import All to Audit Form
              </Button>
            </div>
          )}

          {connected && tools.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No active subscriptions found in this Stripe account.</p>
          )}
        </div>
      )}
    </div>
  );
}