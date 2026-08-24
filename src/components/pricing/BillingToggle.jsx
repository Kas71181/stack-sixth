export default function BillingToggle({ value, onChange }) {
  return <div className="tab-track inline-flex" aria-label="Billing interval">
    {['monthly', 'annual'].map((interval) => <button key={interval} onClick={() => onChange(interval)} className={`rounded-xl px-5 py-2 text-sm font-semibold capitalize active:scale-[0.96] ${value === interval ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}>{interval}{interval === 'annual' && <span className="ml-2 text-[10px] opacity-80">2 months free</span>}</button>)}
  </div>;
}