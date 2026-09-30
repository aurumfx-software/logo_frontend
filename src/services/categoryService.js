import { apiFetch } from '../api/apiClient';

/**
 * Category Service — Module 4 (Categories)
 */
export const categoryService = {
  /**
   * Get Categories List: GET /api/v1/categories
   */
  async getCategories() {
    const response = await apiFetch('/api/v1/categories', { method: 'GET' });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to fetch categories');
    }

    let items = [];
    if (Array.isArray(resData)) items = resData;
    else if (Array.isArray(resData.data)) items = resData.data;
    else if (Array.isArray(resData.categories)) items = resData.categories;
    else if (Array.isArray(resData.items)) items = resData.items;

    return items;
  },

  /**
   * Create Category: POST /api/v1/categories
   */
  async createCategory(data) {
    const response = await apiFetch('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to create category');
    }

    return resData.data || resData.category || resData;
  },

  /**
   * Update Category: PUT /api/v1/categories/{id}
   */
  async updateCategory(categoryId, data) {
    const response = await apiFetch(`/api/v1/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to update category');
    }

    return resData.data || resData.category || resData;
  },

  /**
   * Delete Category: DELETE /api/v1/categories/{id}
   */
  async deleteCategory(categoryId) {
    const response = await apiFetch(`/api/v1/categories/${categoryId}`, { method: 'DELETE' });
    const resData = await response.json().catch(() => ({}));

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to delete category');
    }

    return true;
  },
};

export default categoryService;
