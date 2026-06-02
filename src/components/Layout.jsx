import { Outlet, Link, useLocation } from "react-router-dom";
import { BarChart3, History, Home, Monitor, ShoppingCart, LogOut, User, Activity } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import AssistantChat from "@/components/assistant/AssistantChat";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/audit", label: "New Audit", icon: BarChart3 },
  { path: "/history", label: "History", icon: History },
  { path: "/it-dashboard", label: "IT Manager", icon: Monitor },
  { path: "/monitoring", label: "Monitor", icon: Activity },
];

export default function Layout() {
  const location = useLocation();
  const { items, setIsOpen } = useCart();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <CartDrawer />
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <img
                src="https://media.base44.com/images/public/69f28176704facfd454194e1/3dbb86754_Untitleddesign2.svg"
                alt="Stack Sixth"
                className="h-40 object-contain"
              />
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
                  onClick={() => user ? logout() : base44.auth.redirectToLogin()}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <AssistantChat />
    </div>
  );
}