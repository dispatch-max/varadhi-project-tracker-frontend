import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Login',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-slate-100 flex items-center justify-center p-6">

      <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

        {/* ================= LEFT SIDE ================= */}
        <div className="flex justify-center">

          <div className="w-full max-w-md">

            {/* Logo & Title */}
            <div className="text-center mb-8">

              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white font-bold text-2xl shadow-lg mb-4">
                V
              </div>

              <h1 className="text-4xl font-bold text-foreground">
                Varadhi Tracker
              </h1>

              <p className="text-muted-foreground mt-2 text-lg">
                Sign in to your account
              </p>

            </div>

            {/* Login Card */}
            <div className="bg-card rounded-3xl shadow-xl border border-border p-8">

              <LoginForm />

            </div>

            {/* Footer */}
            <p className="text-center text-sm text-slate-400 mt-6">
              Internal tool — Varadhi Club © 2026
            </p>

          </div>

        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="hidden lg:flex flex-col justify-center">

          <div className="inline-flex w-fit items-center rounded-full bg-violet-100 text-violet-700 px-4 py-2 text-sm font-semibold">
            🚀 Tracking Workspace
          </div>

          <h2 className="mt-6 text-5xl font-bold text-foreground leading-tight">
            Manage Projects
            <br />
            Smarter & Faster
          </h2>

          <p className="mt-6 text-lg text-muted-foreground leading-8 max-w-xl">
            Manage projects, assign work, monitor progress,
            collaborate with your team and generate reports
            from one centralized workspace.
          </p>

          <div className="grid grid-cols-2 gap-5 mt-10">

            <div className="bg-card rounded-2xl border border-border shadow-lg p-5 hover:-translate-y-1 hover:shadow-xl transition">
              <div className="text-3xl">📁</div>
              <h3 className="font-semibold mt-3">Project Tracking</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Organize and monitor all projects.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-lg p-5 hover:-translate-y-1 hover:shadow-xl transition">
              <div className="text-3xl">👥</div>
              <h3 className="font-semibold mt-3">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Collaborate with your teammates.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-lg p-5 hover:-translate-y-1 hover:shadow-xl transition">
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold mt-3">Reports</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Generate insights and analytics.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-lg p-5 hover:-translate-y-1 hover:shadow-xl transition">
              <div className="text-3xl">🗓️</div>
              <h3 className="font-semibold mt-3">Leave &amp; Time</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Track attendance and manage leave requests.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}