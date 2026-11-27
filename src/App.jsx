import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLES, hasAccess, normalizeRole } from './utils/rbac';
import { isCustomerAuthenticated } from './api/customerApi';
import { getMerchantToken, getStoredMerchantUser } from './api/merchantApi';
import AdminLayout from './components/Layout/AdminLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegistrationRequests from './pages/RegistrationRequests';
import Categories from './pages/Categories';
import Merchants from './pages/Merchants';
import MerchantDetail from './pages/MerchantDetail';
import AdDetail from './pages/AdDetail';
import MarketplacePage from './pages/MarketplacePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmedPage from './pages/OrderConfirmedPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdsPage from './pages/AdsPage';
import Users from './pages/Users';
import Promotions from './pages/Promotions';
import Complaints from './pages/Complaints';
import Content from './pages/Content';
import Geography from './pages/Geography';
import Reports from './pages/Reports';
import MerchantPortal from './pages/MerchantPortal';
import Products from './pages/Products';
import SellerPortal from './pages/SellerPortal';
import CompanyWallet from './pages/CompanyWallet';
import Withdrawals from './pages/Withdrawals';
import Subscriptions from './pages/Subscriptions';
import Customers from './pages/Customers';
import ImpersonationBanner from './components/common/ImpersonationBanner';


const hasMerchantSession = () => Boolean(getMerchantToken() && getStoredMerchantUser());

// Protected route wrapper — allows Admin/Staff AuthContext, Customer session, or Merchant session
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated && !isCustomerAuthenticated() && !hasMerchantSession()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Dashboard route — supports Admin/Staff, impersonation, and direct Customer landing-page sessions
function DashboardRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated) {
    const role = normalizeRole(user);
    if (role === ROLES.SELLER) {
      return <Navigate to="/products" replace />;
    }
    if (role === ROLES.MERCHANT && !isCustomerAuthenticated()) {
      return <Navigate to="/merchant" replace />;
    }
    return children;
  }
  if (isCustomerAuthenticated()) {
    return children;
  }
  if (hasMerchantSession()) {
    return <Navigate to="/merchant" replace />;
  }
  return <Navigate to="/login" replace />;
}

// Merchant workspace route — supports Admin, Merchant AuthContext, or direct Merchant landing-page sessions
function MerchantWorkspaceRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated || hasMerchantSession()) {
    return children;
  }
  if (isCustomerAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

// Admin & Staff only route wrapper — merchants & sellers are redirected to their respective platforms
function AdminOnlyRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    if (hasMerchantSession()) return <Navigate to="/merchant" replace />;
    if (isCustomerAuthenticated()) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }
  const role = normalizeRole(user);
  if (role === ROLES.SELLER) {
    return <Navigate to="/products" replace />;
  }
  if (role === ROLES.MERCHANT) {
    return <Navigate to="/merchant" replace />;
  }
  return children;
}

// Role-based route wrapper — checks if logged in user has allowed role access
function RoleProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    if (hasMerchantSession()) return <Navigate to="/merchant" replace />;
    if (isCustomerAuthenticated()) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }
  const role = normalizeRole(user);
  if (role === ROLES.SELLER) {
    return <Navigate to="/products" replace />;
  }
  if (role === ROLES.MERCHANT) {
    return <Navigate to="/merchant" replace />;
  }
  if (!hasAccess(user, allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Admin, Merchant, and legacy standalone Seller only — Customers stay inside /dashboard
function ProductsPlatformRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const role = normalizeRole(user);
  if (role === ROLES.STAFF) {
    return <Navigate to="/dashboard?tab=my-products" replace />;
  }
  return children;
}

// Public login wrapper — redirects based on role if already authenticated
function LoginPublicRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated) {
    const role = normalizeRole(user);
    if (role === ROLES.SELLER) {
      return <Navigate to="/products" replace />;
    }
    if (role === ROLES.MERCHANT) {
      return <Navigate to="/merchant" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page & Views */}
      <Route path="/" element={<LandingPage defaultTab="home" />} />
      <Route path="/landing" element={<LandingPage defaultTab="home" />} />
      <Route path="/category.php" element={<LandingPage defaultTab="categories" />} />
      <Route path="/places" element={<LandingPage defaultTab="places" />} />
      <Route path="/place/:id" element={<MerchantDetail isPublic={true} />} />
      <Route path="/merchant/:id" element={<MerchantDetail isPublic={true} />} />
      <Route path="/merchant-detail/:id" element={<MerchantDetail isPublic={true} />} />
      <Route path="/ad/:id" element={<AdDetail isPublic={true} />} />
      <Route path="/ad-detail/:id" element={<AdDetail isPublic={true} />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/market" element={<MarketplacePage />} />
      <Route path="/store" element={<MarketplacePage />} />
      <Route path="/products-catalog" element={<MarketplacePage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/market/product/:id" element={<ProductDetailPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order/checkout" element={<CheckoutPage />} />
      <Route path="/order/confirmed" element={<OrderConfirmedPage />} />
      <Route path="/order/:id" element={<OrderTrackingPage />} />
      <Route path="/track/:id" element={<OrderTrackingPage />} />
      <Route path="/my-orders" element={<OrderTrackingPage />} />
      <Route path="/orders" element={<OrderTrackingPage />} />
      <Route path="/ads" element={<AdsPage />} />
      <Route path="/featured-ads" element={<AdsPage />} />
      <Route path="/network" element={<AdsPage />} />
      <Route path="/contact" element={<LandingPage defaultTab="contact" />} />

      {/* Login — public only */}
      <Route
        path="/login"
        element={
          <LoginPublicRoute>
            <Login />
          </LoginPublicRoute>
        }
      />

      {/* Admin routes — protected */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardRoute><Dashboard /></DashboardRoute>} />
        <Route path="/admin" element={<AdminOnlyRoute><Dashboard /></AdminOnlyRoute>} />
        <Route path="/categories" element={<AdminOnlyRoute><Categories /></AdminOnlyRoute>} />
        <Route path="/merchants" element={<AdminOnlyRoute><Merchants /></AdminOnlyRoute>} />
        <Route path="/merchants/:id" element={<AdminOnlyRoute><MerchantDetail /></AdminOnlyRoute>} />
        <Route path="/customers" element={<AdminOnlyRoute><Customers /></AdminOnlyRoute>} />
        <Route path="/merchant" element={<MerchantWorkspaceRoute><MerchantPortal /></MerchantWorkspaceRoute>} />
        <Route path="/merchant/dashboard" element={<MerchantWorkspaceRoute><MerchantPortal /></MerchantWorkspaceRoute>} />
        <Route path="/merchant-portal" element={<MerchantWorkspaceRoute><MerchantPortal /></MerchantWorkspaceRoute>} />
        <Route path="/geography" element={<AdminOnlyRoute><Geography /></AdminOnlyRoute>} />
        <Route path="/reports" element={<AdminOnlyRoute><Reports /></AdminOnlyRoute>} />
        <Route path="/products" element={<ProductsPlatformRoute><Products /></ProductsPlatformRoute>} />
        <Route path="/seller" element={<ProductsPlatformRoute><Products /></ProductsPlatformRoute>} />
        <Route path="/seller-hub" element={<ProductsPlatformRoute><Products /></ProductsPlatformRoute>} />


        {/* Restricted Admin / Super Admin routes */}
        <Route
          path="/registration-requests"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <RegistrationRequests />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Users />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/promotions"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Promotions />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/complaints"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Complaints />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/content"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Content />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <CompanyWallet />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/withdrawals"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Withdrawals />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Subscriptions />
            </RoleProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all — redirect to home landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ImpersonationBanner />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
