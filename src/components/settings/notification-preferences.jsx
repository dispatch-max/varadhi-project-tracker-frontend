"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { notificationsApi } from "@/lib/api/notifications.api";

// Not role-gated. Every field on this card maps to a column on the caller's
// own `notification_preferences` row, and GET/PUT /notifications/preferences
// carry no restrictTo — they only ever read and write req.user.id. So these
// are personal settings for admin, manager and employee alike; none of them
// is org-level policy.

const CATEGORY_TOGGLES = [
  {
    field: "task_assigned",
    label: "Task assigned",
    description: "When a task is assigned to you.",
  },
  {
    field: "task_reassigned",
    label: "Task reassigned",
    description: "When a task is reassigned to you.",
  },
  {
    field: "task_status_changed",
    label: "Task status changed",
    description: "When the status of a task you reported changes.",
  },
  {
    field: "due_date_changed",
    label: "Due date changed",
    description: "When the due date of a task you're assigned changes.",
  },
  {
    field: "priority_changed",
    label: "Priority changed",
    description: "When the priority of a task you're assigned changes.",
  },
  {
    field: "comment_added",
    label: "Comments",
    description: "When someone comments on one of your tasks.",
  },
  {
    field: "mentions",
    label: "Mentions",
    description: "When someone @mentions you in a comment.",
  },
  {
    field: "review_requests",
    label: "Review requests",
    description: "When a review is requested on your work.",
  },
  {
    field: "approvals",
    label: "Approvals",
    description: "When a task you're assigned is approved or rejected.",
  },
  {
    field: "due_date_reminder",
    label: "Due date reminders",
    description: "The day before, and the day, a task you're assigned is due.",
  },
  {
    field: "overdue",
    label: "Overdue tasks",
    description: "When one of your tasks becomes overdue.",
    // Escalations are deliberately outside the category map in the engine, so
    // this toggle genuinely does not stop them. Say so where it's misread.
    note: "Escalation alerts after 48 and 72 hours are always sent, even with this off.",
  },
  {
    field: "project_updates",
    label: "Project updates",
    description: "When a project you're on is updated or you're added to one.",
  },
  {
    field: "documents",
    label: "Documents",
    description: "When a document is shared in one of your projects.",
  },
  {
    field: "system_notifications",
    label: "System notifications",
    description: "Account and system-level alerts.",
  },
];

// push_enabled/email_enabled/quiet_hours_* plus every category above, all
// defaulting true so existing users see no behavior change until they
// explicitly opt out of something new.
const DEFAULTS = {
  push_enabled: true,
  email_enabled: false,
  quiet_hours_enabled: true,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  // "" means off (use the fixed due-tomorrow/due-today reminders only).
  reminder_lead_days: "",
  ...Object.fromEntries(CATEGORY_TOGGLES.map(({ field }) => [field, true])),
};

/** Postgres returns TIME as '22:00:00'; <input type="time"> wants '22:00'. */
function toInputTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

/* --- Quiet-hours "is it on right now?" ----------------------------------- */

const MINUTES_PER_DAY = 24 * 60;
const CLOCK_TICK_MS = 30000;

/** Mirrors notification-engine.js#timeToMinutes. */
function timeToMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Mirrors notification-engine.js#isWithinQuietHours: the window wraps around
 * midnight when start > end (22:00 -> 07:00), and an empty or equal pair
 * means "no window", not "all day".
 */
function isWithinQuietHours(startValue, endValue, nowMinutes) {
  const start = timeToMinutes(startValue);
  const end = timeToMinutes(endValue);
  if (start === null || end === null || start === end || nowMinutes === null) return false;
  if (start > end) return nowMinutes >= start || nowMinutes < end;
  return nowMinutes >= start && nowMinutes < end;
}

/**
 * Reads against the *server's* clock, seeded by the `serverTime` the
 * preferences endpoint returns, because that is the clock the engine gates on.
 * Only the elapsed minutes come from the browser, which is accurate regardless
 * of which timezone this device is in.
 *
 * The window shown is whatever is currently on screen (`form`), so toggling a
 * time immediately answers "would this be muting me right now?".
 */
