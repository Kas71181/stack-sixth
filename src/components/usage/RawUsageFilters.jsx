import { Input } from "@/components/ui/input";

export default function RawUsageFilters({ filters, onChange }) {
  const fields = [["application", "Application"], ["user", "User"], ["provider", "Provider"], ["organization", "Organization"]];
  return (
    <div className="grid gap-2 md:grid-cols-4">
      {fields.map(([key, label]) => <Input key={key} value={filters[key]} onChange={(event) => onChange({ ...filters, [key]: event.target.value })} placeholder={label} aria-label={`Filter by ${label.toLowerCase()}`} />)}
    </div>
  );
}