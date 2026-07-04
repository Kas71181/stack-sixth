import { Shield, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicyFooter() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 pb-2 border-t border-border/40">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <p className="text-[11px] leading-relaxed">
          Your data is encrypted at rest and in transit. Stack Sixth only reads seat & activity metadata — never your business content.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          to="/privacy"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          Privacy Policy
        </Link>
        <a
          href="https://base44.com/security"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          Trust Center <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}