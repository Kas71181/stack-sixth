import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import AccountSection from "@/components/settings/AccountSection";
import CompanyProfileSection from "@/components/settings/CompanyProfileSection";
import NotificationsSection from "@/components/settings/NotificationsSection";
import ApiCredentialsSection from "@/components/settings/ApiCredentialsSection";
import DangerZoneSection from "@/components/settings/DangerZoneSection";
import InviteTeamSection from "@/components/settings/InviteTeamSection";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.3 },
});

export default function SettingsPage() {
  const { user } = useAuth();

  const { data: audits } = useQuery({ queryKey: ["audits-settings", user?.id], queryFn: () => base44.entities.SoftwareAudit.filter({ created_by_id: user?.id }, "-created_date", 50), enabled: !!user?.id });
  const { data: recommendations } = useQuery({ queryKey: ["recs-settings", user?.id], queryFn: () => base44.entities.Recommendation.filter({ created_by_id: user?.id }, "-created_date", 100), enabled: !!user?.id });
  const { data: monitorReports } = useQuery({ queryKey: ["monitors-settings", user?.id], queryFn: () => base44.entities.ToolMonitor.filter({ created_by_id: user?.id }, "-created_date", 20), enabled: !!user?.id });
  const { data: userActivity } = useQuery({ queryKey: ["activity-settings", user?.id], queryFn: () => base44.entities.UserActivity.filter({ created_by_id: user?.id }, "-updated_date", 20), enabled: !!user?.id });
  const { data: contracts } = useQuery({ queryKey: ["contracts-settings", user?.id], queryFn: () => base44.entities.Contract.filter({ created_by_id: user?.id }), enabled: !!user?.id });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>

      <OnboardingChecklist audits={audits} recommendations={recommendations} monitorReports={monitorReports} userActivity={userActivity} contracts={contracts} />

      <motion.div {...fadeUp(0)} className="glass-card divide-y divide-border/40 overflow-hidden">
        <AccountSection />
        <CompanyProfileSection />
      </motion.div>
      <motion.div {...fadeUp(0.08)} className="glass-card overflow-hidden"><InviteTeamSection /></motion.div>
      <motion.div {...fadeUp(0.10)}><NotificationsSection /></motion.div>
      <motion.div {...fadeUp(0.15)}><ApiCredentialsSection /></motion.div>
      <motion.div {...fadeUp(0.20)}><DangerZoneSection /></motion.div>
    </div>
  );
}