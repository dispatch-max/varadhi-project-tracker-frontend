"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  calendarApi,
  CONFLICT_POLICIES,
  SYNC_DIRECTIONS,
  TIME_ZONES,
} from "@/lib/api/calendar.api";

const DEFAULTS = {
  syncDirection: "two_way",
  syncTasks: true,
  syncMeetings: true,
  syncMilestones: true,
  syncReminders: true,
  defaultCalendar: "google",
  timeZone: "Asia/Kolkata",
  dueTimeOfDay: "09:00",
  conflictPolicy: "tracker_wins",
};

/** Native <select> — the shadcn Select primitive is unused across this app. */
function SelectRow({ id, label, description, value, onChange, options, disabled }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 sm:w-64"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ id, label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export default function SyncSettings({ connections = [], onSaved }) {
  const connection = connections.find((c) => c.status === "connected") || connections[0];

  const [form, setForm] = useState(DEFAULTS);
  const [saved, setSaved] = useState(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const load = useCallback(async (connectionId) => {
    if (!connectionId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { settings } = await calendarApi.getSettings(connectionId);
      const next = { ...DEFAULTS, ...(settings || {}) };
      setForm(next);
      setSaved(next);
    } catch {
      setStatus({ type: "error", text: "Couldn't load your sync settings." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(connection?.id);
  }, [load, connection?.id]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved);

  const handleSave = async () => {
    if (!connection?.id) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const { settings } = await calendarApi.updateSettings(connection.id, form);
      const next = { ...DEFAULTS, ...(settings || {}) };
      setForm(next);
      setSaved(next);
      setStatus({ type: "success", text: "Sync settings saved." });
      onSaved?.();
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.message || "Couldn't save your settings. Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  // Settings without a connection would be configuring nothing — say so
  // rather than rendering controls that silently discard input.
  if (!connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Sync settings
          </CardTitle>
          <CardDescription>
            Connect a calendar above to choose what syncs and how.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const disabled = isSaving;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          Sync settings
        </CardTitle>
        <CardDescription>
          Controls what leaves the tracker and how clashes are resolved.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <SelectRow
          id="syncDirection"
          label="Sync direction"
          value={form.syncDirection}
          onChange={(v) => updateField("syncDirection", v)}
          options={SYNC_DIRECTIONS}
          disabled={disabled}
        />
        <Separator />

        <ToggleRow
          id="syncTasks"
          label="Sync tasks"
          description="Task due dates appear as calendar events."
          checked={form.syncTasks}
          onChange={(v) => updateField("syncTasks", v)}
          disabled={disabled}
        />
        <ToggleRow
          id="syncMeetings"
          label="Sync meetings"
          checked={form.syncMeetings}
          onChange={(v) => updateField("syncMeetings", v)}
          disabled={disabled}
        />
        <ToggleRow
          id="syncMilestones"
          label="Sync milestones"
          description="Project end dates for projects you manage or belong to."
          checked={form.syncMilestones}
          onChange={(v) => updateField("syncMilestones", v)}
          disabled={disabled}
        />
        <ToggleRow
          id="syncReminders"
          label="Sync reminders"
          description="Adds a calendar-native reminder ahead of each event."
          checked={form.syncReminders}
          onChange={(v) => updateField("syncReminders", v)}
          disabled={disabled}
        />
        <Separator />

        <SelectRow
          id="defaultCalendar"
          label="Default calendar (new events)"
          value={form.defaultCalendar}
          onChange={(v) => updateField("defaultCalendar", v)}
          options={[
            { value: "google", label: "Google Calendar" },
            { value: "outlook", label: "Outlook Calendar" },
          ]}
          disabled={disabled}
        />
        <SelectRow
          id="timeZone"
          label="Time zone"
          description="Due dates are placed at a local time in this zone."
          value={form.timeZone}
          onChange={(v) => updateField("timeZone", v)}
          options={TIME_ZONES.map((z) => ({ value: z, label: z }))}
          disabled={disabled}
        />
        <SelectRow
          id="dueTimeOfDay"
          label="Due-date time"
          description="A due date is a day, not a time — this is where it lands."
          value={form.dueTimeOfDay}
          onChange={(v) => updateField("dueTimeOfDay", v)}
          options={["08:00", "09:00", "10:00", "12:00", "14:00", "17:00", "18:00"].map(
            (t) => ({ value: t, label: t })
          )}
          disabled={disabled}
        />
        <SelectRow
          id="conflictPolicy"
          label="Conflict resolution"
          description="When an event changes in both places."
          value={form.conflictPolicy}
          onChange={(v) => updateField("conflictPolicy", v)}
          options={CONFLICT_POLICIES}
          disabled={disabled}
        />

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={handleSave} disabled={!isDirty || isSaving} size="sm">
            {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Save settings
          </Button>
          {status && (
            <p
              role="status"
              className={
                status.type === "success"
                  ? "text-sm text-emerald-600"
                  : "text-sm text-destructive"
              }
            >
              {status.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
