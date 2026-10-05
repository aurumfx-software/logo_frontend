import { apiFetch } from './apiClient';
import { API_BASE_URL } from '../config/apiConfig';

const BASE_URL = API_BASE_URL.replace(/\/$/, '');

// ========================
// PROMOTIONS API
// ========================
export const promotionsApi = {
  async list({ status = '', search = '' } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/api/v1/promotions${query}`);
    if (!res.ok) throw new Error('Failed to fetch promotions');
    const json = await res.json();
    return json.data || [];
  },

  async create(data) {
    const res = await apiFetch('/api/v1/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create promotion');
    const json = await res.json();
    return json.data;
  },

  async update(id, data) {
    const res = await apiFetch(`/api/v1/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update promotion');
    const json = await res.json();
    return json.data;
  },

  async delete(id) {
    const res = await apiFetch(`/api/v1/promotions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete promotion');
    return true;
  },
};

// ========================
// COMPLAINTS API
// ========================
export const complaintsApi = {
  async list({ status = '', search = '' } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/api/v1/complaints${query}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    const json = await res.json();
    return json.data || [];
  },

  async getCounts() {
    const res = await apiFetch('/api/v1/complaints/counts');
    if (!res.ok) return { all: 0, open: 0, 'in-progress': 0, resolved: 0 };
    const json = await res.json();
    return json.data || { all: 0, open: 0, 'in-progress': 0, resolved: 0 };
  },

  async resolve(id, admin_response = '') {
    const res = await apiFetch(`/api/v1/complaints/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ admin_response, status: 'resolved' }),
    });
    if (!res.ok) throw new Error('Failed to resolve complaint');
    const json = await res.json();
    return json.data;
  },

  async delete(id) {
    const res = await apiFetch(`/api/v1/complaints/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete complaint');
    return true;
  },
};

// ========================
// CONTENT API
// ========================
export const contentApi = {
  async getPolicies() {
    const res = await apiFetch('/api/v1/content/policies');
    if (!res.ok) throw new Error('Failed to fetch policies');
    const json = await res.json();
    return json.data || [];
  },

  async updatePolicy(key, content, label = null) {
    const res = await apiFetch(`/api/v1/content/policies/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ content, label }),
    });
    if (!res.ok) throw new Error('Failed to update policy');
    const json = await res.json();
    return json.data;
  },

  async getNotifications() {
    const res = await apiFetch('/api/v1/content/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const json = await res.json();
    return json.data || [];
  },

  async createNotification(data) {
    const res = await apiFetch('/api/v1/content/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create notification');
    const json = await res.json();
    return json.data;
  },

  async deleteNotification(id) {
    const res = await apiFetch(`/api/v1/content/notifications/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete notification');
    return true;
  },

  async getAnnouncements() {
    const res = await apiFetch('/api/v1/content/announcements');
    if (!res.ok) throw new Error('Failed to fetch announcements');
    const json = await res.json();
    return json.data || [];
  },

  async createAnnouncement(data) {
    const res = await apiFetch('/api/v1/content/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create announcement');
    const json = await res.json();
    return json.data;
  },

  async updateAnnouncement(id, data) {
    const res = await apiFetch(`/api/v1/content/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update announcement');
    const json = await res.json();
    return json.data;
  },

  async deleteAnnouncement(id) {
    const res = await apiFetch(`/api/v1/content/announcements/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete announcement');
    return true;
  },
};

// ========================
// GEOGRAPHY API
// ========================
export const geographyApi = {
  async list({ status = '', search = '' } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/api/v1/geography${query}`);
    if (!res.ok) throw new Error('Failed to fetch geography regions');
    const json = await res.json();
    return json.data || [];
  },

  async getSummary() {
    const res = await apiFetch('/api/v1/geography/summary');
    if (!res.ok) return { total_cities: 0, active_cities: 0, total_zones: 0 };
    const json = await res.json();
    return json.data || { total_cities: 0, active_cities: 0, total_zones: 0 };
  },

  async create(data) {
    const res = await apiFetch('/api/v1/geography', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add city/region');
    const json = await res.json();
    return json.data;
  },

  async update(id, data) {
    const res = await apiFetch(`/api/v1/geography/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update region');
    const json = await res.json();
    return json.data;
  },

  async delete(id) {
    const res = await apiFetch(`/api/v1/geography/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete region');
    return true;
  },
};

// ========================
// REPORTS API
// ========================
export const reportsApi = {
  async getOverview({ fromDate = '', toDate = '' } = {}) {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/api/v1/reports/overview${query}`);
    if (!res.ok) throw new Error('Failed to fetch reports overview');
    const json = await res.json();
    return json.data;
  },

  getExportCsvUrl(type = 'merchants') {
    return `${BASE_URL}/api/v1/reports/export/csv?type=${type}`;
  },
};
