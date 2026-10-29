import { apiFetch } from './apiClient';

/**
 * Fetch all notifications for the authenticated user (or admin)
 */
export async function fetchNotifications(limit = 30) {
  try {
    let response = await apiFetch(`/api/v1/admin/notifications?limit=${limit}`, { method: 'GET' });
    if (!response || !response.ok) {
      response = await apiFetch(`/api/v1/notifications?limit=${limit}`, { method: 'GET' });
    }
    if (response && response.ok) {
      const data = await response.json();
      return {
        unread_count: data.unread_count ?? (Array.isArray(data.data) ? data.data.filter((n) => !n.is_read).length : 0),
        notifications: data.notifications || data.data || data.items || [],
      };
    }
  } catch (err) {
    console.warn('Failed to fetch notifications:', err);
  }
  return { unread_count: 0, notifications: [] };
}

/**
 * Fetch unread notification count
 */
export async function fetchUnreadCount() {
  try {
    let response = await apiFetch('/api/v1/notifications/unread-count', { method: 'GET' });
    if (response && response.ok) {
      const data = await response.json();
      return data.data?.unread_count ?? data.unread_count ?? 0;
    }
  } catch (err) {
    // fallback to full list
    const res = await fetchNotifications(10);
    return res.unread_count || 0;
  }
  return 0;
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    let response = await apiFetch(`/api/v1/admin/notifications/${notificationId}/read`, { method: 'PATCH' });
    if (!response || !response.ok) {
      response = await apiFetch(`/api/v1/notifications/${notificationId}/read`, { method: 'PATCH' });
    }
    return response && response.ok;
  } catch (err) {
    console.warn('Failed to mark notification read:', err);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    let response = await apiFetch('/api/v1/admin/notifications/mark-all-read', { method: 'POST' });
    if (!response || !response.ok) {
      response = await apiFetch('/api/v1/notifications/mark-all-read', { method: 'POST' });
    }
    return response && response.ok;
  } catch (err) {
    console.warn('Failed to mark all notifications read:', err);
    return false;
  }
}
