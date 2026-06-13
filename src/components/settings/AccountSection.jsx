import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function AccountSection() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "" });

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setForm({ full_name: u?.full_name || "" });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const updated = await base44.auth.updateMe({ ...user, full_name: form.full_name });
    setUser(updated);
    toast({ title: "Account updated" });
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <User className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-sm">Account</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs mb-1 block">Full Name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ full_name: e.target.value })} placeholder="Your name" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Email</Label>
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-input bg-muted/40 text-sm text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            {user?.email || "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
        <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold">Role: <span className="capitalize text-primary">{user?.role || "user"}</span></p>
          <p className="text-[11px] text-muted-foreground">To change your password, use Forgot Password on the login page.</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? "Saving..." : "Save Account"}
      </Button>
    </div>
  );
}