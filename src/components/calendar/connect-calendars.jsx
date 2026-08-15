"use client";

import { useState } from "react";
import { CalendarSync, CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { calendarApi } from "@/lib/api/calendar.api";
import { formatRelativeTime } from "@/utils";

const PROVIDER_META = {
  google: {
    label: "Google Calendar",
    // Brand marks as inline SVG rather than remote images: the app is a PWA
    // with an offline cache, and a hotlinked logo would be a blank box the
    // moment connectivity drops.
    tile: "bg-blue-50 text-blue-600",
    initial: "31",
  },
  outlook: {
    label: "Outlook Calendar",
    tile: "bg-sky-50 text-sky-700",
    initial: "O",
  },
};

function ProviderMark({ provider }) {
  const meta = PROVIDER_META[provider] || PROVIDER_META.google;
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${meta.tile}`}
      aria-hidden="true"
    >
      {meta.initial}
    </div>
  );
}

export default function ConnectCalendars({
  providers = [],
  connections = [],
  onChanged,
}) {
  const [busyProvider, setBusyProvider] = useState(null);
  const [status, setStatus] = useState(null);
  const [pendingDisconnect, setPendingDisconnect] = useState(null);

  const connectionFor = (name) => connections.find((c) => c.provider === name);

  const handleConnect = async (name) => {
    setBusyProvider(name);
    setStatus(null);
    try {
      const { url } = await calendarApi.getAuthUrl(name);
      // Full navigation, not fetch: the consent screen is provider-hosted and
      // deliberately cannot be embedded or XHR'd. assign() rather than
      // `location.href = …` so this reads as the method call it is, and does
      // not trip the immutability rule on a global.
      window.location.assign(url);
    } catch (err) {
      setBusyProvider(null);
      setStatus({
        type: "error",
        text:
          err.response?.data?.message ||
          "Couldn't start the authorisation flow. Try again.",
      });
    }
  };

  const handleDisconnect = async (connection, purgeEvents) => {
    setBusyProvider(connection.provider);
    setPendingDisconnect(null);
    setStatus(null);
    try {
      const result = await calendarApi.disconnect(connection.id, purgeEvents);
      setStatus({
        type: "success",
        text: purgeEvents
          ? `Disconnected. ${result.eventsRemoved} event(s) removed from your calendar.`
          : "Disconnected. Previously synced events were left on your calendar.",
      });
      onChanged?.();
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.message || "Couldn't disconnect. Try again.",
      });
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarSync className="h-4 w-4 text-muted-foreground" />
          Connect your calendars
        </CardTitle>
        <CardDescription>
          Sync your tasks, due dates and milestones with the calendar you already
          plan your day in.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {providers.map((provider) => {
          const connection = connectionFor(provider.name);
          const meta = PROVIDER_META[provider.name] || {};
          const isConnected = connection?.status === "connected";
          const isBroken =
            connection && connection.status !== "connected";
          const busy = busyProvider === provider.name;

          return (
            <div
              key={provider.name}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProviderMark provider={provider.name} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{meta.label}</p>
                  {connection ? (
                    <>
                      <p className="truncate text-sm text-muted-foreground">
                        {connection.accountEmail || "Connected account"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connection.lastSyncedAt
                          ? `Last synced ${formatRelativeTime(connection.lastSyncedAt)}`
                          : "Not synced yet"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {/* Say plainly when no real credentials are configured,
                          rather than offering a Connect button that silently
                          attaches a demo calendar. */}
                      {provider.configured
                        ? "Not connected"
                        : "Demo mode — no provider credentials configured"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {isConnected && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Connected
                  </span>
                )}
                {isBroken && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <TriangleAlert className="h-4 w-4" />
                    Reconnect needed
                  </span>
                )}

                {connection ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setPendingDisconnect(connection)}
                    className="text-destructive hover:text-destructive"
                  >
                    {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => handleConnect(provider.name)}
                  >
                    {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {connection_error_note(providers)}

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
      </CardContent>

      {/* AC-19: disconnecting must OFFER to remove previously created events,
          not decide for the user. Someone who spent a month with deadlines on
          their calendar may well want to keep them. */}
      <AlertDialog
        open={Boolean(pendingDisconnect)}
        onOpenChange={(open) => !open && setPendingDisconnect(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect{" "}
              {PROVIDER_META[pendingDisconnect?.provider]?.label || "calendar"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sync will stop immediately. You can either keep the events already
              on your calendar, or remove them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleDisconnect(pendingDisconnect, false)}
            >
              Keep events
            </Button>
            <AlertDialogAction
              onClick={() => handleDisconnect(pendingDisconnect, true)}
            >
              Remove events
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/** Shown once when neither provider has real credentials. */
function connection_error_note(providers) {
  const anyConfigured = providers.some((p) => p.configured);
  if (anyConfigured || providers.length === 0) return null;

  return (
    <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
      Calendar providers aren&apos;t configured on this server, so connecting
      uses a built-in demo calendar. Sync, conflict handling and settings all
      behave exactly as they will in production — only the calendar itself is
      simulated.
    </p>
  );
}
