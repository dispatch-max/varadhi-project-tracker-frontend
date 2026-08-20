import apiClient from "@/lib/api-client";

/**
 * Notification actions API
 *
 * Wraps POST /api/notification-actions — the single backend code path for
 * acting on a notification (approve / reject / accept). Imported directly
 * rather than through lib/api/index.js, matching reports.api.js and
 * notifications.api.js.
 *
 * The endpoint is idempotent: replaying the same action returns the stored
 * result with status 'already_applied' instead of applying it twice, so a
 * double-click is harmless.
 */

const BASE = "/notification-actions";

/**
 * Error codes the backend can return in `data.code`. Surfaced so callers can
 * branch on the cause instead of parsing prose.
 */
export const ACTION_ERROR = {
  INVALID: "invalid_action",
  UNAUTHENTICATED: "unauthenticated",
  NOT_PERMITTED: "not_permitted",
  NOT_FOUND: "notification_not_found",
  CONFLICT: "conflict",
  ALREADY_ACTIONED: "already_actioned_differently",
  RATE_LIMITED: "rate_limited",
};

/**
 * Human-readable fallbacks. The backend already sends a specific `message`
 * (it knows the task title and real status), so that wins when present —
 * these only cover the case where it's missing or the request never landed.
 */
const FALLBACK_MESSAGE = {
  [ACTION_ERROR.NOT_PERMITTED]: "You don't have permission to do that.",
  [ACTION_ERROR.NOT_FOUND]: "That notification no longer exists.",
  [ACTION_ERROR.CONFLICT]: "This task changed before your action was applied.",
  [ACTION_ERROR.ALREADY_ACTIONED]: "This notification was already actioned.",
  [ACTION_ERROR.RATE_LIMITED]: "Too many actions. Please wait a moment.",
  [ACTION_ERROR.INVALID]: "That action isn't available.",
};

/**
 * Normalizes any failure — HTTP error, network error, timeout — into one shape
 * so callers never have to dig through axios internals.
 *
 * @returns {{ code: string|null, message: string, status: number|null, currentStatus: string|null, actionTaken: string|null }}
 */
export function toActionError(err) {
  const res = err?.response;
  const payload = res?.data;
  const code = payload?.data?.code ?? null;

  return {
    code,
    // Backend prose first: it names the task and its real state.
    message:
      payload?.message ||
      FALLBACK_MESSAGE[code] ||
      (res ? "Couldn't complete that action." : "You appear to be offline."),
    status: res?.status ?? null,
    currentStatus: payload?.data?.currentStatus ?? null,
    actionTaken: payload?.data?.actionTaken ?? null,
  };
}

export const notificationActionsApi = {
  /**
   * POST /api/notification-actions
   *
   * @param {string} notificationId
   * @param {'approve'|'reject'|'accept'} action
   * @returns {Promise<{ notificationId, action, status, taskId, taskStatus, actionedAt }>}
   *          `status` is 'applied' | 'already_applied' | 'superseded'.
   */
  async perform(notificationId, action) {
    const { data } = await apiClient.post(BASE, {
      notificationId,
      action,
      source: "in_app",
    });
    return data.data;
  },
};

export default notificationActionsApi;