function QuietHoursNow({ enabled, start, end, serverTime }) {
  // Minutes since `serverTime` was captured, counted by this browser. Only
  // ever written from the interval, so a fresh serverTime needs the component
  // remounted to reset it — the caller passes key={serverTime} for that.
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const anchorMs = Date.now();
    const id = setInterval(
      () => setElapsedMinutes(Math.floor((Date.now() - anchorMs) / 60000)),
      CLOCK_TICK_MS
    );
    return () => clearInterval(id);
  }, []);

  const base = timeToMinutes(serverTime);
  if (base === null) return null;

  const nowMinutes = (base + elapsedMinutes) % MINUTES_PER_DAY;
  const active = enabled && isWithinQuietHours(start, end, nowMinutes);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span
        className={
          active
            ? "inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
            : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
        }
      >
        <span
          className={
            active
              ? "h-1.5 w-1.5 rounded-full bg-indigo-500"
              : "h-1.5 w-1.5 rounded-full bg-slate-300"
          }
        />
        {active ? "Active right now" : "Not active right now"}
      </span>
      <span className="text-xs text-muted-foreground">
        It&apos;s {minutesToTime(nowMinutes)} on the server, and that&apos;s the clock
        the window is checked against — not this device&apos;s.
      </span>
    </div>
  );
}

