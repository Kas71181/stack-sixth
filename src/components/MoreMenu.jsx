import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Layers } from "lucide-react";

export default function MoreMenu({ items, label = "My Stack" }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const hasActive = items.some(({ path }) => location.pathname === path);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.96] ${
          hasActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6"
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">{label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl py-1.5 z-50 overflow-hidden animate-scale-in">
          {items.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors mx-1 rounded-lg ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/90 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}