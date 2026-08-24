import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function InviteTeamSection() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState([]);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) return toast.error("Enter a valid email address");
    setSending(true);
    try {
      await base44.users.inviteUser(email.trim(), "user");
      await base44.functions.invoke("inviteCompanyMember", { email: email.trim(), company_role: role });
      setSent((prev) => [...prev, email.trim()]);
      setEmail("");
      toast.success(`Invite sent to ${email.trim()}`);
    } catch (err) {
      toast.error(err?.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Invite Teammates</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Invite Finance, IT, or Ops teammates to collaborate on audits, approve recommendations, and manage contracts together.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="member">Member</option>
          <option value="manager">Company Manager</option>
        </select>
        <Button size="sm" onClick={handleInvite} disabled={sending || !email.trim()} className="gap-1.5">
          {sending ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          Invite
        </Button>
      </div>

      {sent.length > 0 && (
        <div className="space-y-1.5">
          {sent.map((e) => (
            <div key={e} className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Invite sent to <strong>{e}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}