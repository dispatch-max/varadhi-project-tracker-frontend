import apiClient from "@/lib/api-client";

/**
 * Notifications API
 *
 * Unwraps `data.data` like the other api/*.api.js modules (tasksApi,
 * dashboardApi, ...). Notification rows come back from the backend as raw
 * SQL columns (snake_case: link_to, is_read, read_at, created_at) — list()
 * normalizes those to the camelCase shape the rest of the app + the
 * notification store expect.
 */

const BASE = "/notifications";

function normalizeNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    linkTo: row.link_to,
    priority: row.priority,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
    // Module 2 — inline actions. `actions` is a snapshot taken when the row was
    // written, so notifications created before the feature shipped come back
    // null and render exactly as they always did.
    actions: Array.isArray(row.actions) ? row.actions : null,
    actionTaken: row.action_taken ?? null,
    actionedAt: row.actioned_at ?? null,
    // Present on rows resolved by another reviewer — carries which action was
    // taken and by whom, so the row can say "Approved by Ada" rather than a
    // bare "Handled".
    actionResult: row.action_result ?? null,
  };
}

export const notificationsApi = {
  /** GET /api/notifications */
  async list(params = {}) {
    const { data } = await apiClient.get(BASE, { params });
    const { notifications, unreadCount, pagination } = data.data;
    return {
      notifications: (notifications || []).map(normalizeNotification),
      unreadCount,
      pagination,
    };
  },

  // No getUnreadCount() wrapper: list() already returns the authoritative
  // unreadCount alongside the rows, so the bell gets both in one request.
  // GET /notifications/unread-count still exists on the backend if a caller
  // ever needs the count on its own.

  /** PATCH /api/notifications/:id/read */
  async markAsRead(id) {
    const { data } = await apiClient.patch(`${BASE}/${id}/read`);
    return data.data;
  },

  /** PATCH /api/notifications/read-all */
  async markAllAsRead() {
    const { data } = await apiClient.patch(`${BASE}/read-all`);
    return data.data;
  },

  /** DELETE /api/notifications/:id */
  async remove(id) {
    const { data } = await apiClient.delete(`${BASE}/${id}`);
    return data.data;
  },

  /** GET /api/notifications/preferences */
  async getPreferences() {
    const { data } = await apiClient.get(`${BASE}/preferences`);
    return data.data;
  },

  /** PUT /api/notifications/preferences */
  async updatePreferences(payload) {
    const { data } = await apiClient.put(`${BASE}/preferences`, payload);
    return data.data;
  },

  /** GET /api/notifications/push/public-key */
  async getPushPublicKey() {
    const { data } = await apiClient.get(`${BASE}/push/public-key`);
    return data.data; // { publicKey, configured }
  },

  /** POST /api/notifications/push/subscribe */
  async subscribeToPush(subscription) {
    const { data } = await apiClient.post(`${BASE}/push/subscribe`, subscription);
    return data.data;
  },

  /** DELETE /api/notifications/push/subscribe */
  async unsubscribeFromPush(endpoint) {
    const { data } = await apiClient.delete(`${BASE}/push/subscribe`, {
      data: { endpoint },
    });
    return data.data;
  },
};

export default notificationsApi;