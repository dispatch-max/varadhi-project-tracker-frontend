import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔒</span>
        </div>

        {/* Message */}
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          You don&apos;t have permission to view this page.
          Contact your admin if you think this is a mistake.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}