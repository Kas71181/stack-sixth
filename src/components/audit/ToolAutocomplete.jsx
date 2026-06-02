import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { searchTools } from "@/lib/toolCatalog";

export default function ToolAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const results = searchTools(val);
    setSuggestions(results);
    setOpen(results.length > 0);
  };

  const handleSelect = (tool) => {
    onSelect(tool);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={placeholder || "Tool name (e.g. Slack)"}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="h-10 rounded-lg"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((tool) => (
            <button
              key={tool.name}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(tool); }}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted text-sm transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{tool.name}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{tool.category}</span>
              </div>
              {tool.avg_monthly_cost > 0 && (
                <span className="text-xs text-muted-foreground font-mono">~${tool.avg_monthly_cost}/mo</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}