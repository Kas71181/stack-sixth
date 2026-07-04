import { Shield, Lock, KeyRound, EyeOff, Server, CheckCircle2, FileText, ExternalLink } from "lucide-react";

const SECURITY_PILLARS = [
  {
    icon: Lock,
    title: "Encryption at Rest & in Transit",
    description: "All data is encrypted with AES-256 at rest and TLS 1.2+ in transit. OAuth tokens and API credentials are stored encrypted and never exposed to the frontend.",
  },
  {
    icon: KeyRound,
    title: "Row-Level Security (RLS)",
    description: "Every entity in Stack Sixth is protected by RLS policies. Users can only read, update, or delete their own records. Admins have scoped oversight — no global data exposure.",
  },
  {
    icon: EyeOff,
    title: "Minimal-Access Data Collection",
    description: "We read only seat and activity metadata (names, emails, login counts). We never access message content, repository code, documents, financial transactions, or customer records.",
  },
  {
    icon: Server,
    title: "Isolated Multi-Tenant Architecture",
    description: "Your data is logically isolated per tenant on the Base44 platform. No cross-tenant data leakage is possible at the database or application layer.",
  },
  {
    icon: Shield,
    title: "Authenticated Backend Functions",
    description: "Every backend endpoint verifies user identity and role before processing. Scheduled and admin functions require admin-level authentication — no unauthenticated access.",
  },
  {
    icon: FileText,
    title: "Audit Trail",
    description: "Key actions — approvals, status changes, contract edits — are logged to an immutable audit trail with actor, timestamp, and before/after values.",
  },
];

const COMPLIANCE_BADGES = [
  { label: "SOC 2 Type II", desc: "Annual third-party audit" },
  { label: "ISO 27001", desc: "Information security management" },
  { label: "GDPR", desc: "EU data protection regulation" },
  { label: "Encryption", desc: "AES-256 at rest, TLS 1.2+ in transit" },
];

export default function SecurityStatementSection() {
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="font-bold text-base">Security Statement</h2>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            How Stack Sixth protects your data — from encryption to access controls.
          </p>
        </div>
      </div>

      {/* Summary blurb */}
      <div className="rounded-xl bg-muted/30 border border-border/40 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Stack Sixth is built on the <strong className="text-foreground">Base44</strong> platform, which provides enterprise-grade infrastructure security.
          We apply the principle of least privilege: we collect only the metadata needed to detect wasted SaaS spend, and we never touch your business data.
          Below is a summary of our security posture.
        </p>
      </div>

      {/* Security pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECURITY_PILLARS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-xl border border-border/40 p-4 bg-background/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-sm font-semibold">{title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Compliance badges */}
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">Compliance & Certifications</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {COMPLIANCE_BADGES.map(({ label, desc }) => (
            <div key={label} className="rounded-xl border border-border/40 p-3 text-center bg-background/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs font-bold">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data retention note */}
      <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3.5">
        <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-foreground">Data Retention & Deletion</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Your data is retained for the lifetime of your account. Disconnecting a tool immediately revokes its OAuth token. Deleting your account permanently removes all associated records.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-muted-foreground">Last updated: July 2026</p>
        <a
          href="https://base44.com/security"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          Platform Trust Center <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}