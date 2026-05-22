import { Outlet, Link, useLocation } from "react-router-dom";
import { BarChart3, History, Home, Monitor } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/audit", label: "New Audit", icon: BarChart3 },
  { path: "/history", label: "History", icon: History },
  { path: "/it-dashboard", label: "IT Manager", icon: Monitor },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="https://media.base44.com/images/public/69f28176704facfd454194e1/1136b18ad_StackAsset300x.png"
                alt="Stack Sixth"
                className="h-8 w-8 object-contain"
              />
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight tracking-tight">Stack Sixth</span>
                <span className="text-[10px] text-muted-foreground leading-tight italic">The sixth sense for software decisions.</span>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}