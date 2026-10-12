import { apiFetch } from './apiClient';

/**
 * Complaints API Module
 * Direct Backend Endpoints: http://168.144.18.149:8000/api/v1/complaints
 */
export const complaintsApi = {
  /**
   * 1. GET /api/v1/complaints
   * Query params: status, category, priority, search
   */
  async list(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    let res = await apiFetch(`/api/v1/complaints${queryString}`, { method: 'GET' }).catch(() => null);
    if (!res || !res.ok) {
      res = await apiFetch(`/complaints${queryString}`, { method: 'GET' }).catch(() => null);
    }
    if (!res || !res.ok) return [];

    const json = await res.json().catch(() => ({}));
    const items = json.data || json.complaints || json.items || (Array.isArray(json) ? json : []);
    return Array.isArray(items) ? items : [];
  },

  /**
   * 2. GET /api/v1/complaints/counts
   * Returns summary badge counts: { all, open, 'in-progress', resolved }
   */
  async getCounts() {
    let res = await apiFetch('/api/v1/complaints/counts', { method: 'GET' }).catch(() => null);
    if (!res || !res.ok) {
      res = await apiFetch('/complaints/counts', { method: 'GET' }).catch(() => null);
    }
    if (!res || !res.ok) return { all: 0, open: 0, 'in-progress': 0, resolved: 0 };

    const json = await res.json().catch(() => ({}));
    return json.data || json.counts || { all: 0, open: 0, 'in-progress': 0, resolved: 0 };
  },

  /**
   * 3. POST /api/v1/complaints
   * Create a new complaint
   */
  async create(data) {
    let res = await apiFetch('/api/v1/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await apiFetch('/complaints', {
        method: 'POST',
        body: JSON.stringify(data),
      }).catch(() => null);
    }

    if (!res || !res.ok) {
      const errJson = await res?.json().catch(() => ({}));
      throw new Error((errJson && (errJson.message || errJson.detail)) || 'Failed to create complaint');
    }

    const json = await res.json().catch(() => ({}));
    return json.data || json.complaint || json;
  },

  /**
   * 4. GET /api/v1/complaints/{id}
   * View single complaint details
   */
  async getById(id) {
    let res = await apiFetch(`/api/v1/complaints/${id}`, { method: 'GET' }).catch(() => null);
    if (!res || !res.ok) {
      res = await apiFetch(`/complaints/${id}`, { method: 'GET' }).catch(() => null);
    }
    if (!res || !res.ok) {
      const errJson = await res?.json().catch(() => ({}));
      throw new Error((errJson && (errJson.message || errJson.detail)) || 'Failed to fetch complaint details');
    }

    const json = await res.json().catch(() => ({}));
    return json.data || json.complaint || json;
  },

  /**
   * 5. PUT /api/v1/complaints/{id}
   * Edit / Update complaint details
   */
  async update(id, data) {
    let res = await apiFetch(`/api/v1/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await apiFetch(`/complaints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }).catch(() => null);
    }

    if (!res || !res.ok) {
      const errJson = await res?.json().catch(() => ({}));
      throw new Error((errJson && (errJson.message || errJson.detail)) || 'Failed to update complaint');
    }

    const json = await res.json().catch(() => ({}));
    return json.data || json.complaint || json;
  },

  /**
   * 6. PATCH /api/v1/complaints/{id}/resolve
   * Fix / Resolve complaint with admin note
   */
  async resolve(id, admin_response = '') {
    let res = await apiFetch(`/api/v1/complaints/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({
        admin_response,
        status: 'resolved',
      }),
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await apiFetch(`/complaints/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({
          admin_response,
          status: 'resolved',
        }),
      }).catch(() => null);
    }

    if (!res || !res.ok) {
      const errJson = await res?.json().catch(() => ({}));
      throw new Error((errJson && (errJson.message || errJson.detail)) || 'Failed to resolve complaint');
    }

    const json = await res.json().catch(() => ({}));
    return json.data || json.complaint || json;
  },

  /**
   * 7. PATCH /api/v1/complaints/{id}/status
   * Update status directly (open / in-progress / resolved)
   */
  async updateStatus(id, status, admin_response = '') {
    let res = await apiFetch(`/api/v1/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        admin_response,
      }),
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await apiFetch(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          admin_response,
        }),
      }).catch(() => null);
    }

    if (!res || !res.ok) {
      const errJson = await res?.json().catch(() => ({}));
      throw new Error((errJson && (errJson.message || errJson.detail)) || 'Failed to update complaint status');
    }

    const json = await res.json().catch(() => ({}));
    return json.data || json.complaint || json;
  },

  /**
   * 8. DELETE /api/v1/complaints/{id}
   * Delete complaint permanently
   */
  async delete(id) {
    let res = await apiFetch(`/api/v1/complaints/${id}`, {
      method: 'DELETE',
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await apiFetch(`/complaints/${id}`, {
        method: 'DELETE',
      }).catch(() => null);
    }

    if (!res || !res.ok) {
      const errJson = await res?.json().catch(() => ({}));
      throw new Error((errJson && (errJson.message || errJson.detail)) || 'Failed to delete complaint');
    }

    const json = await res.json().catch(() => ({}));
    return json.success ?? true;
  },
};

export default complaintsApi;
