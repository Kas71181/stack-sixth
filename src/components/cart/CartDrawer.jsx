import { useCart } from "./CartContext";
import { ShoppingCart, X, Trash2, TrendingDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useState, useEffect } from "react";

export default function CartDrawer() {
  const { items, removeItem, clearCart, isOpen, setIsOpen, totalCost, totalSavings } = useCart();
  const { getUrl } = useAffiliateLinks();
  const [urlMap, setUrlMap] = useState({});

  // Resolve affiliate URLs for all cart items
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    items.forEach(async (item) => {
      if (urlMap[item.name] !== undefined) return;
      const url = await getUrl(item.name);
      setUrlMap((prev) => ({ ...prev, [item.name]: url || "" }));
    });
  }, [isOpen, items]);

  const handleBuyAll = () => {
    items.forEach((item) => {
      const url = urlMap[item.name];
      if (url) window.open(url, "_blank");
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-background border-l border-border shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base">Procurement Cart</h2>
            {items.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs mt-1">Add software recommendations to review for purchase</p>
            </div>
          ) : (
            items.map((item) => {
              const buyUrl = urlMap[item.name];
              return (
                <div key={item.name} className="bg-card border border-border/60 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.category} · {item.audit_name}</p>
                    </div>
                    <button onClick={() => removeItem(item.name)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      {item.estimated_monthly_cost != null && (
                        <p className="text-sm font-bold font-mono">${item.estimated_monthly_cost}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                      )}
                      {item.estimated_savings_opportunity > 0 && (
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                          <TrendingDown className="w-3 h-3" />
                          Saves ${item.estimated_savings_opportunity}/mo
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/15">
                        Score: {item.match_score}
                      </span>
                      {buyUrl && (
                        <a
                          href={buyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Buy
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-5 bg-card space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total monthly cost</span>
                <span className="font-bold font-mono">${totalCost.toLocaleString()}/mo</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Total savings</span>
                  <span className="font-bold font-mono text-emerald-600">-${totalSavings.toLocaleString()}/mo</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-border pt-1.5 mt-1.5">
                <span className="font-medium">Net monthly</span>
                <span className="font-extrabold font-mono">${(totalCost - totalSavings).toLocaleString()}/mo</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={clearCart}>
                Clear All
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handleBuyAll}
                disabled={items.every((i) => !urlMap[i.name])}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buy All
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}