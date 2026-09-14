import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login — no layout */}
        <Route path="/login" element={<Login />} />

        {/* Admin routes — with sidebar + header layout */}
        <Route element={<AdminLayout />}>
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
      </Routes>
    </BrowserRouter>
  );
}
