import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
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
import IntelligenceLibrary from './pages/IntelligenceLibrary';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MyStack from './pages/MyStack';
import Savings from './pages/Savings';
import Governance from './pages/Governance';
import UsageEvidenceAdmin from './pages/UsageEvidenceAdmin';
import SupportInbox from './pages/SupportInbox';
import SupportRoom from './pages/SupportRoom';
import Pricing from './pages/Pricing';
import SignupSetup from './pages/SignupSetup';
import PricingPartners from './pages/PricingPartners';
import ActiveSubscriptionGate from '@/components/subscription/ActiveSubscriptionGate';
import ProtectedRoute from '@/components/ProtectedRoute';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import MarketingHome from '@/pages/MarketingHome';
import PublicInfoPage from '@/pages/PublicInfoPage';
import LegalPage from '@/pages/LegalPage';
import ContactSales from '@/pages/ContactSales';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import CheckoutCancelled from '@/pages/CheckoutCancelled';
import BillingSettings from '@/pages/BillingSettings';
import Onboarding from '@/pages/Onboarding';
import SeoManager from '@/components/SeoManager';


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

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
    } else if (authError.type !== 'auth_required') {
      return <div className="p-8 text-center text-sm text-muted-foreground">Stack Sixth is temporarily unavailable.</div>;
    }
  }

  // Render public pages and the preserved authenticated product separately.
  return (
    <>
      <SeoManager />
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<MarketingHome />} />
          <Route path="/product" element={<PublicInfoPage type="product" />} />
          <Route path="/features" element={<PublicInfoPage type="features" />} />
          <Route path="/how-it-works" element={<PublicInfoPage type="how-it-works" />} />
          <Route path="/integrations" element={<PublicInfoPage type="integrations" />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<PublicInfoPage type="about" />} />
          <Route path="/contact" element={<PublicInfoPage type="contact" />} />
          <Route path="/contact-sales" element={<ContactSales />} />
          <Route path="/faq" element={<PublicInfoPage type="faq" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/cookies" element={<LegalPage type="cookies" />} />
          <Route path="/acceptable-use" element={<LegalPage type="acceptable-use" />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/checkout" element={<Navigate to="/signup" replace />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/signup/setup" element={<SignupSetup />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancelled" element={<CheckoutCancelled />} />
          <Route path="/settings/billing" element={<BillingSettings />} />
          <Route path="/onboarding" element={<ActiveSubscriptionGate><Onboarding /></ActiveSubscriptionGate>} />
          <Route element={<ActiveSubscriptionGate />}>
            <Route element={<Layout />}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/my-stack" element={<MyStack />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/renewals" element={<Navigate to="/governance?tab=renewals" replace />} />
              <Route path="/audit" element={<AuditForm />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="/history" element={<History />} />
              <Route path="/it-dashboard" element={<Navigate to="/savings" replace />} />
              <Route path="/monitoring" element={<Navigate to="/app" replace />} />
              <Route path="/contracts" element={<Navigate to="/governance?tab=renewals" replace />} />
              <Route path="/switch-planner" element={<SwitchPlanner />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin/usage-evidence" element={<UsageEvidenceAdmin />} />
              <Route path="/admin/pricing-partners" element={<PricingPartners />} />
              <Route path="/support" element={<SupportInbox />} />
              <Route path="/support/:id" element={<SupportRoom />} />
              <Route path="/data-coverage" element={<Navigate to="/my-stack?tab=connect" replace />} />
              <Route path="/shared-report" element={<SharedReport />} />
              <Route path="/purchase-requests" element={<Navigate to="/governance?tab=purchases" replace />} />
              <Route path="/lifecycle" element={<Navigate to="/governance?tab=lifecycle" replace />} />
              <Route path="/marketplace" element={<Navigate to="/app" replace />} />
              <Route path="/intelligence" element={<Navigate to="/renewals" replace />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
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