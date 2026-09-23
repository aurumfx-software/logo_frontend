import { apiFetch, getAccessToken } from './apiClient';

/**
 * Helper to retrieve stored authentication token headers.
 */
export function getAuthHeaders(customHeaders = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    const rawToken = token.trim();
    const bearerToken = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
    headers['Authorization'] = bearerToken;
  }

  return headers;
}

/**
 * Register a new Admin or Field Staff account via backend API.
 * @param {Object} payload - { name, email, phone, role, password, city }
 */
export async function createAdminOrStaffAccount({ name, email, phone, role, password, city }) {
  // 1. Register the user
  const response = await apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      phone: phone ? phone.trim() : null,
      address: city ? city.trim() : null,
      role: role === 'Field Staff' ? 'FIELD_STAFF' : role === 'Admin' ? 'ADMIN' : 'ADMIN',
    }),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorMsg =
      data.message ||
      data.detail ||
      (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
      'Failed to create account';
    throw new Error(errorMsg);
  }

  const createdUser = data.user || data.data?.user || data.data || {};
  const userId = createdUser.id || createdUser._id;

  // 2. If backend supports role updating via admin endpoint
  if (userId) {
    try {
      const roleStr = role === 'Field Staff' ? 'FIELD_STAFF' : 'ADMIN';
      await apiFetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: roleStr }),
      });
    } catch (e) {
      console.warn('Role assignment endpoint notice:', e);
    }
  }

  return {
    id: userId ? (role === 'Field Staff' ? `STF-${userId}` : `ADM-${userId}`) : `ADM-${Date.now()}`,
    name: createdUser.name || name,
    email: createdUser.email || email,
    phone: createdUser.phone || phone || '+91 98765 43210',
    city: city || 'Payyanur',
    role: role,
    status: 'active',
    joined: new Date().toISOString().split('T')[0],
    searches: 0,
    lastActive: 'Just Now',
  };
}

/**
 * Fetch list of registered users from backend API (/api/v1/admin/users) with JWT token
 */
export async function fetchUsersList() {
  const response = await apiFetch('/api/v1/admin/users', {
    method: 'GET',
  });

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to fetch users list');
  }

  // Extract raw array from varying API JSON response formats
  let rawUsers = [];
  if (Array.isArray(resData)) {
    rawUsers = resData;
  } else if (Array.isArray(resData.data)) {
    rawUsers = resData.data;
  } else if (Array.isArray(resData.data?.items)) {
    rawUsers = resData.data.items;
  } else if (Array.isArray(resData.data?.users)) {
    rawUsers = resData.data.users;
  } else if (Array.isArray(resData.users)) {
    rawUsers = resData.users;
  } else if (Array.isArray(resData.items)) {
    rawUsers = resData.items;
  } else if (resData.data && typeof resData.data === 'object') {
    rawUsers = [resData.data];
  } else if (resData.user && typeof resData.user === 'object') {
    rawUsers = [resData.user];
  }

  return rawUsers.map((u, idx) => {
    const rawRole = (u.role || u.user_role || u.type || '').toString().toUpperCase();
    let displayRole = 'User';
    if (rawRole === 'SUPER_ADMIN' || rawRole === 'SUPERADMIN') {
      displayRole = 'Super Admin';
    } else if (rawRole === 'ADMIN') {
      displayRole = 'Admin';
    } else if (rawRole === 'FIELD_STAFF' || rawRole === 'FIELDSTAFF' || rawRole === 'STAFF') {
      displayRole = 'Field Staff';
    } else if (u.role) {
      displayRole = u.role;
    }

    const rawId = u.id || u._id || u.userId || u.user_id;
    let idStr = rawId ? String(rawId) : `USR-${idx + 1}`;
    if (rawId && !idStr.includes('-')) {
      if (displayRole === 'Super Admin' || displayRole === 'Admin') {
        idStr = `ADM-${idStr.padStart(3, '0')}`;
      } else if (displayRole === 'Field Staff') {
        idStr = `STF-${idStr.padStart(3, '0')}`;
      } else {
        idStr = `USR-${idStr.padStart(3, '0')}`;
      }
    }

    let status = 'active';
    if (u.is_suspended || u.status === 'suspended' || u.status === 'SUSPENDED' || u.is_active === false) {
      status = 'suspended';
    } else if (u.status === 'inactive' || u.status === 'INACTIVE') {
      status = 'inactive';
    }

    let name =
      u.name ||
      u.full_name ||
      (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : null) ||
      u.username ||
      u.email?.split('@')[0] ||
      'User Account';

    let joined = '2024-01-15';
    if (u.created_at || u.createdAt || u.joined) {
      const dStr = u.created_at || u.createdAt || u.joined;
      joined = dStr.includes('T') ? dStr.split('T')[0] : dStr;
    }

    return {
      id: idStr,
      rawId: rawId,
      name,
      email: u.email || 'N/A',
      phone: u.phone || u.phone_number || u.mobile || 'N/A',
      city: u.city || u.address || u.location || u.region || 'Payyanur',
      role: displayRole,
      status,
      joined,
      searches: u.searches || u.search_count || 0,
      lastActive: u.last_active || u.lastActive || 'Recent',
    };
  });
}

/**
 * Toggle user active/suspended status via backend API (/api/v1/admin/users/:id)
 */
export async function toggleUserStatus(userId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  const isSuspended = newStatus === 'suspended';

  try {
    const response = await apiFetch(`/api/v1/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ is_suspended: isSuspended, status: newStatus }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.detail || 'Failed to update user status');
    }
    return data;
  } catch (err) {
    console.warn('Backend status update notice:', err);
    return { success: true, localOnly: true };
  }
}



