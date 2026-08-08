// 'use client'

// import { usePathname } from 'next/navigation'
// import { Bell, Search } from 'lucide-react'
// import { useState } from 'react'
// import { useAuthStore } from '@/store/auth.store'
// import { useNotificationStore } from '@/store/notification.store'
// import { NAV_ITEMS } from '@/constants'
// import { getInitials, getAvatarColor, cn } from '@/utils'

// export function Topbar() {
//   const pathname = usePathname()
//   const { user } = useAuthStore()
//   const { unreadCount } = useNotificationStore()
//   const [searchValue, setSearchValue] = useState('')

//   // Get current page title from nav items
//   const currentNav = NAV_ITEMS.find(
//     (item) =>
//       pathname === item.href || pathname.startsWith(item.href + '/')
//   )
//   const pageTitle = currentNav?.label || 'Dashboard'

//   return (
//     <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-10">

//       {/* Page Title */}
//       <div className="flex-1">
//         <h1 className="text-sm font-semibold text-slate-800">{pageTitle}</h1>
//         <p className="text-xs text-slate-400 capitalize">
//           {user?.role} · Varadhi Club
//         </p>
//       </div>

//       {/* Search */}
//       <div className="relative hidden md:block">
//         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
//         <input
//           type="text"
//           placeholder="Search tasks, projects..."
//           value={searchValue}
//           onChange={(e) => setSearchValue(e.target.value)}
//           className="pl-8 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400"
//         />
//       </div>

//       {/* Notification Bell */}
//       <button className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors">
//         <Bell className="w-4 h-4" />
//         {unreadCount > 0 && (
//           <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
//             {unreadCount > 9 ? '9+' : unreadCount}
//           </span>
//         )}
//       </button>

//       {/* User Avatar */}
//       <div className="flex items-center gap-2">
//         <div className={cn(
//           'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold',
//           getAvatarColor(user?.name || 'U')
//         )}>
//           {getInitials(user?.name || 'User')}
//         </div>
//         <div className="hidden md:block">
//           <p className="text-xs font-medium text-slate-800 leading-tight">
//             {user?.name}
//           </p>
//           <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
//         </div>
//       </div>

//     </header>
//   )
// }

'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notification.store'
import { NAV_ITEMS } from '@/constants'
import { getInitials, getAvatarColor, cn } from '@/utils'
import { useHasMounted } from '@/hooks/use-has-mounted'

export function Topbar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [searchValue, setSearchValue] = useState('')
  const mounted = useHasMounted()

  // Get current page title from nav items
  const currentNav = NAV_ITEMS.find(
    (item) =>
      pathname === item.href || pathname.startsWith(item.href + '/')
  )
  const pageTitle = currentNav?.label || 'Dashboard'

  // Only trust client-only store values after mount. Before that, the server
  // and the first client render must agree, so we render neutral fallbacks.
  const displayName = mounted ? user?.name : undefined
  const displayRole = mounted ? user?.role : undefined
  const showUnread = mounted && unreadCount > 0

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-10">

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-slate-800">{pageTitle}</h1>
        <p className="text-xs text-slate-400 capitalize">
          {displayRole ? `${displayRole} · ` : ''}Varadhi Club
        </p>
      </div>

    
      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search tasks, projects..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-8 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400"
        />
      </div>

      {/* Notification Bell */}
      <button className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors">
        <Bell className="w-4 h-4" />
        {showUnread && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* User Avatar */}
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold',
          getAvatarColor(displayName || 'U')
        )}>
          {getInitials(displayName || 'User')}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-medium text-slate-800 leading-tight">
            {displayName}
          </p>
          <p className="text-xs text-slate-400 capitalize">{displayRole}</p>
        </div>
      </div>

    </header>
  )
}
