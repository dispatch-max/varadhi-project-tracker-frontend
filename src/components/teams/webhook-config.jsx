"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Webhook } from "lucide-react";

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
import { teamsApi, DIGEST_OPTIONS } from "@/lib/api/teams.api";
import { projectsApi } from "@/lib/api/projects.api";

/**
 * Connect screen — PRD screen flow 20.
 *
 * The URL field is write-only in both directions: it is `type="password"` on
 * entry (it is a credential, and these screens get shared and screen-shared),
 * and once saved the server never returns it, so editing an existing webhook
 * shows only the masked hint.
 */
export default function WebhookConfig({ eventTypes = [], onCreated }) {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    webhookUrl: "",
    projectId: "",
    name: "",
    summaryDigest: "off",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    projectsApi
      .getAll({}, 1, 100)
      .then((res) => {
        if (cancelled) return;
        setProjects(res?.data || []);
      })
      .catch(() => {
        // A failed project list only costs the optional scoping dropdown; a
        // global (all-projects) webhook is still creatable without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.webhookUrl.trim()) {
      setStatus({ type: "error", text: "Paste the Incoming Webhook URL from Teams." });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      await teamsApi.createWebhook({
        webhookUrl: form.webhookUrl.trim(),
        projectId: form.projectId || null,
        name: form.name.trim() || null,
        summaryDigest: form.summaryDigest,
      });
      setForm({ webhookUrl: "", projectId: "", name: "", summaryDigest: "off" });
      setStatus({ type: "success", text: "Webhook connected. Send a test message to confirm." });
      onCreated?.();
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.message || "Couldn't save the webhook. Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Webhook className="h-4 w-4 text-muted-foreground" />
          Connect a Teams channel
        </CardTitle>
        <CardDescription>
          In Teams, open the channel → ⋯ → Connectors (or Workflows) → Incoming
          Webhook, then paste the generated URL here.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="webhookUrl">Webhook URL *</Label>
            <Input
              id="webhookUrl"
              // A credential, so masked on entry — these screens get shared.
              type="password"
              autoComplete="off"
              placeholder="https://yourtenant.webhook.office.com/webhookb2/..."
              value={form.webhookUrl}
              onChange={(e) => update("webhookUrl", e.target.value)}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Stored encrypted. It is never shown again after saving.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="webhookName">Label</Label>
              <Input
                id="webhookName"
                placeholder="e.g. Product Team — Project Updates"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projectId">Project</Label>
              <select
                id="projectId"
                value={form.projectId}
                onChange={(e) => update("projectId", e.target.value)}
                disabled={isSaving}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summaryDigest">Summary posts</Label>
            <select
              id="summaryDigest"
              value={form.summaryDigest}
              onChange={(e) => update("summaryDigest", e.target.value)}
              disabled={isSaving}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 sm:w-64"
            >
              {DIGEST_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-3.5 w-3.5" />
              )}
              Connect channel
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
        </form>
      </CardContent>
    </Card>
  );
}
