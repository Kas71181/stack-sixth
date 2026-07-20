import { createPortal } from "react-dom";
import { Shield, CheckCircle2, XCircle, Lock, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRIVACY_DETAILS = {
  slack: {
    reads: [
      "Workspace member names and email addresses",
      "Number of messages sent per user (count only, not content)",
      "Days active in the last 30 days",
      "Whether a member is active, dormant, or inactive",
    ],
    never: [
      "Message content or text",
      "DMs or private channels",
      "Files or attachments",
      "Client or customer data",
      "Payment or billing information",
    ],
    scope: "users:read, users:read.email, channels:read, conversations:history",
  },
  github: {
    reads: [
      "Organisation member names and public email addresses",
      "Count of public events (pushes, PRs) in last 30 days",
      "Last active date",
      "Activity score based on event frequency",
    ],
    never: [
      "Private repository code or contents",
      "Commit messages or diffs",
      "Issues or PR descriptions",
      "Secrets, tokens, or credentials",
      "Any proprietary source code",
    ],
    scope: "read:user, user:email, read:org",
  },
  notion: {
    reads: [
      "Workspace member names and email addresses",
      "Last page edit timestamps",
      "Activity frequency (page count edited)",
    ],
    never: [
      "Page content, text, or documents",
      "Database records or table data",
      "Embedded files or media",
      "Client-facing or proprietary content",
    ],
    scope: "read_users, read_content",
  },
  googleworkspace: {
    intro: "Stack Sixth scans up to 50 recent Gmail messages for vendor domains and billing evidence. This provides financial evidence, not live Google Workspace usage telemetry.",
    reads: [
      "Sender and recipient domains from recent messages",
      "Links and vendor domains found in message bodies",
      "Signals that a software vendor or subscription exists",
    ],
    never: [
      "Attachments or files",
      "The ability to send, edit, delete, or label email",
      "Passwords or account credentials",
      "Live employee activity or Google Admin audit logs",
    ],
    scope: "gmail.readonly",
  },
};

const DEFAULT_PRIVACY = {
  reads: [
    "User names and email addresses (your team members only)",
    "Activity timestamps and frequency counts",
    "Login and usage metrics",
  ],
  never: [
    "Customer or client data",
    "Financial or payment information",
    "Proprietary content or documents",
    "Passwords or credentials",
  ],
  scope: "Minimal read-only access",
};

export default function DataPrivacyModal({ connector, onConfirm, onCancel }) {
  const details = PRIVACY_DETAILS[connector.id] || DEFAULT_PRIVACY;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onCancel} />

      {/* Modal */}
      <div className="relative glass-strong flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl animate-scale-in">
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">Data Privacy Disclosure</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connecting <strong>{connector.label}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* Logo + intro */}
        <div className="px-5 pb-4 flex items-center gap-3 bg-muted/30 mx-5 rounded-xl mb-4">
          <img src={connector.logo} alt={connector.label} className="w-8 h-8 object-contain flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {details.intro || <>Stack Sixth only reads <strong>seat and activity metadata</strong> to detect unused licenses. We never access your business data, customer records, or financial information.</>}
          </p>
        </div>

        {/* What we read */}
        <div className="px-5 mb-4">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            What we read
          </p>
          <ul className="space-y-1.5">
            {details.reads.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What we NEVER access */}
        <div className="px-5 mb-4">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            We never access
          </p>
          <ul className="space-y-1.5">
            {details.never.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Scope */}
        <div className="px-5 mb-5">
          <div className="flex items-start gap-2 bg-muted/40 rounded-xl p-3">
            <Lock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">OAuth scopes requested</p>
              <code className="text-[11px] text-foreground/80 break-all">{details.scope}</code>
            </div>
          </div>
        </div>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 gap-3 border-t border-border/40 px-5 py-4">
          <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1 gap-2 btn-glow" onClick={onConfirm}>
            <Shield className="w-3.5 h-3.5" />
            I understand — Connect
          </Button>
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-border/40 px-5 py-3">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-500" />
            <p className="text-[10px] text-muted-foreground">SOC 2 · ISO 27001 · Encrypted</p>
          </div>
          <a
            href="https://base44.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            Trust Center <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}