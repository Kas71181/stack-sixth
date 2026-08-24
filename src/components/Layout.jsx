import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, LogOut, User, ArrowLeftRight, Settings, ChevronDown, Layers, TrendingDown, ShieldCheck, Activity, Headphones, BadgeDollarSign } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useState, useRef, useEffect } from "react";
import { base44 as analyticsClient } from "@/api/base44Client";
import AssistantChat from "@/components/assistant/AssistantChat";
import GlobalSearch from "@/components/GlobalSearch";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SubscriptionStatusBanner from "@/components/subscription/SubscriptionStatusBanner";
import { trackAcquisition } from "@/lib/acquisitionEvents";

const primaryNav = [
  { path: "/app", label: "Overview", icon: Home },
  { path: "/my-stack", label: "My Stack", icon: Layers },
  { path: "/savings", label: "Savings", icon: TrendingDown },
  { path: "/governance", label: "Governance", icon: ShieldCheck },
  { path: "/switch-planner", label: "Switch Planner", icon: ArrowLeftRight },
];

export default function Layout() {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, navigateToLogin } = useAuth();

  // Track page views on every route change
  useEffect(() => {
    const pageNames = {
      "/app": "overview",
      "/my-stack": "my_stack",
      "/savings": "savings",
      "/renewals": "renewals",
      "/governance": "governance",
      "/audit": "audit_form",
      "/history": "history",
      "/it-dashboard": "it_manager",
      "/monitoring": "monitoring",
      "/switch-planner": "switch_planner",
      "/purchase-requests": "purchase_requests",
      "/lifecycle": "lifecycle_governance",
      "/marketplace": "marketplace",
      "/intelligence": "intelligence_library",
      "/contracts": "contracts",
      "/settings": "settings",
      "/data-coverage": "data_coverage",
      "/admin/usage-evidence": "usage_evidence_admin",
    };
    const page = pageNames[location.pathname] || location.pathname.replace("/", "").replace(/\//g, "_") || "unknown";
    analyticsClient.analytics.track({ eventName: "page_view", properties: { page } });
    const today = new Date().toISOString().slice(0, 10);
    if (user?.id && localStorage.getItem("stackSixthActiveDay") !== today) {
      localStorage.setItem("stackSixthActiveDay", today);
      trackAcquisition("app_active", { day: today });
    }
  }, [location.pathname, user?.id]);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
  const { data: subscriptionAccess } = useQuery({ queryKey: ["subscription-access"], queryFn: async () => (await base44.functions.invoke("getSubscriptionAccess", {})).data, enabled: !!user?.id });
  const { data: userActivity } = useQuery({
    queryKey: ["activity-layout", user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ created_by_id: user?.id }, "-updated_date", 50),
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Floating glass header */}
      <header className="sticky top-0 z-50">
        <div className="absolute inset-0 border-b"
          style={{
            background: 'var(--nav-bg)',
            borderColor: 'var(--nav-border)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[3.75rem]">

            {/* Logo */}
            <Link to="/app" className="flex items-center flex-shrink-0 group">
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
              {primaryNav.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.96] ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">{label}</span>
                  </Link>
                );
              })}

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
                      <div className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-xl py-1.5 z-50 overflow-hidden animate-scale-in">
                        <div className="px-3.5 py-2.5 border-b border-border/40 mb-1">
                          <p className="text-xs font-semibold text-foreground truncate">{user.full_name || "Account"}</p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                        </div>
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/90 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6 transition-colors mx-1 rounded-lg"
                        >
                          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                          Settings
                        </Link>
                        {user.role === "admin" && <Link to="/support" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/90 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6 transition-colors mx-1 rounded-lg"><Headphones className="w-3.5 h-3.5 text-muted-foreground" />Support inbox</Link>}
                        {user.role === "admin" && <Link to="/admin/pricing-partners" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/90 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6 transition-colors mx-1 rounded-lg"><BadgeDollarSign className="w-3.5 h-3.5 text-muted-foreground" />Pricing & partners</Link>}
                        {user.role === "admin" && <Link to="/admin/usage-evidence" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground/90 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6 transition-colors mx-1 rounded-lg"><Activity className="w-3.5 h-3.5 text-muted-foreground" />Usage evidence</Link>}
                        <div className="my-1 border-t border-border/40 mx-2" />
                        <button
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6 transition-colors mx-1 rounded-lg"
                          style={{ width: "calc(100% - 8px)" }}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={navigateToLogin}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/6 transition-all duration-200 active:scale-[0.96]"
                    >
                      Sign in
                    </button>
                    <Link
                      to="/pricing"
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-[0.96] shadow-sm shadow-primary/25"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>
      <SubscriptionStatusBanner enabled={!!user?.id} />

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 sm:pb-12">
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
          {primaryNav.map(({ path, label, icon: Icon }) => {
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

      {!subscriptionAccess?.read_only && !location.pathname.startsWith("/support") && <AssistantChat audits={audits} recommendations={recommendations} monitorReports={monitorReports} contracts={contracts} userActivity={userActivity} />}


    </div>
  );
}