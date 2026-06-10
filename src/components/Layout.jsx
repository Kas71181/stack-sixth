import { Outlet, Link, useLocation } from "react-router-dom";
import { BarChart3, History, Home, Monitor, ShoppingCart, LogOut, User, Activity, ArrowLeftRight, Settings } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import AssistantChat from "@/components/assistant/AssistantChat";
import GlobalSearch from "@/components/GlobalSearch";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/audit", label: "New Audit", icon: BarChart3 },
  { path: "/history", label: "History", icon: History },
  { path: "/it-dashboard", label: "IT Manager", icon: Monitor },
  { path: "/monitoring", label: "Monitor", icon: Activity },
  { path: "/switch-planner", label: "Switch Planner", icon: ArrowLeftRight },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const { items, setIsOpen } = useCart();
  const { user, logout, navigateToLogin } = useAuth();

  const { data: audits } = useQuery({
    queryKey: ["audits-layout", user?.id],
    queryFn: () => base44.entities.SoftwareAudit.filter({ created_by_id: user?.id, status: "completed" }, "-created_date", 20),
    enabled: !!user?.id,
  });
  const { data: recommendations } = useQuery({
    queryKey: ["recs-layout", user?.id],
    queryFn: () => base44.entities.Recommendation.filter({ created_by_id: user?.id }, "-created_date", 100),
    enabled: !!user?.id,
  });
  const { data: monitorReports } = useQuery({
    queryKey: ["monitors-layout", user?.id],
    queryFn: () => base44.entities.ToolMonitor.filter({ created_by_id: user?.id }, "-created_date", 20),
    enabled: !!user?.id,
  });
  const { data: contracts } = useQuery({
    queryKey: ["contracts-layout", user?.id],
    queryFn: () => base44.entities.Contract.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });
  const { data: userActivity } = useQuery({
    queryKey: ["activity-layout", user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ created_by_id: user?.id }, "-updated_date", 50),
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-background">
      <CartDrawer />
      {/* Desktop header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur-2xl shadow-sm shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <img
                src="https://media.base44.com/images/public/69f28176704facfd454194e1/3dbb86754_Untitleddesign2.svg"
                alt="Stack Sixth"
                className="h-40 object-contain"
              />
            </Link>
            <div className="flex-1 max-w-xs hidden sm:block mx-4">
              <GlobalSearch audits={audits} recommendations={recommendations} />
            </div>
            <nav className="flex items-center gap-1">
              {navItems.filter(({ adminOnly }) => !adminOnly || user?.role === "admin").map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm shadow-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/60 hover:backdrop-blur-sm"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => setIsOpen(true)}
                className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {items.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-border/60">
                {user && (
                  <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground px-2">
                    <User className="w-3.5 h-3.5" />
                    {user.full_name || user.email}
                  </span>
                )}
                <button
                  onClick={() => user ? logout() : navigateToLogin()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                >
                  {user ? <LogOut className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  <span className="hidden sm:inline">{user ? "Logout" : "Login"}</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/75 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[9px] font-medium truncate w-full text-center">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AssistantChat audits={audits} recommendations={recommendations} monitorReports={monitorReports} contracts={contracts} userActivity={userActivity} />
    </div>
  );
}