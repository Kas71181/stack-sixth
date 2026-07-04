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
import ContractIntelligence from './pages/ContractIntelligence';
import SwitchPlanner from './pages/SwitchPlanner';
import SettingsPage from './pages/SettingsPage';
import DataCoverageSetup from './pages/DataCoverageSetup';
import SharedReport from './pages/SharedReport';
import PurchaseRequests from './pages/PurchaseRequests';
import LifecycleGovernance from './pages/LifecycleGovernance';
import Marketplace from './pages/Marketplace';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';


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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/audit" element={<AuditForm />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/history" element={<History />} />
        <Route path="/it-dashboard" element={<ITDashboard />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/contracts" element={<ContractIntelligence />} />
        <Route path="/switch-planner" element={<SwitchPlanner />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/data-coverage" element={<DataCoverageSetup />} />
        <Route path="/shared-report" element={<SharedReport />} />
        <Route path="/purchase-requests" element={<PurchaseRequests />} />
        <Route path="/lifecycle" element={<LifecycleGovernance />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="*" element={<PageNotFound />} />
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