import EvidenceBadge from "@/components/evidence/EvidenceBadge";

export default function RawUsageTable({ events }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card/70">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead className="border-b border-border text-muted-foreground"><tr>{["Provider", "Provider user", "Normalized user", "Provider app", "Canonical app", "Event", "Occurred", "Ingested", "Evidence"].map((label) => <th key={label} className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead>
        <tbody>{events.map((event) => <tr key={event.id} className="border-b border-border/60 last:border-0">
          <td className="px-3 py-3 font-medium">{event.provider || "—"}</td><td className="px-3 py-3 font-mono">{event.provider_user_id || "—"}</td><td className="px-3 py-3 font-mono">{event.canonical_user_id || "Unresolved"}</td><td className="px-3 py-3">{event.provider_app_identifier || "—"}</td><td className="px-3 py-3 font-medium">{event.canonical_app_id || "—"}</td><td className="px-3 py-3">{event.event_type}</td><td className="px-3 py-3">{new Date(event.occurred_at).toLocaleString()}</td><td className="px-3 py-3">{event.ingested_at ? new Date(event.ingested_at).toLocaleString() : "—"}</td><td className="px-3 py-3"><EvidenceBadge value={event.evidence_level || "INSUFFICIENT_EVIDENCE"} /></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}