import { motion } from "framer-motion";
import { Shield, Lock, EyeOff, Server, KeyRound, FileText, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import EndUserLicenseAgreement from "@/components/legal/EndUserLicenseAgreement";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const SECTIONS = [
  {
    icon: Lock,
    title: "Data Encryption",
    body: "All data is encrypted with AES-256 at rest and TLS 1.2+ in transit. OAuth tokens and API credentials are stored encrypted and never exposed to the frontend.",
  },
  {
    icon: KeyRound,
    title: "Access Controls",
    body: "Every entity is protected by row-level security (RLS). Users can only access their own records. Admins have scoped oversight for team management — no global data exposure.",
  },
  {
    icon: EyeOff,
    title: "What We Collect",
    body: "We read only seat and activity metadata: user names, email addresses, login counts, and last-active timestamps. This is the minimum needed to detect wasted SaaS spend.",
  },
  {
    icon: EyeOff,
    title: "What We Never Access",
    body: "We never access message content, repository code, documents, financial transactions, customer records, passwords, or credentials. Our connectors request read-only, minimal scopes.",
  },
  {
    icon: Server,
    title: "Data Storage & Isolation",
    body: "Your data is logically isolated per tenant on the Base44 platform. No cross-tenant data leakage is possible at the database or application layer.",
  },
  {
    icon: FileText,
    title: "Audit Trail",
    body: "Key actions — approvals, status changes, contract edits — are logged to an immutable audit trail with actor identity, timestamp, and before/after values.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <motion.div {...fade()}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-5.5 h-5.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Privacy Agreement</h1>
            <p className="text-sm text-muted-foreground">How Stack Sixth protects your data and the terms governing your use.</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Last updated: July 2026</p>
      </motion.div>

      <motion.div {...fade(0.05)} className="glass-card p-5 rounded-xl">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Stack Sixth is a SaaS spend management platform that helps you identify wasted software subscriptions, unused licenses,
          and redundant tools. To do this, we connect to your existing SaaS providers and read <strong className="text-foreground">only seat and activity metadata</strong>.
          We never access your business content, customer data, or financial transactions. This policy explains what we collect, how we use it, and your rights.
        </p>
      </motion.div>

      <motion.div {...fade(0.1)} className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Security & Data Handling</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTIONS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-semibold">{title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fade(0.15)} className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Data Retention & Deletion</h2>
        <div className="glass-card p-5 rounded-xl space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>Your data is retained for the lifetime of your account. Specifically:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">Disconnecting a tool</strong> immediately revokes its OAuth token. We stop receiving new data, but previously synced activity records remain in your account for historical reporting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">Deleting individual records</strong> (tools, contracts, audits) removes them permanently and cannot be undone.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><strong className="text-foreground">Account deletion</strong> permanently removes all associated data — audits, recommendations, contracts, activity records, and settings.</span>
            </li>
          </ul>
        </div>
      </motion.div>

      <motion.div {...fade(0.2)} className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Your Rights</h2>
        <div className="glass-card p-5 rounded-xl text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>Under GDPR and CCPA, you have the right to:</p>
          <ul className="space-y-1.5 ml-1">
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />Access the personal data we hold about you</li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />Request correction of inaccurate data</li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />Request deletion of your data ("right to be forgotten")</li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />Export your data in a portable format</li>
            <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />Withdraw consent for data processing at any time</li>
          </ul>
          <p className="pt-2">To exercise any of these rights, contact your account admin or reach out to our team.</p>
        </div>
      </motion.div>

      <motion.div {...fade(0.25)} className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Compliance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: "SOC 2 Type II", desc: "Annual audit" },
            { label: "ISO 27001", desc: "Info security" },
            { label: "GDPR", desc: "EU protection" },
            { label: "CCPA", desc: "CA privacy" },
          ].map(({ label, desc }) => (
            <div key={label} className="glass-card p-3 text-center rounded-xl">
              <Shield className="w-4 h-4 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs font-bold">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <EndUserLicenseAgreement />

      <motion.div {...fade(0.3)} className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40">
        <p className="text-xs text-muted-foreground">
          Questions about your data? Visit the Trust Center or contact your admin.
        </p>
        <a
          href="https://base44.com/security"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline flex-shrink-0"
        >
          Platform Trust Center <ExternalLink className="w-3 h-3" />
        </a>
      </motion.div>
    </div>
  );
}