import { useState } from "react";
import RenewalRow from "@/components/contracts/RenewalRow";
import RenewalDetailSheet from "@/components/contracts/RenewalDetailSheet";

export default function RenewalList({ contracts, onUpdated }) {
  const [selected, setSelected] = useState(null);
  return <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="hidden grid-cols-[minmax(180px,1.4fr)_1fr_.8fr_.8fr_auto] gap-4 border-b bg-muted/30 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid"><span>Software</span><span>Renewal</span><span>Auto-renew</span><span>Value & status</span><span className="sr-only">Actions</span></div>
    {contracts.map((contract) => <RenewalRow key={contract.id} contract={contract} onOpen={setSelected} />)}
    {!contracts.length && <p className="px-5 py-12 text-center text-sm text-muted-foreground">No renewals match these filters.</p>}
    <RenewalDetailSheet contract={selected} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} onUpdated={() => { onUpdated(); setSelected(null); }} />
  </section>;
}