"use client";

import { useState } from "react";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import {
  Bell,
  Shield,
  Palette,
  Link2,
  Database,
  History,
  Monitor,
  Download,
  Mail,
  Calendar,
  Clock,
  Globe,
  ChevronRight,
} from "lucide-react";


export default function SettingsClient() {
    const [activeTab, setActiveTab] = useState("General");
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Settings
        </h1>

        <p className="text-slate-500 mt-1">
          Manage your account, preferences and system configuration.
        </p>
      </div>
   <div className="flex flex-wrap gap-2 mb-6">
  {[
    "General",
    "Security",
    "Notifications",
    "Integrations",
    "Preferences",
    "System",
  ].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        activeTab === tab
          ? "bg-violet-600 text-white"
          : "bg-white border border-slate-200 hover:bg-slate-50"
      }`}
    >
      {tab}
    </button>
  ))}
</div>
      {/* Tabs */}
    <div className="mt-6">

  {activeTab === "General" && (
    <>
      <ProfileForm />

      {/* Notification Preferences Card */}
      <div className="bg-white rounded-xl border p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-violet-600" />
          <h2 className="font-semibold">Notification Preferences</h2>
        </div>

        {[
          "Email Notifications",
          "In-App Notifications",
          "Task Assignments",
          "Deadline Alerts",
          "Project Updates",
        ].map((item) => (
          <div
            key={item}
            className="flex justify-between py-3 border-b last:border-0"
          >
            <span className="text-sm">{item}</span>
            <input type="checkbox" defaultChecked />
          </div>
        ))}
      </div>
    </>
  )}

  {activeTab === "Security" && (
    <>
      <ChangePasswordForm />

      <div className="bg-white rounded-xl border p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-violet-600" />
          <h2 className="font-semibold">Recent Activity</h2>
        </div>

        <div className="space-y-3 text-sm">
          <p>Password changed</p>
          <p>Profile updated</p>
          <p>Logged in</p>
          <p>Task completed</p>
        </div>
      </div>
    </>
  )}

  {activeTab === "Notifications" && (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-3">
        Notification Preferences
      </h2>

      <p className="text-slate-500 mb-4">
        Configure email and push notification preferences.
      </p>
    </div>
  )}

  {activeTab === "Integrations" && (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-violet-600" />
        <h2 className="font-semibold">Connected Integrations</h2>
      </div>

      {[
        "Google Calendar",
        "GitHub",
        "Slack",
        "Microsoft Teams",
        "Jira",
      ].map((item) => (
        <div
          key={item}
          className="flex justify-between py-3 border-b last:border-0"
        >
          <span>{item}</span>
          <span className="text-green-600 text-sm">Connected</span>
        </div>
      ))}
    </div>
  )}

  {activeTab === "Preferences" && (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-violet-600" />
        <h2 className="font-semibold">Preferences</h2>
      </div>

      {[
        "Language",
        "Date Format",
        "Time Format",
        "Timezone",
        "Default Dashboard",
        "Items Per Page",
      ].map((item) => (
        <div
          key={item}
          className="flex justify-between items-center py-3"
        >
          <span>{item}</span>

          <select className="border rounded-lg px-3 py-2">
            <option>Default</option>
          </select>
        </div>
      ))}
    </div>
  )}

  {activeTab === "System" && (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Monitor className="w-5 h-5 text-violet-600" />
        <h2 className="font-semibold">System Settings</h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Software Version</span>
          <span>v2.0.0</span>
        </div>

        <div className="flex justify-between">
          <span>Storage Usage</span>
          <span>24%</span>
        </div>

        <div className="flex justify-between">
          <span>Maintenance Mode</span>
          <span className="text-green-600">Active</span>
        </div>
      </div>
    </div>
  )}

</div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-6">

          <ProfileForm />

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-violet-600" />
              <h2 className="font-semibold">
                Notification Preferences
              </h2>
            </div>

            {[
              'Email Notifications',
              'In-App Notifications',
              'Task Assignments',
              'Deadline Alerts',
              'Project Updates',
            ].map((item) => (
              <div
                key={item}
                className="flex justify-between py-3 border-b last:border-0"
              >
                <span className="text-sm">{item}</span>

                <input type="checkbox" defaultChecked />
              </div>
            ))}

            <button className="w-full mt-5 border rounded-lg py-2 hover:bg-slate-50">
              Manage Notifications
            </button>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-violet-600" />
              <h2 className="font-semibold">
                System Settings
              </h2>
            </div>

            <div className="space-y-4 text-sm">

              <div className="flex justify-between">
                <span>Software Version</span>
                <span>v2.0.0</span>
              </div>

              <div className="flex justify-between">
                <span>Storage Usage</span>
                <span>24%</span>
              </div>

              <div className="flex justify-between">
                <span>Maintenance Mode</span>
                <span className="text-green-600">Active</span>
              </div>

            </div>

            <button className="mt-5 w-full border rounded-lg py-2">
              System Information
            </button>
          </div>

        </div>

       {/* CENTER COLUMN */}

        <div className="space-y-6">

          <div className="bg-white rounded-xl border p-6">

            <div className="flex items-center gap-2 mb-5">
              <Globe className="w-5 h-5 text-violet-600" />

              <h2 className="font-semibold">
                Preferences
              </h2>

            </div>

            <div className="space-y-4">

              {[
                'Language',
                'Date Format',
                'Time Format',
                'Timezone',
                'Default Dashboard',
                'Items Per Page',
              ].map((item) => (

                <div
                  key={item}
                  className="flex justify-between items-center"
                >

                  <span className="text-sm">
                    {item}
                  </span>

                  <select className="border rounded-lg px-3 py-2 text-sm">

                    <option>Default</option>

                  </select>

                </div>

              ))}

            </div>

          </div>

          <div className="bg-white rounded-xl border p-6">

            <div className="flex items-center gap-2 mb-5">

              <Link2 className="w-5 h-5 text-violet-600" />

              <h2 className="font-semibold">

                Connected Integrations

              </h2>

            </div>

            {[
              'Google Calendar',
              'GitHub',
              'Slack',
              'Microsoft Teams',
              'Jira',
            ].map((item) => (

              <div
                key={item}
                className="flex justify-between py-3 border-b last:border-0"
              >

                <span>{item}</span>

                <span className="text-green-600 text-sm">
                  Connected
                </span>

              </div>

            ))}

          </div>

          <div className="bg-white rounded-xl border p-6">

            <div className="flex items-center gap-2 mb-4">

              <Database className="w-5 h-5 text-violet-600" />

              <h2 className="font-semibold">

                Data & Privacy

              </h2>

            </div>

            {[
              'Export My Data',
              'Clear Cache',
              'Privacy Settings',
            ].map((item) => (

              <div
                key={item}
                className="flex justify-between py-3 border-b last:border-0"
              >

                <span>{item}</span>

                <ChevronRight size={18} />

              </div>

            ))}

          </div>

        </div>

        {/* RIGHT COLUMN */}

        <div className="space-y-6">

          <ChangePasswordForm />

          <div className="bg-white rounded-xl border p-6">

            <div className="flex items-center gap-2 mb-5">

              <Palette className="w-5 h-5 text-violet-600" />

              <h2 className="font-semibold">

                Appearance

              </h2>

            </div>

            <div className="space-y-4">

              {[
                'Theme',
                'Primary Color',
                'Sidebar Style',
                'Font Size',
              ].map((item) => (

                <div
                  key={item}
                  className="flex justify-between items-center"
                >

                  <span>{item}</span>

                  <select className="border rounded-lg px-3 py-2">

                    <option>Default</option>

                  </select>

                </div>

              ))}

            </div>

          </div>

          <div className="bg-white rounded-xl border p-6">

            <div className="flex items-center gap-2 mb-4">

              <History className="w-5 h-5 text-violet-600" />

              <h2 className="font-semibold">

                Recent Activity

              </h2>

            </div>

            <div className="space-y-4 text-sm">

              <p>Password changed</p>

              <p>Profile updated</p>

              <p>Logged in</p>

              <p>Task completed</p>

            </div>

          </div>

          <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl p-6">

            <h2 className="font-semibold mb-4">
              Quick Actions
            </h2>

            <div className="space-y-3">

              <button className="w-full bg-white/20 rounded-lg py-2">
                Change Password
              </button>

              <button className="w-full bg-white/20 rounded-lg py-2">
                Manage Sessions
              </button>

              <button className="w-full bg-white/20 rounded-lg py-2">
                Download Data
              </button>

              <button className="w-full bg-white/20 rounded-lg py-2">
                Contact Support
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}