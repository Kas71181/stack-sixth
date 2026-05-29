import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, Trash2, Save, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AffiliateAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTool, setNewTool] = useState({ tool_name: "", affiliate_url: "", notes: "" });
  const [adding, setAdding] = useState(false);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["affiliate-links"],
    queryFn: () => base44.entities.AffiliateLink.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AffiliateLink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links"] });
      setNewTool({ tool_name: "", affiliate_url: "", notes: "" });
      setAdding(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AffiliateLink.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affiliate-links"] }),
  });

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-32 text-muted-foreground">
        <p className="font-semibold">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Link2 className="w-6 h-6 text-primary" />
            Affiliate Links
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Map tool names to affiliate URLs. These power the "Buy" buttons across the app.
          </p>
        </div>
        <Button onClick={() => setAdding(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Link
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-card border border-primary/20 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold">New Affiliate Link</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tool Name (exact, e.g. HubSpot)</label>
              <Input
                value={newTool.tool_name}
                onChange={(e) => setNewTool({ ...newTool, tool_name: e.target.value })}
                placeholder="HubSpot"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Affiliate URL</label>
              <Input
                value={newTool.affiliate_url}
                onChange={(e) => setNewTool({ ...newTool, affiliate_url: e.target.value })}
                placeholder="https://hubspot.com/?ref=stacksixth"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
            <Input
              value={newTool.notes}
              onChange={(e) => setNewTool({ ...newTool, notes: e.target.value })}
              placeholder="30% commission via PartnerStack"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!newTool.tool_name || !newTool.affiliate_url || createMutation.isPending}
              onClick={() => createMutation.mutate(newTool)}
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Links table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Link2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No affiliate links yet</p>
          <p className="text-xs mt-1">Add your first link to enable Buy buttons across the app.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="bg-card border border-border/60 rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{link.tool_name}</p>
                <a
                  href={link.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary truncate flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  {link.affiliate_url}
                </a>
                {link.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{link.notes}</p>}
              </div>
              <button
                onClick={() => deleteMutation.mutate(link.id)}
                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}