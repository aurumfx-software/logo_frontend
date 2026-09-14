import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/': 'Dashboard',
  '/registration-requests': 'Registration Requests',
  '/categories': 'Categories',
  '/merchants': 'Merchants',
  '/users': 'Users',
  '/promotions': 'Promotions',
  '/complaints': 'Complaints',
  '/content': 'Content Management',
  '/geography': 'Geography',
  '/reports': 'Reports',
};

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="admin-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`admin-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          title={title}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
