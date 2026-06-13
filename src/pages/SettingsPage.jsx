import { motion } from "framer-motion";
import AccountSection from "@/components/settings/AccountSection";
import CompanyProfileSection from "@/components/settings/CompanyProfileSection";
import NotificationsSection from "@/components/settings/NotificationsSection";
import ApiCredentialsSection from "@/components/settings/ApiCredentialsSection";
import DangerZoneSection from "@/components/settings/DangerZoneSection";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.3 },
});

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>

      <motion.div {...fadeUp(0)} className="glass-card divide-y divide-border/40 overflow-hidden">
        <AccountSection />
        <CompanyProfileSection />
      </motion.div>
      <motion.div {...fadeUp(0.10)}><NotificationsSection /></motion.div>
      <motion.div {...fadeUp(0.15)}><ApiCredentialsSection /></motion.div>
      <motion.div {...fadeUp(0.20)}><DangerZoneSection /></motion.div>
    </div>
  );
}