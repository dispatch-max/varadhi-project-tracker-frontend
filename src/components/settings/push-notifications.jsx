"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { notificationsApi } from "@/lib/api/notifications.api";
import {
  disablePush,
  enablePush,
  getCurrentSubscription,
  getPermission,
  isPushSupported,
} from "@/lib/push";
import { useHasMounted } from "@/hooks/use-has-mounted";

// Not role-gated, same as the Notifications card above it. That card holds the
// per-account switches (which categories and channels the user wants at all);
// this one holds whether *this specific browser* is subscribed, which is
// per-device on top of that. Both are personal settings for every role.

function reasonToMessage(reason) {
  switch (reason) {
    case "unsupported":
      return "This browser doesn't support push notifications.";
    case "not_configured":
      return "Push isn't configured on the server yet. Contact your administrator.";
    case "denied":
      return "Your browser is blocking notifications for this site. Allow them in your browser's site settings, then try again.";
    case "default":
      return "Notification permission wasn't granted.";
    default:
      return "Couldn't update push notifications. Try again.";
  }
}

export default function PushNotifications() {
  const mounted = useHasMounted();

  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState("default");
  // Account-level master switch (`push_enabled`). A device can be subscribed
  // while this is off — the engine simply won't send, which otherwise looks
  // like push is silently broken.
  const [accountPushEnabled, setAccountPushEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    async function init() {
      const canPush = isPushSupported();
      let serverConfigured = false;
      let hasSubscription = false;
      let allowedForAccount = true;

      if (canPush) {
        try {
          const res = await notificationsApi.getPushPublicKey();
          serverConfigured = Boolean(res?.configured);
        } catch {
          serverConfigured = false;
        }
        // GET /notifications/preferences is available to every role (it only
        // ever returns the caller's own row), so all users can be told when
        // the account-level switch is what's blocking delivery.
        try {
          const prefs = await notificationsApi.getPreferences();
          const value = (prefs?.preferences ?? prefs)?.push_enabled;
          allowedForAccount = value !== false;
        } catch {
          allowedForAccount = true; // don't invent a warning we can't confirm
        }
        // Re-read the live browser subscription rather than trusting stored
        // state — the user may have revoked it in browser settings, or the
        // browser may have rotated/expired it since last visit.
        hasSubscription = Boolean(await getCurrentSubscription());
      }

      if (cancelled) return;
      setSupported(canPush);
      setConfigured(serverConfigured);
      setAccountPushEnabled(allowedForAccount);
      setSubscribed(hasSubscription);
      setPermission(getPermission());
      setIsLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  async function handleToggle(checked) {
    setIsBusy(true);
    setStatus(null);

    const result = checked ? await enablePush() : await disablePush();

    if (result.ok) {
      setSubscribed(checked);
      setStatus({
        type: "success",
        text: checked
          ? "Push notifications enabled on this device."
          : "Push notifications disabled on this device.",
      });
    } else {
      // Re-sync from the browser so the switch reflects reality, not intent.
      setSubscribed(Boolean(await getCurrentSubscription()));
      setStatus({ type: "error", text: reasonToMessage(result.reason) });
    }

    setPermission(getPermission());
    setIsBusy(false);
  }

  if (!mounted || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push notifications</CardTitle>
          <CardDescription>Alerts on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const blocked = permission === "denied";
  const disabled = isBusy || !supported || !configured || blocked;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push notifications</CardTitle>
        <CardDescription>
          Get alerts on this device for task assignments, mentions, review
          requests, due-today reminders and overdue work — even when the tracker
          isn&apos;t open.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="push_device" className="text-sm font-medium">
              Enable on this device
            </Label>
            <p className="text-sm text-muted-foreground">
              Applies to this browser only. Enable it again on each device you
              want alerts on.
            </p>
          </div>
          <Switch
            id="push_device"
            checked={subscribed}
            onCheckedChange={handleToggle}
            disabled={disabled}
          />
        </div>

        {!supported && (
          <p className="text-sm text-muted-foreground">
            {reasonToMessage("unsupported")}
          </p>
        )}

        {supported && !configured && (
          <p className="text-sm text-muted-foreground">
            {reasonToMessage("not_configured")}
          </p>
        )}

        {supported && configured && blocked && (
          <p className="text-sm text-muted-foreground">
            {reasonToMessage("denied")}
          </p>
        )}

        {/* Subscribing works, but nothing will actually be delivered while the
            account-level switch is off — say so instead of failing silently. */}
        {supported && configured && !accountPushEnabled && (
          <p className="text-sm text-amber-600">
            Push is currently turned off for your account, so alerts won&apos;t be
            delivered even with this on. Re-enable &ldquo;Allow push
            notifications&rdquo; in the Notifications card above.
          </p>
        )}

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
      </CardContent>
    </Card>
  );
}
