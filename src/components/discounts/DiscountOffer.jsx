import { ExternalLink, Tag } from "lucide-react";

const SOURCE_LABELS = {
  partner_catalog: "Partner offer",
  inbox: "Inbox offer",
  vendor: "Vendor offer",
};

export default function DiscountOffer({ offer, compact = false }) {
  if (!offer) return null;
  const detail = offer.discount_percent ? `${offer.discount_percent}% off` : offer.title;
  return <div className={`min-w-0 rounded-lg border border-emerald-500/20 bg-emerald-500/8 text-emerald-800 dark:text-emerald-300 ${compact ? "px-2 py-1" : "p-3"}`}>
    <div className="flex items-start gap-2">
      <Tag className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">{detail}</p>
        {!compact && offer.terms && <p className="mt-1 text-[11px] leading-4 opacity-80">{offer.terms}</p>}
        <p className="mt-1 text-[10px] font-medium opacity-70">{SOURCE_LABELS[offer.source_type] || "Verified offer"} · checked {new Date(offer.verified_at).toLocaleDateString()}</p>
      </div>
      {offer.source_url && <a href={offer.source_url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} aria-label="View discount source"><ExternalLink className="h-3.5 w-3.5" /></a>}
    </div>
  </div>;
}