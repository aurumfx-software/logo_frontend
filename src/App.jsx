import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/Layout/AdminLayout';
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

// Public route wrapper — redirects to / if already authenticated
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login — public only (redirects to dashboard if already logged in) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Admin routes — protected (redirects to login if not authenticated) */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
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

      {/* Catch-all — redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
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
