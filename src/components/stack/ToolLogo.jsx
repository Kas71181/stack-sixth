import { useState } from "react";
import { Package } from "lucide-react";
import { toolLogoUrl } from "@/lib/toolLogos";

export default function ToolLogo({ name, className = "h-7 w-7" }) {
  const [failed, setFailed] = useState(false);
  const src = toolLogoUrl(name);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
      {src && !failed ? (
        <img src={src} alt={`${name} logo`} className={`${className} object-contain`} onError={() => setFailed(true)} />
      ) : (
        <Package className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}