import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">

        {/* Big 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] font-bold text-slate-100 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              V
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-xl font-semibold text-slate-800 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          The page you are looking for doesn&apos;t exist or
          you don&apos;t have permission to view it.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/auth/login"
            className="px-5 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Sign in
          </Link>
        </div>

      </div>
    </div>
  )
}