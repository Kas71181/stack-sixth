import { FileUp, MailSearch, Plus } from "lucide-react";
import RenewalEntryCard from "@/components/contracts/RenewalEntryCard";
import RenewalWorkflow from "@/components/contracts/RenewalWorkflow";

export default function RenewalEmptyState({ onAdd, onUpload, onGmail }) {
  return <section className="rounded-2xl border border-border bg-card px-5 py-8 shadow-sm sm:px-8">
    <div className="mx-auto max-w-2xl text-center"><h2 className="text-xl font-extrabold">Your renewal workspace is ready.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Bring your software contracts into Governance and we’ll help you track renewal dates, notice periods, and upcoming decisions.</p></div>
    <div className="mt-8 grid gap-3 md:grid-cols-3">
      <RenewalEntryCard icon={Plus} title="Add manually" description="Already know the renewal details?" action="Add renewal" onClick={onAdd} />
      <RenewalEntryCard icon={FileUp} title="Upload a contract" description="Let AI identify renewal dates and important terms." action="Upload contract" onClick={onUpload} featured badge="AI-powered" />
      <RenewalEntryCard icon={MailSearch} title="Scan Gmail" description="Find renewal dates hidden in invoices and emails." action="Connect Gmail" onClick={onGmail} />
    </div>
    <RenewalWorkflow />
  </section>;
}