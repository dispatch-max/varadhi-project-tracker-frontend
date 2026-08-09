import { ProfileForm } from '@/components/settings/profile-form'
import { ChangePasswordForm } from '@/components/settings/change-password-form'
import NotificationPreferences from "@/components/settings/notification-preferences";
import PushNotifications from "@/components/settings/push-notifications";

export const metadata = {
  title: 'Settings',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Settings
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your profile and account settings.
        </p>
      </div>

      {/* Profile Form */}
      <ProfileForm />

      {/* Change Password */}
      <ChangePasswordForm />
      <NotificationPreferences />
      <PushNotifications />

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <h3 className="text-sm font-semibold text-red-600 mb-1">
          Danger Zone
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          These actions are irreversible. Please be careful.
        </p>
        <div className="flex items-center justify-between py-3 border-t border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Deactivate Account
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Your account will be disabled. Contact admin to reactivate.
            </p>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            Deactivate
          </button>
        </div>
      </div>

    </div>
  )
}