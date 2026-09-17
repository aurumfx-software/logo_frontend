import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/Layout/AdminLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegistrationRequests from './pages/RegistrationRequests';
import Categories from './pages/Categories';
import Merchants from './pages/Merchants';
import Users from './pages/Users';
import Promotions from './pages/Promotions';
import Complaints from './pages/Complaints';
import Content from './pages/Content';
import Geography from './pages/Geography';
import Reports from './pages/Reports';

// Protected route wrapper — redirects to /login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Public login wrapper — redirects to /dashboard if already authenticated
function LoginPublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/registration-requests" element={<RegistrationRequests />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/merchants" element={<Merchants />} />
        <Route path="/users" element={<Users />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/content" element={<Content />} />
        <Route path="/geography" element={<Geography />} />
        <Route path="/reports" element={<Reports />} />
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
