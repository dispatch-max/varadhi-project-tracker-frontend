import apiClient from "@/lib/api-client";

/**
 * Calendar sync API (Module 4).
 *
 * Imported directly (`@/lib/api/calendar.api`) rather than through
 * `@/lib/api` — that barrel only re-exports the six original resources, and
 * every module added since (reports, notifications, folders) follows this
 * same direct-import convention.
 */

const BASE = "/calendar";

export const calendarApi = {
  /** GET /api/calendar/providers */
  async getProviders() {
    const { data } = await apiClient.get(`${BASE}/providers`);
    return data.data;
  },

  /** GET /api/calendar/connections */
  async getConnections() {
    const { data } = await apiClient.get(`${BASE}/connections`);
    return data.data;
  },

  /**
   * GET /api/calendar/:provider/auth-url
   * Returns the provider-hosted consent URL; the caller navigates to it.
   */
  async getAuthUrl(provider) {
    const { data } = await apiClient.get(`${BASE}/${provider}/auth-url`);
    return data.data;
  },

  /**
   * DELETE /api/calendar/connections/:id
   * @param {boolean} purgeEvents remove previously created events (AC-19)
   */
  async disconnect(connectionId, purgeEvents = false) {
    const { data } = await apiClient.delete(`${BASE}/connections/${connectionId}`, {
      params: { purgeEvents: purgeEvents ? "true" : "false" },
    });
    return data.data;
  },

  /** GET /api/calendar/connections/:id/settings */
  async getSettings(connectionId) {
    const { data } = await apiClient.get(`${BASE}/connections/${connectionId}/settings`);
    return data.data;
  },

  /** PUT /api/calendar/connections/:id/settings */
  async updateSettings(connectionId, payload) {
    const { data } = await apiClient.put(
      `${BASE}/connections/${connectionId}/settings`,
      payload
    );
    return data.data;
  },

  /** POST /api/calendar/connections/:id/sync */
  async syncNow(connectionId) {
    const { data } = await apiClient.post(`${BASE}/connections/${connectionId}/sync`);
    return data.data;
  },

  /** GET /api/calendar/events — upcoming synced items */
  async getUpcomingEvents({ limit = 8, days = 14 } = {}) {
    const { data } = await apiClient.get(`${BASE}/events`, { params: { limit, days } });
    return data.data;
  },

  /** GET /api/calendar/conflicts */
  async getConflicts() {
    const { data } = await apiClient.get(`${BASE}/conflicts`);
    return data.data;
  },

  /** POST /api/calendar/conflicts/:id/resolve */
  async resolveConflict(conflictId, resolution) {
    const { data } = await apiClient.post(`${BASE}/conflicts/${conflictId}/resolve`, {
      resolution,
    });
    return data.data;
  },
};

/** Display labels for the sync-direction selector. */
export const SYNC_DIRECTIONS = [
  { value: "two_way", label: "Two-way (Recommended)" },
  { value: "to_calendar", label: "Tracker → Calendar only" },
  { value: "from_calendar", label: "Calendar → Tracker only" },
];

export const CONFLICT_POLICIES = [
  { value: "tracker_wins", label: "Tracker wins (Recommended)" },
  { value: "calendar_wins", label: "Calendar wins" },
  { value: "manual", label: "Ask me each time" },
];

/**
 * A small, deliberately short list. A full IANA dump would be ~600 entries in
 * a native <select>; these cover the deployment's actual userbase, and the
 * backend validates whatever is sent via Intl, so this list constrains the UI
 * without constraining the API.
 */
export const TIME_ZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

export default calendarApi;
