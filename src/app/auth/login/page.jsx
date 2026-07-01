import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Login',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600 text-white font-bold text-xl mb-4">
            V
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Varadhi Tracker
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Internal tool — Varadhi Club © 2026
        </p>

      </div>
    </div>
  )
}