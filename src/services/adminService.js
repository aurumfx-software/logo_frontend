import { apiFetch } from '../api/apiClient';

/**
 * Admin & Staff Service — Module 3 & Module 4
 */
export const adminService = {
  /**
   * Create User (Field Staff / Admin with 17 Granular Fields): POST /api/v1/admin/users
   */
  async createUser(data) {
    const payload = {
      name: data.name ? data.name.trim() : '',
      email: data.email ? data.email.trim() : '',
      phone: data.phone ? data.phone.trim() : '',
      password: data.password ? data.password.trim() : 'Password123',
      role: data.role === 'Field Staff' || data.role === 'FIELD_STAFF' ? 'FIELD_STAFF' : 'ADMIN',
      is_staff: true,
      district: data.district || data.city || 'Kannur',
      city: data.city || 'Payyanur',
      regions: Array.isArray(data.regions) ? data.regions : [data.city || 'Payyanur'],
      module_access: Array.isArray(data.module_access)
        ? data.module_access
        : ['merchants', 'categories', 'reports'],
      send_email: data.send_email !== undefined ? Boolean(data.send_email) : true,
      status: data.status ? data.status.toUpperCase() : 'ACTIVE',
      address: data.address || `${data.city || 'Payyanur'}, ${data.district || 'Kannur'}`,
      profile_picture: data.profile_picture || data.image || '',
    };

    const response = await apiFetch('/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(
        resData.message ||
          resData.detail ||
          (resData.errors && Array.isArray(resData.errors) ? resData.errors.join(', ') : null) ||
          'Failed to create user'
      );
    }

    return resData.data || resData.user || resData;
  },

  /**
   * List Users: GET /api/v1/admin/users
   */
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.state) query.append('state', params.state);
    if (params.district) query.append('district', params.district);
    if (params.city) query.append('city', params.city);
    const searchVal = params.search || params.query || params.q;
    if (searchVal && String(searchVal).trim()) {
      const cleanQ = String(searchVal).trim();
      query.append('search', cleanQ);
      query.append('query', cleanQ);
      query.append('q', cleanQ);
    }
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit || 50));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await apiFetch(`/api/v1/admin/users${queryString}`, { method: 'GET' });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to fetch users list');
    }

    let rawUsers = [];
    if (Array.isArray(resData)) rawUsers = resData;
    else if (Array.isArray(resData.data)) rawUsers = resData.data;
    else if (Array.isArray(resData.users)) rawUsers = resData.users;
    else if (Array.isArray(resData.items)) rawUsers = resData.items;

    return rawUsers;
  },

  /**
   * Get Single User: GET /api/v1/admin/users/{user_id}
   */
  async getUserById(userId) {
    const response = await apiFetch(`/api/v1/admin/users/${userId}`, { method: 'GET' });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to fetch user profile');
    }

    return resData.data || resData.user || resData;
  },

  /**
   * Update User: PUT /api/v1/admin/users/{user_id}
   */
  async updateUser(userId, data) {
    const response = await apiFetch(`/api/v1/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to update user');
    }

    return resData.data || resData.user || resData;
  },

  /**
   * Delete User: DELETE /api/v1/admin/users/{user_id}
   */
  async deleteUser(userId) {
    const response = await apiFetch(`/api/v1/admin/users/${userId}`, { method: 'DELETE' });
    const resData = await response.json().catch(() => ({}));

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to delete user');
    }

    return true;
  },

  /**
   * Admin Dashboard Stats: GET /api/v1/admin/dashboard/stats
   */
  async getDashboardStats() {
    try {
      const response = await apiFetch('/api/v1/admin/dashboard/stats', { method: 'GET' });
      if (response.ok) {
        const resData = await response.json();
        return resData.data || resData.stats || resData;
      }
    } catch (err) {
      console.warn('Dashboard stats fallback:', err);
    }
    return null;
  },

  /**
   * Dashboard Charts & Trends: GET /api/v1/admin/dashboard/charts
   */
  async getDashboardCharts() {
    try {
      const response = await apiFetch('/api/v1/admin/dashboard/charts', { method: 'GET' });
      if (response.ok) {
        const resData = await response.json();
        return resData.data || resData;
      }
    } catch (err) {
      console.warn('Dashboard charts fallback:', err);
    }
    return null;
  },

  /**
   * Dashboard Recent Activity Feed: GET /api/v1/admin/dashboard/recent-activity
   */
  async getDashboardRecentActivity(limit = 10) {
    try {
      const response = await apiFetch(`/api/v1/admin/dashboard/recent-activity?limit=${limit}`, { method: 'GET' });
      if (response.ok) {
        const resData = await response.json();
        return resData.data || resData.recent_activity || [];
      }
    } catch (err) {
      console.warn('Recent activity fallback:', err);
    }
    return [];
  },

  /**
   * Merchant Registration Requests: GET /api/v1/admin/merchants/registration-requests
   */
  async getRegistrationRequests(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    if (filters.city) params.set('city', filters.city);
    if (filters.district) params.set('district', filters.district);
    if (filters.location) params.set('location', filters.location);
    if (filters.skip !== undefined) params.set('skip', filters.skip);
    if (filters.limit !== undefined) params.set('limit', filters.limit);

    const qs = params.toString() ? `?${params.toString()}` : '';
    try {
      const response = await apiFetch(`/api/v1/admin/merchants/registration-requests${qs}`, { method: 'GET' });
      if (response.ok) {
        const resData = await response.json();
        return resData.items || resData.data || resData;
      }
    } catch (err) {
      console.warn('Registration requests fallback:', err);
    }
    return [];
  },

  /**
   * Get Single Registration Request: GET /api/v1/admin/merchants/registration-requests/:id
   */
  async getRegistrationRequestById(id) {
    const cleanId = String(id).replace(/^MCH-/, '');
    const response = await apiFetch(`/api/v1/admin/merchants/registration-requests/${cleanId}`, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Failed to load registration request #${id}`);
    }
    const resData = await response.json();
    return resData.data || resData;
  },

  /**
   * Approve Registration: POST /api/v1/merchants/:id/approve
   */
  async approveRegistration(id) {
    const cleanId = String(id).replace(/^MCH-/, '');
    const response = await apiFetch(`/api/v1/merchants/${cleanId}/approve`, { method: 'POST' });
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(resData.message || resData.detail || 'Failed to approve merchant');
    }
    return resData.data || resData;
  },

  /**
   * Reject Registration: POST /api/v1/merchants/:id/reject
   */
  async rejectRegistration(id, rejectionReason = '') {
    const cleanId = String(id).replace(/^MCH-/, '');
    const response = await apiFetch(`/api/v1/merchants/${cleanId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
    const resData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(resData.message || resData.detail || 'Failed to reject merchant');
    }
    return resData.data || resData;
  },

  /**
   * Merchant Analytics: GET /api/v1/merchants/stats
   */
  async getMerchantStats() {
    try {
      const response = await apiFetch('/api/v1/merchants/stats', { method: 'GET' });
      if (response.ok) {
        const resData = await response.json();
        return resData.data || resData.stats || resData;
      }
    } catch (err) {
      console.warn('Merchant stats fallback:', err);
    }
    return null;
  },
};

export default adminService;

