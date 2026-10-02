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
export async function createAdminOrStaffAccount({ name, email, phone, role, password, city, district, regions, module_access, address }) {
  // Enforce ONLY STAFF can be created
  const roleCode = 'FIELD_STAFF';

  const payload = {
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : '9847055667',
    password: password ? password.trim() : 'Password123',
    role: roleCode,
    is_staff: true,
    district: district || city || 'Kannur',
    city: city || 'Payyanur',
    regions: Array.isArray(regions) ? regions : [city || 'Payyanur North'],
    module_access: Array.isArray(module_access) ? module_access : ['merchants', 'categories'],
    send_email: true,
    status: 'ACTIVE',
    address: address || city || 'Payyanur, Kannur',
    profile_picture: '',
  };

  let response = await apiFetch('/api/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status === 404) {
    response = await apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        address: payload.address,
        role: payload.role,
      }),
    });
  }

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorMsg =
      data.message ||
      data.detail ||
      (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
      'Failed to create account';
    throw new Error(errorMsg);
  }

  const createdUser = data.user || data.data?.user || data.data || data || {};
  const userId = createdUser.id || createdUser._id;

  return {
    id: userId ? (isStaff ? `STF-${userId}` : `ADM-${userId}`) : `ADM-${Date.now()}`,
    name: createdUser.name || name,
    email: createdUser.email || email,
    phone: createdUser.phone || phone || '+91 98470 55667',
    city: city || 'Payyanur',
    role: isStaff ? 'Field Staff' : 'Admin',
    status: 'active',
    joined: new Date().toISOString().split('T')[0],
    searches: 0,
    lastActive: 'Just Now',
  };
}

/**
 * Fetch list of registered users from backend API (/api/v1/admin/users) with JWT token
 */
export async function fetchUsersList(filters = {}) {
  const searchVal = typeof filters === 'string' ? filters : (filters.search || filters.query || filters.q || filters.searchQuery || '');
  const role = filters.role;
  const status = filters.status;
  const state = filters.state;
  const district = filters.district;
  const city = filters.city;

  const params = new URLSearchParams();
  if (role && role !== 'all') params.set('role', role);
  if (status && status !== 'all') params.set('status', status);
  if (state && state !== 'all') params.set('state', state);
  if (district && district !== 'all') params.set('district', district);
  if (city && city !== 'all') params.set('city', city);

  if (searchVal && String(searchVal).trim()) {
    const q = String(searchVal).trim();
    params.set('search', q);
    params.set('query', q);
    params.set('q', q);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';

  const response = await apiFetch(`/api/v1/admin/users${queryString}`, {
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
    const rawRole = (u.role || u.user_role || u.type || '').toString().toUpperCase().trim();
    const uName = (u.name || u.full_name || '').toLowerCase().trim();
    const uEmail = (u.email || '').toLowerCase().trim();

    let displayRole = 'User';
    if (
      rawRole === 'SUPER_ADMIN' ||
      rawRole === 'SUPERADMIN' ||
      rawRole === 'SUPER ADMIN' ||
      uName === 'super admin' ||
      uEmail === 'aurumfxsoftware@gmail.com'
    ) {
      displayRole = 'Super Admin';
    } else if (rawRole === 'ADMIN') {
      displayRole = 'Admin';
    } else if (rawRole === 'FIELD_STAFF' || rawRole === 'FIELDSTAFF' || rawRole === 'STAFF') {
      displayRole = 'Field Staff';
    } else if (rawRole === 'MERCHANT') {
      displayRole = 'Merchant';
    } else if (rawRole === 'USER') {
      displayRole = 'User';
    } else if (u.role) {
      displayRole = u.role.charAt(0).toUpperCase() + u.role.slice(1);
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
      city:
        u.city ||
        (u.address && u.address.toLowerCase() !== 'user' ? u.address : null) ||
        u.district ||
        u.location ||
        u.region ||
        'Payyanur',
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

/**
 * Delete staff account via backend API (/api/v1/admin/users/:id)
 */
export async function deleteAdminOrStaffAccount(userId) {
  const cleanId = String(userId).replace(/^(ADM|STF|USR)-/, '');
  try {
    const response = await apiFetch(`/api/v1/admin/users/${cleanId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.detail || 'Failed to delete user');
    }
    return true;
  } catch (err) {
    console.warn('Backend user deletion notice:', err);
    return true;
  }
}

/**
 * Update user account details via backend API (/api/v1/admin/users/:id)
 */
export async function updateAdminOrStaffAccount(userId, updatedData) {
  const cleanId = String(userId).replace(/^(ADM|STF|USR)-/, '');
  const payload = {
    name: updatedData.name ? updatedData.name.trim() : undefined,
    email: updatedData.email ? updatedData.email.trim() : undefined,
    phone: updatedData.phone ? updatedData.phone.trim() : undefined,
    city: updatedData.city || updatedData.district || undefined,
    district: updatedData.district || undefined,
    regions: updatedData.regions || undefined,
    role: updatedData.role ? (updatedData.role.toLowerCase().includes('staff') ? 'FIELD_STAFF' : 'ADMIN') : undefined,
    status: updatedData.status || undefined,
  };

  const response = await apiFetch(`/api/v1/admin/users/${cleanId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    let errorMsg = '';
    if (typeof data.detail === 'string') {
      errorMsg = data.detail;
    } else if (Array.isArray(data.detail)) {
      errorMsg = data.detail
        .map((item) => (typeof item === 'object' ? item.msg || item.message : String(item)))
        .join(', ');
    } else if (data.message) {
      errorMsg = data.message;
    }

    if (!errorMsg) {
      errorMsg = `Failed to update user account (Status ${response.status})`;
    }
    throw new Error(errorMsg);
  }

  return data;
}





