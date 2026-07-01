import { Suspense } from 'react'
import { AcceptInviteForm } from '@/components/auth/accept-invite-form'

export const metadata = {
  title: 'Accept Invite',
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600 text-white font-bold text-xl mb-4">
            V
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Accept Your Invitation
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Set your name and password to join the team
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Suspense is required: AcceptInviteForm uses useSearchParams() */}
          <Suspense
            fallback={
              <div className="py-8 text-center text-sm text-slate-400">
                Loading…
              </div>
            }
          >
            <AcceptInviteForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Internal tool — Varadhi Club © 2026
        </p>

      </div>
    </div>
  )
}