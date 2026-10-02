import { apiFetch } from './apiClient';
import { STATIC_BASE_URL } from '../config/apiConfig';

/**
 * Format relative category photo/icon URLs into absolute static URLs
 */
export function formatMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${STATIC_BASE_URL.replace(/\/static$/, '')}${cleanPath}`;
}

/**
 * Fetch list of categories from backend API (/api/v1/categories)
 */
export async function fetchCategoriesList() {
  let response;
  try {
    response = await apiFetch('/api/v1/categories', {
      method: 'GET',
    });
  } catch (err) {
    console.warn('Backend categories fetch error:', err);
    throw err;
  }

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to fetch categories');
  }

  let rawItems = [];
  if (Array.isArray(resData)) {
    rawItems = resData;
  } else if (Array.isArray(resData.data)) {
    rawItems = resData.data;
  } else if (Array.isArray(resData.categories)) {
    rawItems = resData.categories;
  } else if (Array.isArray(resData.items)) {
    rawItems = resData.items;
  } else if (Array.isArray(resData.data?.categories)) {
    rawItems = resData.data.categories;
  } else if (Array.isArray(resData.data?.items)) {
    rawItems = resData.data.items;
  } else if (resData.data && typeof resData.data === 'object') {
    rawItems = [resData.data];
  }

  return rawItems.map((cat, idx) => {
    const rawIcon = cat.icon_url || cat.icon || cat.image || cat.photo || '';
    const formattedIconUrl = formatMediaUrl(rawIcon);

    return {
      id: cat.id || `cat-${idx + 1}`,
      name: cat.name || cat.category_name || 'Category',
      category_name: cat.category_name || cat.name || 'Category',
      slug: cat.slug || (cat.name ? cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
      description: cat.description || '',
      icon: rawIcon,
      icon_url: formattedIconUrl,
      is_active: cat.is_active !== undefined ? cat.is_active : cat.status === 'Active',
      status: cat.status || (cat.is_active ? 'Active' : 'Inactive'),
      logo_count: cat.logo_count || 0,
      subcategories: cat.subcategories || [],
      count: cat.logo_count || cat.count || 0,
    };
  });
}

/**
 * Upload Category Icon Image file to backend (/api/v1/categories/upload-icon)
 */
export async function uploadCategoryIcon(file) {
  let resData;
  let response;

  // Try field name 'file'
  try {
    const formData = new FormData();
    formData.append('file', file);
    response = await apiFetch('/api/v1/categories/upload-icon', {
      method: 'POST',
      body: formData,
    });
    resData = await response.json().catch(() => ({}));
  } catch (err) {
    console.warn('Upload icon notice with file field:', err);
  }

  // Fallback 1: try field name 'icon'
  if (!response || !response.ok || resData?.success === false) {
    try {
      const formData = new FormData();
      formData.append('icon', file);
      response = await apiFetch('/api/v1/categories/upload-icon', {
        method: 'POST',
        body: formData,
      });
      resData = await response.json().catch(() => ({}));
    } catch {}
  }

  // Fallback 2: try merchant upload-media endpoint if category upload fails
  if (!response || !response.ok || resData?.success === false) {
    try {
      const formData = new FormData();
      formData.append('photos', file);
      response = await apiFetch('/api/v1/merchants/upload-media', {
        method: 'POST',
        body: formData,
      });
      resData = await response.json().catch(() => ({}));
    } catch {}
  }

  if (!response || !response.ok) {
    throw new Error(resData?.message || resData?.detail || 'Failed to upload category icon file');
  }

  const iconUrl =
    resData.icon_url ||
    resData.url ||
    resData.photos?.[0] ||
    resData.data?.icon_url ||
    resData.data?.url ||
    resData.data?.photos?.[0] ||
    resData.file_url ||
    '';

  return formatMediaUrl(iconUrl);
}

/**
 * Add a new category via backend API (POST /api/v1/categories)
 */
export async function createCategory(categoryData) {
  const name = (categoryData.name || categoryData.category_name || '').trim();
  const slug = categoryData.slug
    ? categoryData.slug.trim()
    : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const statusStr = categoryData.status || (categoryData.is_active === false ? 'Inactive' : 'Active');
  const isActiveBool = categoryData.is_active !== undefined ? Boolean(categoryData.is_active) : statusStr === 'Active';
  const rawIcon = (categoryData.icon_url || categoryData.icon || '').trim();

  const payload = {
    name: name,
    category_name: name,
    slug: slug,
    description: (categoryData.description || '').trim(),
    icon: rawIcon,
    icon_url: rawIcon,
    is_active: isActiveBool,
    status: statusStr,
  };

  const response = await apiFetch('/api/v1/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(
      resData.message ||
        resData.detail ||
        (resData.errors && Array.isArray(resData.errors) ? resData.errors.join(', ') : null) ||
        'Failed to create category'
    );
  }

  const created = resData.data || resData.category || resData;

  return {
    id: created.id || `cat-${Date.now()}`,
    name: created.name || created.category_name || payload.name,
    category_name: created.category_name || created.name || payload.category_name,
    slug: created.slug || payload.slug,
    description: created.description || payload.description,
    icon: created.icon || payload.icon,
    icon_url: formatMediaUrl(created.icon_url || created.icon || payload.icon_url),
    is_active: created.is_active !== undefined ? created.is_active : payload.is_active,
    status: created.status || payload.status,
    logo_count: created.logo_count || 0,
    count: created.logo_count || 0,
    subcategories: created.subcategories || [],
  };
}

/**
 * Update an existing category via backend API (PATCH or PUT /api/v1/categories/{category_id})
 */
export async function updateCategory(categoryId, categoryData) {
  const name = (categoryData.name || categoryData.category_name || '').trim();
  const slug = categoryData.slug
    ? categoryData.slug.trim()
    : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const statusStr = categoryData.status || (categoryData.is_active === false ? 'Inactive' : 'Active');
  const isActiveBool = categoryData.is_active !== undefined ? Boolean(categoryData.is_active) : statusStr === 'Active';
  const rawIcon = (categoryData.icon_url || categoryData.icon || '').trim();

  const payload = {
    name: name,
    category_name: name,
    slug: slug,
    description: (categoryData.description || '').trim(),
    icon: rawIcon,
    icon_url: rawIcon,
    is_active: isActiveBool,
    status: statusStr,
  };

  let response = await apiFetch(`/api/v1/categories/${categoryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 405) {
    response = await apiFetch(`/api/v1/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(
      resData.message ||
        resData.detail ||
        (resData.errors && Array.isArray(resData.errors) ? resData.errors.join(', ') : null) ||
        'Failed to update category'
    );
  }

  const updated = resData.data || resData.category || resData;

  return {
    id: updated.id || categoryId,
    name: updated.name || updated.category_name || payload.name,
    category_name: updated.category_name || updated.name || payload.category_name,
    slug: updated.slug || payload.slug,
    description: updated.description || payload.description,
    icon: updated.icon || payload.icon,
    icon_url: formatMediaUrl(updated.icon_url || updated.icon || payload.icon_url),
    is_active: updated.is_active !== undefined ? updated.is_active : payload.is_active,
    status: updated.status || payload.status,
    logo_count: updated.logo_count || 0,
    count: updated.logo_count || 0,
    subcategories: updated.subcategories || [],
  };
}

/**
 * Delete a category via backend API (DELETE /api/v1/categories/{category_id})
 */
export async function deleteCategory(categoryId) {
  const response = await apiFetch(`/api/v1/categories/${categoryId}`, {
    method: 'DELETE',
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to delete category');
  }

  return true;
}

