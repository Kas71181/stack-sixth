import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { CartProvider } from '@/components/cart/CartContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AuditForm from './pages/AuditForm';
import Results from './pages/Results.jsx';
import History from './pages/History';
import ITDashboard from './pages/ITDashboard';
import Monitoring from './pages/Monitoring';
import StackLayout from './components/stack/StackLayout';
import StackDashboard from './pages/StackDashboard';
import ToolStack from './pages/ToolStack';
import UsageAnalytics from './pages/UsageAnalytics';
import AuditReportPage from './pages/AuditReportPage';
import CategoryExplorer from './pages/CategoryExplorer';
import IntegrationsPage from './pages/IntegrationsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/audit" element={<AuditForm />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/history" element={<History />} />
        <Route path="/it-dashboard" element={<ITDashboard />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
      <Route path="/stack" element={<StackLayout />}>
        <Route index element={<StackDashboard />} />
        <Route path="tool-stack" element={<ToolStack />} />
        <Route path="usage" element={<UsageAnalytics />} />
        <Route path="audit-report" element={<AuditReportPage />} />
        <Route path="categories" element={<CategoryExplorer />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <CartProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </CartProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App