/**
 * Role-Based Access Control (RBAC) & Dynamic Staff Permissions Utilities
 * Enforces two roles: ADMIN and STAFF.
 * Allows ADMIN to dynamically configure module access permissions for STAFF.
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
};

// Default modules access configuration for Staff role
export const DEFAULT_STAFF_PERMISSIONS = {
  dashboard: true,
  merchants: true,
  categories: true,
  geography: true,
  reports: true,
  registrations: false,
  users: false,
  promotions: false,
  complaints: false,
  content: false,
};

export const MODULE_NAMES = [
  { key: 'dashboard', label: 'Dashboard Overview', path: '/dashboard', description: 'View dashboard analytics & summary cards' },
  { key: 'merchants', label: 'Merchants List & Management', path: '/merchants', description: 'View & manage registered merchants' },
  { key: 'categories', label: 'Category Directory', path: '/categories', description: 'Browse and manage business categories' },
  { key: 'geography', label: 'Geography & Zones', path: '/geography', description: 'View assigned regions and locations' },
  { key: 'reports', label: 'Analytics & Reports', path: '/reports', description: 'Access operational reports and stats' },
  { key: 'registrations', label: 'Registration Approvals', path: '/registration-requests', description: 'Approve or reject new merchant signups' },
  { key: 'users', label: 'Staff & User Accounts', path: '/users', description: 'View user accounts & team member directory' },
  { key: 'promotions', label: 'Promotions & Banners', path: '/promotions', description: 'Manage platform promotions & ads' },
  { key: 'complaints', label: 'Complaints & Support', path: '/complaints', description: 'Handle customer complaints & tickets' },
  { key: 'content', label: 'Content Management', path: '/content', description: 'Edit platform pages, FAQs & notices' },
];

/**
 * Retrieve current dynamic Staff permissions from localStorage
 */
export function getStaffPermissions() {
  try {
    const stored = localStorage.getItem('logo_admin_staff_permissions');
    if (stored) {
      return { ...DEFAULT_STAFF_PERMISSIONS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading staff permissions from localStorage:', e);
  }
  return { ...DEFAULT_STAFF_PERMISSIONS };
}

/**
 * Save updated Staff permissions to localStorage and notify UI
 */
export function saveStaffPermissions(newPermissions) {
  try {
    localStorage.setItem('logo_admin_staff_permissions', JSON.stringify(newPermissions));
    window.dispatchEvent(new Event('staff-permissions-updated'));
  } catch (e) {
    console.error('Error saving staff permissions:', e);
  }
}

/**
 * Normalizes user role string from backend or session to standard ROLES enum (ADMIN or STAFF)
 */
export function normalizeRole(user) {
  if (!user) return ROLES.STAFF;
  const raw = (user.role || user.user_role || user.type || '').toString().toUpperCase().trim();

  if (raw.includes('ADMIN') || raw === 'SUPER_ADMIN' || raw === 'SUPER ADMIN') {
    return ROLES.ADMIN;
  }
  return ROLES.STAFF;
}

/**
 * Get human-readable role display title
 */
export function getRoleDisplayTitle(user) {
  const normalized = normalizeRole(user);
  switch (normalized) {
    case ROLES.ADMIN:
      return 'Admin';
    case ROLES.STAFF:
    default:
      return 'Staff';
  }
}

/**
 * Check if user has access to a specific module path or key
 */
export function canAccessModule(user, moduleKey) {
  if (!user) return false;
  if (normalizeRole(user) === ROLES.ADMIN) return true;

  const perms = getStaffPermissions();
  return !!perms[moduleKey];
}

/**
 * Check if user role matches allowed roles or custom module permission
 */
export function hasAccess(user, allowedRoles = [], moduleKey = null) {
  if (!user) return false;
  const userRole = normalizeRole(user);
  if (userRole === ROLES.ADMIN) return true;

  if (moduleKey) {
    return canAccessModule(user, moduleKey);
  }

  return allowedRoles.includes(userRole);
}

/**
 * Permission check helpers for UI elements
 */
export function isAdmin(user) {
  return normalizeRole(user) === ROLES.ADMIN;
}

export function isAdminOrAbove(user) {
  return isAdmin(user);
}

export function isSuperAdmin(user) {
  return isAdmin(user);
}

export function isStaff(user) {
  return normalizeRole(user) === ROLES.STAFF;
}

export function isFieldStaff(user) {
  return isStaff(user);
}

export function canManageUsersPage(user) {
  return canAccessModule(user, 'users');
}

export function canCreateAdminAccount(user) {
  return isAdmin(user);
}

export function canCreateFieldStaffAccount(user) {
  return isAdmin(user);
}

export function canModifyCategories(user) {
  return canAccessModule(user, 'categories');
}

export function canDeleteMerchant(user) {
  return isAdmin(user);
}

export function canApproveRegistrations(user) {
  return canAccessModule(user, 'registrations');
}
