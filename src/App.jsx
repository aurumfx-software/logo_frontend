import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLES, hasAccess, normalizeRole } from './utils/rbac';
import AdminLayout from './components/Layout/AdminLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegistrationRequests from './pages/RegistrationRequests';
import Categories from './pages/Categories';
import Merchants from './pages/Merchants';
import MerchantDetail from './pages/MerchantDetail';
import AdDetail from './pages/AdDetail';
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
import Subscriptions from './pages/Subscriptions';


// Protected route wrapper — redirects to /login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Admin & Staff only route wrapper — merchants & sellers are redirected to their respective platforms
function AdminOnlyRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
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
        <Route path="/dashboard" element={<AdminOnlyRoute><Dashboard /></AdminOnlyRoute>} />
        <Route path="/admin" element={<AdminOnlyRoute><Dashboard /></AdminOnlyRoute>} />
        <Route path="/categories" element={<AdminOnlyRoute><Categories /></AdminOnlyRoute>} />
        <Route path="/merchants" element={<AdminOnlyRoute><Merchants /></AdminOnlyRoute>} />
        <Route path="/merchants/:id" element={<AdminOnlyRoute><MerchantDetail /></AdminOnlyRoute>} />
        <Route path="/merchant" element={<MerchantPortal />} />
        <Route path="/merchant/dashboard" element={<MerchantPortal />} />
        <Route path="/merchant-portal" element={<MerchantPortal />} />
        <Route path="/geography" element={<AdminOnlyRoute><Geography /></AdminOnlyRoute>} />
        <Route path="/reports" element={<AdminOnlyRoute><Reports /></AdminOnlyRoute>} />
        <Route path="/products" element={<Products />} />
        <Route path="/seller" element={<Products />} />
        <Route path="/seller-hub" element={<Products />} />


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
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
