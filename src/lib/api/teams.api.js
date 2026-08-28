import apiClient from "@/lib/api-client";

/**
 * Microsoft Teams webhook API (Module 5).
 *
 * NOTE ON THE URL: no method here ever receives a webhook URL back from the
 * server. It is write-only by design — `create` and `update` send it, and
 * every read returns only `urlHint` (the masked origin + last four chars).
 * If you find yourself wanting the full URL in the client, that is the bug.
 */

const BASE = "/teams";

export const teamsApi = {
  /** GET /api/teams/event-types — the subscribable event catalogue */
  async getEventTypes() {
    const { data } = await apiClient.get(`${BASE}/event-types`);
    return data.data;
  },

  /** GET /api/teams/webhooks */
  async getWebhooks() {
    const { data } = await apiClient.get(`${BASE}/webhooks`);
    return data.data;
  },

  /** POST /api/teams/webhooks */
  async createWebhook(payload) {
    const { data } = await apiClient.post(`${BASE}/webhooks`, payload);
    return data.data;
  },

  /** PUT /api/teams/webhooks/:id */
  async updateWebhook(id, payload) {
    const { data } = await apiClient.put(`${BASE}/webhooks/${id}`, payload);
    return data.data;
  },

  /** DELETE /api/teams/webhooks/:id */
  async deleteWebhook(id) {
    const { data } = await apiClient.delete(`${BASE}/webhooks/${id}`);
    return data.data;
  },

  /** POST /api/teams/webhooks/:id/test — posts a live probe to the channel */
  async testWebhook(id) {
    const { data } = await apiClient.post(`${BASE}/webhooks/${id}/test`);
    return data.data;
  },

  /** GET /api/teams/webhooks/:id/health — delivery history + success rate */
  async getWebhookHealth(id) {
    const { data } = await apiClient.get(`${BASE}/webhooks/${id}/health`);
    return data.data;
  },
};

export const DIGEST_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "daily", label: "Daily summary" },
  { value: "weekly", label: "Weekly summary" },
];

export default teamsApi;
