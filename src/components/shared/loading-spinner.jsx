import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className={cn(
        'animate-spin text-violet-500',
        sizes[size]
      )} />
      {text && (
        <p className="text-sm text-slate-400">{text}</p>
      )}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg animate-pulse">
          V
        </div>
        <p className="text-sm text-slate-400">Loading Varadhi...</p>
      </div>
    </div>
  )
}