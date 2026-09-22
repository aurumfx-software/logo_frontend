import { API_BASE_URL } from '../config/apiConfig';

/**
 * Register a new Admin or Field Staff account via backend API.
 * @param {Object} payload - { name, email, phone, role, password, city }
 */
export async function createAdminOrStaffAccount({ name, email, phone, role, password, city }) {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const token = localStorage.getItem('logo_admin_token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Register the user
  const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers,
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

  // 2. If backend supports role updating via admin endpoint, update role explicitly if needed
  if (userId && token) {
    try {
      const roleStr = role === 'Field Staff' ? 'FIELD_STAFF' : 'ADMIN';
      await fetch(`${baseUrl}/api/v1/admin/users/${userId}/role`, {
        method: 'PUT',
        headers,
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
