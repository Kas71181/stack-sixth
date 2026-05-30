import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Layers, Users, FileText, Grid3X3, Plug, BarChart3, Settings } from "lucide-react";

const NAV = [
  { to: "/stack", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/stack/tool-stack", label: "Tool Stack", icon: Layers },
  { to: "/stack/usage", label: "Usage Analytics", icon: Users },
  { to: "/stack/audit-report", label: "Audit Report", icon: FileText },
  { to: "/stack/categories", label: "Categories", icon: Grid3X3 },
  { to: "/stack/integrations", label: "Integrations", icon: Plug },
  { to: "/stack/reports", label: "Reports", icon: BarChart3 },
  { to: "/stack/settings", label: "Settings", icon: Settings },
];

export default function StackLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-slate-700">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Stack Sixth</p>
          <p className="text-sm font-semibold text-white">SaaS Intelligence</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}