export default function NotificationPreferences() {
  const [form, setForm] = useState(DEFAULTS);
  const [saved, setSaved] = useState(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text }
  // Server-local wall clock at load, "HH:MM". Quiet hours are evaluated
  // against the backend's clock, not the browser's — see QuietHoursNow.
  const [serverTime, setServerTime] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const res = await notificationsApi.getPreferences();
        const payload = res?.data ?? res ?? {};
        const prefs = payload.preferences ?? {};
        if (!cancelled) setServerTime(payload.serverTime ?? null);

        const next = {
          push_enabled: prefs.push_enabled ?? DEFAULTS.push_enabled,
          email_enabled: prefs.email_enabled ?? DEFAULTS.email_enabled,
          quiet_hours_enabled: prefs.quiet_hours_enabled ?? DEFAULTS.quiet_hours_enabled,
          quiet_hours_start:
            toInputTime(prefs.quiet_hours_start) || DEFAULTS.quiet_hours_start,
          quiet_hours_end:
            toInputTime(prefs.quiet_hours_end) || DEFAULTS.quiet_hours_end,
          reminder_lead_days:
            prefs.reminder_lead_days === null || prefs.reminder_lead_days === undefined
              ? ""
              : String(prefs.reminder_lead_days),
          ...Object.fromEntries(
            CATEGORY_TOGGLES.map(({ field }) => [field, prefs[field] ?? DEFAULTS[field]])
          ),
        };

        if (!cancelled) {
          setForm(next);
          setSaved(next);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({
            type: "error",
            text: "Could not load your notification settings. Refresh to try again.",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatus(null);
  }

  async function handleSave() {
    if (form.quiet_hours_enabled && (!form.quiet_hours_start || !form.quiet_hours_end)) {
      setStatus({ type: "error", text: "Set both a start and an end time for quiet hours." });
      return;
    }

    let leadDaysPayload = null;
    if (form.reminder_lead_days !== "") {
      const parsed = Number(form.reminder_lead_days);
      if (!Number.isInteger(parsed) || parsed < 2 || parsed > 30) {
        setStatus({
          type: "error",
          text: "Custom reminder lead time must be between 2 and 30 days (use the day-before/day-of toggle above for 0-1 days).",
        });
        return;
      }
      leadDaysPayload = parsed;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const res = await notificationsApi.updatePreferences({
        ...form,
        reminder_lead_days: leadDaysPayload,
      });
      const payload = res?.data ?? res ?? {};
      const prefs = payload.preferences ?? form;
      if (payload.serverTime) setServerTime(payload.serverTime);

      const next = {
        push_enabled: prefs.push_enabled ?? form.push_enabled,
        email_enabled: prefs.email_enabled ?? form.email_enabled,
        quiet_hours_enabled: prefs.quiet_hours_enabled ?? form.quiet_hours_enabled,
        quiet_hours_start:
          toInputTime(prefs.quiet_hours_start) || form.quiet_hours_start,
        quiet_hours_end: toInputTime(prefs.quiet_hours_end) || form.quiet_hours_end,
        reminder_lead_days:
          prefs.reminder_lead_days === null || prefs.reminder_lead_days === undefined
            ? ""
            : String(prefs.reminder_lead_days),
        ...Object.fromEntries(
          CATEGORY_TOGGLES.map(({ field }) => [field, prefs[field] ?? form[field]])
        ),
      };

      setForm(next);
      setSaved(next);
      setStatus({ type: "success", text: "Notification settings saved." });
    } catch (error) {
      const text =
        error?.response?.data?.message ||
        "Could not save your notification settings. Try again.";
      setStatus({ type: "error", text });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how the tracker reaches you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 animate-pulse rounded-md bg-muted" />
          <div className="h-10 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-1/2 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose how the tracker reaches you. In-app notifications always stay on.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="push_enabled" className="text-sm font-medium">
              Allow push notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Account-level master switch. Turning this off stops push for every
              device. Each browser must also be switched on individually in the
              &ldquo;Push notifications&rdquo; card below.
            </p>
          </div>
          <Switch
            id="push_enabled"
            checked={form.push_enabled}
            onCheckedChange={(checked) => updateField("push_enabled", checked)}
            disabled={isSaving}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="email_enabled" className="text-sm font-medium">
              Email notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              A copy of each notification sent to your registered email address.
            </p>
          </div>
          <Switch
            id="email_enabled"
            checked={form.email_enabled}
            onCheckedChange={(checked) => updateField("email_enabled", checked)}
            disabled={isSaving}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="quiet_hours_enabled" className="text-sm font-medium">
                Quiet hours
              </Label>
              <p className="text-sm text-muted-foreground">
                Push and email pause during this window. Urgent escalations still come
                through, and everything is waiting in your in-app inbox.
              </p>
            </div>
            <Switch
              id="quiet_hours_enabled"
              checked={form.quiet_hours_enabled}
              onCheckedChange={(checked) => updateField("quiet_hours_enabled", checked)}
              disabled={isSaving}
            />
          </div>

          {form.quiet_hours_enabled && (
            <QuietHoursNow
              key={serverTime}
              enabled={form.quiet_hours_enabled}
              start={form.quiet_hours_start}
              end={form.quiet_hours_end}
              serverTime={serverTime}
            />
          )}

          {form.quiet_hours_enabled && (
            <div className="grid gap-4 sm:grid-cols-2 sm:max-w-md">
              <div className="space-y-2">
                <Label htmlFor="quiet_hours_start" className="text-xs text-muted-foreground">
                  Starts
                </Label>
                <Input
                  id="quiet_hours_start"
                  type="time"
                  value={form.quiet_hours_start}
                  onChange={(e) => updateField("quiet_hours_start", e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiet_hours_end" className="text-xs text-muted-foreground">
                  Ends
                </Label>
                <Input
                  id="quiet_hours_end"
                  type="time"
                  value={form.quiet_hours_end}
                  onChange={(e) => updateField("quiet_hours_end", e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="reminder_lead_days" className="text-sm font-medium">
            Custom reminder lead time
          </Label>
          <p className="text-sm text-muted-foreground">
            Get an extra reminder this many days before a task is due, on top of the
            day-before and day-of reminders. Leave blank to use just those two.
          </p>
          <Input
            id="reminder_lead_days"
            type="number"
            min={2}
            max={30}
            placeholder="e.g. 3"
            className="max-w-30"
            value={form.reminder_lead_days}
            onChange={(e) => updateField("reminder_lead_days", e.target.value)}
            disabled={isSaving}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-sm font-medium">Notify me about</Label>

          {CATEGORY_TOGGLES.map(({ field, label, description, note }) => (
            <div key={field} className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor={field} className="text-sm font-medium">
                  {label}
                </Label>
                <p className="text-sm text-muted-foreground">{description}</p>
                {note && <p className="text-sm text-amber-600">{note}</p>}
              </div>
              <Switch
                id={field}
                checked={form[field]}
                onCheckedChange={(checked) => updateField(field, checked)}
                disabled={isSaving}
              />
            </div>
          ))}

          {/* These two types are intentionally left out of the engine's
              category map, so no toggle above can silence them. Stating it
              here stops "I turned it off but still got alerts" reports. */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
            <p className="text-sm font-medium">Always delivered</p>
            <p className="text-sm text-muted-foreground">
              A few alerts can&apos;t be switched off, so nothing critical is missed:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
              <li>
                <span className="font-medium">Overdue escalations</span> — to the project
                manager after 48 hours, and to all admins after 72 hours.
              </li>
              <li>
                <span className="font-medium">General task updates</span> — changes to a task
                you&apos;re assigned that none of the categories above cover.
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Quiet hours still mute push and email for these — except escalations, which are
              marked urgent and always come through.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>

          {status && (
            <p
              className={
                status.type === "success"
                  ? "text-sm text-emerald-600"
                  : "text-sm text-destructive"
              }
              role="status"
            >
              {status.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}