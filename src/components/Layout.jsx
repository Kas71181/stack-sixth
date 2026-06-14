import { Outlet, Link, useLocation } from "react-router-dom";
import { BarChart3, History, Home, Monitor, ShoppingCart, LogOut, User, Activity, ArrowLeftRight, Settings, ChevronDown } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/components/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import AssistantChat from "@/components/assistant/AssistantChat";
import GlobalSearch from "@/components/GlobalSearch";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/audit", label: "New Audit", icon: BarChart3 },
  { path: "/history", label: "History", icon: History },
  { path: "/it-dashboard", label: "IT Manager", icon: Monitor },
  { path: "/monitoring", label: "Monitor", icon: Activity },
  { path: "/switch-planner", label: "Switch Planner", icon: ArrowLeftRight },
];

export default function Layout() {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
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

      {/* Floating glass header */}
      <header className="sticky top-0 z-50">
        {/* Glass blur layer */}
        <div className="absolute inset-0 border-b"
          style={{
            background: 'var(--nav-bg)',
            borderColor: 'var(--nav-border)',
            backdropFilter: 'blur(28px) saturate(200%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.03), 0 4px 20px rgba(0,0,0,0.05)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[4.5rem]">

            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0 group">
              <img
                src="https://media.base44.com/images/public/69f28176704facfd454194e1/d3ef5da50_StackSixth.svg"
                alt="Stack Sixth"
                className="h-9 object-contain transition-opacity duration-200 group-hover:opacity-80 dark:hidden"
              />
              <img
                src="https://media.base44.com/images/public/69f28176704facfd454194e1/9bbf1227c_Asset5.svg"
                alt="Stack Sixth"
                className="h-9 object-contain transition-opacity duration-200 group-hover:opacity-80 hidden dark:block"
              />
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-sm hidden sm:block mx-6">
              <GlobalSearch audits={audits} recommendations={recommendations} />
            </div>

            {/* Nav links */}
            <nav className="flex items-center gap-0.5">
              {navItems.filter(({ adminOnly }) => !adminOnly || user?.role === "admin").map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.96] ${
                      isActive
                        ? "bg-primary/12 text-primary shadow-sm shadow-primary/15 ring-1 ring-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{label}</span>
                  </Link>
                );
              })}

              {/* Cart */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 active:scale-[0.96] ml-1"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-sm">Cart</span>
                {items.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm shadow-primary/40">
                    {items.length}
                  </span>
                )}
              </button>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Divider */}
              <div className="w-px h-5 bg-border/60 mx-1" />

              {/* User menu */}
              <div ref={userMenuRef} className="relative">
                {user ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen((o) => !o)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 active:scale-[0.96]"
                    >
                      <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="hidden sm:inline max-w-[110px] truncate">{user.full_name || user.email}</span>
                      <ChevronDown className={`w-3 h-3 hidden sm:inline transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 glass-strong py-1.5 z-50 overflow-hidden shadow-xl">
                        <div className="px-3 py-2 border-b border-border/50 mb-1">
                          <p className="text-xs font-semibold text-foreground truncate">{user.full_name || "Account"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors rounded-lg mx-1"
                        >
                          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                          Settings
                        </Link>
                        <div className="my-1 border-t border-border/40 mx-2" />
                        <button
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors rounded-lg mx-1"
                          style={{ width: "calc(100% - 8px)" }}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={navigateToLogin}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.96] shadow-sm shadow-primary/25"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Onboarding checklist — persistent banner across all pages until dismissed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <OnboardingChecklist
          audits={audits}
          recommendations={recommendations}
          monitorReports={monitorReports}
          userActivity={userActivity}
          contracts={contracts}
        />
      </div>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-10">
        <Outlet />
      </main>

      {/* Mobile bottom nav — glass pill */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-0 border-t"
          style={{
            background: 'var(--nav-bg)',
            borderColor: 'var(--nav-border)',
            backdropFilter: 'blur(28px) saturate(200%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
          }}
        />
        <div className="relative flex items-center justify-around px-1 py-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1 active:scale-95 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <div className="absolute w-8 h-0.5 bg-primary rounded-full -top-0.5 shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
                )}
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