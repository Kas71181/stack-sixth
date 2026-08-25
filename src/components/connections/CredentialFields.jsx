import { Input } from "@/components/ui/input";

const defaultFields = [{ name: "api_key", label: "API token", placeholder: "Paste API token" }];

export default function CredentialFields({ connector, values, onChange }) {
  const fields = connector?.credentialFields || defaultFields;
  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <label key={field.name} className="block space-y-1.5">
          <span className="text-xs font-semibold text-foreground">{field.label}</span>
          <Input type="password" autoComplete="off" placeholder={field.placeholder} value={values[field.name] || ""} onChange={(event) => onChange(field.name, event.target.value)} />
        </label>
      ))}
    </div>
  );
}