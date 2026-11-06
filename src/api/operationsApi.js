import { apiFetch } from './apiClient';
import { API_BASE_URL } from '../config/apiConfig';

const BASE_URL = API_BASE_URL.replace(/\/$/, '');

// ========================
// PROMOTIONS API
// ========================
export const promotionsApi = {
  async uploadMedia(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('video', file);
    formData.append('image', file);

    const res = await apiFetch('/api/v1/promotions/upload-media', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res || !res.ok || json.success === false) {
      throw new Error(json.message || json.detail || 'Failed to upload media to CDN');
    }
    return json.data || json;
  },

  async fetchActiveHeroBanners(placement = 'Home Top') {
    let res = await apiFetch(`/api/v1/promotions/active?placement=${encodeURIComponent(placement)}`);
    if (!res || !res.ok) res = await apiFetch('/api/v1/promotions/hero-banners');
    if (!res || !res.ok) res = await apiFetch('/api/v1/promotions');
    if (!res || !res.ok) return [];
    const json = await res.json().catch(() => ({}));
    const items = json.data || json.promotions || json.items || (Array.isArray(json) ? json : []);
    return Array.isArray(items) ? items : [];
  },

  async list({ status = '', search = '' } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    let res = await apiFetch(`/api/v1/promotions${query}`);
    if (!res || !res.ok) res = await apiFetch(`/promotions${query}`);
    if (!res || !res.ok) res = await apiFetch(`/admin/promotions${query}`);
    if (!res || !res.ok) return [];
    const json = await res.json().catch(() => ({}));
    const items = json.data || json.promotions || json.items || (Array.isArray(json) ? json : []);
    return Array.isArray(items) ? items : [];
  },

  async create(data) {
    const payload = {
      ...data,
      image_url: data.image_url || data.bannerUrl || data.banner_url || data.image || null,
      target_url: data.target_url || data.targetUrl || '#',
    };
    let res = await apiFetch('/api/v1/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res || !res.ok) {
      res = await apiFetch('/promotions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    if (!res || !res.ok) {
      res = await apiFetch('/admin/promotions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    if (!res || !res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || errJson.detail || 'Failed to create promotion');
    }
    const json = await res.json().catch(() => ({}));
    return json.data || json.promotion || json;
  },

  async update(id, data) {
    const payload = {
      ...data,
      image_url: data.image_url !== undefined ? data.image_url : (data.bannerUrl || data.banner_url || data.image || null),
      target_url: data.target_url !== undefined ? data.target_url : (data.targetUrl || '#'),
    };
    let res = await apiFetch(`/api/v1/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res || !res.ok) {
      res = await apiFetch(`/promotions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    if (!res || !res.ok) {
      res = await apiFetch(`/admin/promotions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    if (!res || !res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || errJson.detail || 'Failed to update promotion');
    }
    const json = await res.json().catch(() => ({}));
    return json.data || json.promotion || json;
  },

  async delete(id) {
    let res = await apiFetch(`/api/v1/promotions/${id}`, {
      method: 'DELETE',
    });
    if (!res || !res.ok) {
      res = await apiFetch(`/promotions/${id}`, {
        method: 'DELETE',
      });
    }
    if (!res || !res.ok) {
      res = await apiFetch(`/admin/promotions/${id}`, {
        method: 'DELETE',
      });
    }
    if (!res || !res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || errJson.detail || 'Failed to delete promotion');
    }
    return true;
  },
};

// ========================
// COMPLAINTS API
// ========================
import { complaintsApi } from './complaintsApi';
export { complaintsApi };

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

  async getPolicy(key) {
    let res = await apiFetch(`/api/v1/content/policies/${key}`);
    if (!res || !res.ok) {
      res = await apiFetch(`/api/v1/content/public/policies/${key}`);
    }
    if (!res.ok) throw new Error('Failed to fetch policy');
    const json = await res.json();
    return json.data;
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
// GEOGRAPHY API (Admin / Geography)
// ========================
export const geographyApi = {
  /**
   * GET /api/v1/admin/geography
   * Optional filters: district, search, page, page_size
   */
  async getAdminGeography({ district = '', search = '', page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    if (district && district !== 'All Districts') {
      params.append('district', district);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    const res = await apiFetch(`/api/v1/admin/geography?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Failed to fetch geography data');
    }
    return await res.json();
  },

  /**
   * POST /api/v1/admin/geography/towns
   * { district, town, zones: [...] }
   * 409 if duplicate
   */
  async addTown({ district, town, zones = [] }) {
    const res = await apiFetch('/api/v1/admin/geography/towns', {
      method: 'POST',
      body: JSON.stringify({
        district: district.trim(),
        town: town.trim(),
        zones: Array.isArray(zones) ? zones : typeof zones === 'string' ? zones.split(',').map(z => z.trim()).filter(Boolean) : [],
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 409) {
        throw new Error(`Town '${town}' already exists in ${district} district.`);
      }
      throw new Error(json.detail || json.message || 'Failed to add town');
    }
    return json;
  },

  // Backward compatibility methods
  async list(opts = {}) {
    try {
      const data = await this.getAdminGeography({
        district: opts.district || '',
        search: opts.search || '',
        page: 1,
        pageSize: 100,
      });
      return data.towns || [];
    } catch {
      return [];
    }
  },

  async getSummary() {
    try {
      const data = await this.getAdminGeography();
      return data.cards || { kerala_districts_covered: 14, kerala_districts_total: 14, real_merchants: 0 };
    } catch {
      return { kerala_districts_covered: 14, kerala_districts_total: 14, real_merchants: 0 };
    }
  },

  async create(data) {
    return await this.addTown({
      district: data.district || data.state?.replace(' District, Kerala', '') || 'Kannur',
      town: data.city || data.town,
      zones: Array.isArray(data.zones) ? data.zones : [],
    });
  },
};

// ========================
// REPORTS API (Admin / Reports)
// ========================
export const reportsApi = {
  /**
   * GET /api/v1/admin/reports?year=2026
   * Optional: date_from, date_to, all_years=true, sector
   */
  async getAdminReports({ year = 2026, dateFrom = '', dateTo = '', allYears = false, sector = '' } = {}) {
    const params = new URLSearchParams();
    if (allYears || year === 'all' || year === 0) {
      params.append('all_years', 'true');
    } else if (year) {
      params.append('year', String(year));
    }
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (sector && sector.trim()) params.append('sector', sector.trim());

    const res = await apiFetch(`/api/v1/admin/reports?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Failed to fetch admin reports');
    }
    return await res.json();
  },

  async getMerchantGrowthReport(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await apiFetch(`/api/v1/admin/reports/merchants${q ? `?${q}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch merchant growth report');
    return await res.json();
  },

  async getEngagementReport(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await apiFetch(`/api/v1/admin/reports/engagement${q ? `?${q}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch engagement report');
    return await res.json();
  },

  async getLeadsReport(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await apiFetch(`/api/v1/admin/reports/leads${q ? `?${q}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch leads report');
    return await res.json();
  },

  getExportCsvUrl({ year = 2026, allYears = false, dateFrom = '', dateTo = '', sector = '' } = {}) {
    const params = new URLSearchParams();
    if (allYears || year === 'all' || year === 0) {
      params.append('all_years', 'true');
    } else if (year) {
      params.append('year', String(year));
    }
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (sector) params.append('sector', sector);

    return `${BASE_URL}/api/v1/admin/reports/export?${params.toString()}`;
  },

  async downloadExportCsv({ year = 2026, allYears = false, dateFrom = '', dateTo = '', sector = '' } = {}) {
    const params = new URLSearchParams();
    if (allYears || year === 'all' || year === 0) {
      params.append('all_years', 'true');
    } else if (year) {
      params.append('year', String(year));
    }
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (sector) params.append('sector', sector);

    const res = await apiFetch(`/api/v1/admin/reports/export?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to export CSV report');
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `logo-reports-${allYears || year === 'all' ? 'all-years' : year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Backward compatibility method
  async getOverview(opts = {}) {
    return await this.getAdminReports({
      year: opts.year,
      dateFrom: opts.fromDate,
      dateTo: opts.toDate,
      allYears: opts.year === 'all' || opts.year === 0,
    });
  },
};
