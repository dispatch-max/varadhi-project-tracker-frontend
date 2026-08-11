// 'use client'

// import Link from 'next/link'
// import { usePathname } from 'next/navigation'

// import {
//   LayoutDashboard, FolderOpen, ListChecks,
//   Kanban, Files, BarChart3, Users, Settings,
//   LogOut, ChevronLeft, ChevronRight
// } from 'lucide-react'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { useAuthStore } from '@/store/auth.store'
// import { authApi } from '@/lib/api/auth.api'
// import { NAV_ITEMS } from '@/constants'
// import { getInitials, getAvatarColor, cn } from '@/utils'

// // const ICON_MAP = {
// //   LayoutDashboard,
// //   FolderOpen,
// //   ListChecks,
// //   LayoutKanban,
// //   Files,
// //   BarChart3,
// //   Users,
// // }

// const ICON_MAP = {
//   LayoutDashboard,
//   FolderOpen,
//   ListChecks,
//   LayoutKanban: Kanban,
//   Files,
//   BarChart3,
//   Users,
//   Settings,
// }

// export function Sidebar() {
//   const pathname = usePathname()
//   const router = useRouter()
//   const { user, clearAuth } = useAuthStore()
//   const [collapsed, setCollapsed] = useState(false)
//   const [isLoggingOut, setIsLoggingOut] = useState(false)

//   // Filter nav items based on user role
//   const filteredNav = NAV_ITEMS.filter((item) =>
//     item.roles.includes(user?.role || 'employee')
//   )

//   async function handleLogout() {
//     setIsLoggingOut(true)
//     try {
//       await authApi.logout()
//     } catch {
//       // ignore logout API error
//     } finally {
//       clearAuth()
//       document.cookie =
//         'varadhi_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
//       router.push('/auth/login')
//     }
//   }

//   return (
//     <aside
//       className={cn(
//         'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300',
//         collapsed ? 'w-16' : 'w-60'
//       )}
//     >
//       {/* Logo */}
//       <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
//         <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
//           V
//         </div>
//         {!collapsed && (
//           <div>
//             <p className="text-sm font-semibold text-slate-800 leading-tight">
//               Varadhi
//             </p>
//             <p className="text-xs text-slate-400">Tracker</p>
//           </div>
//         )}
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="ml-auto text-slate-400 hover:text-slate-600 flex-shrink-0"
//         >
//           {collapsed
//             ? <ChevronRight className="w-4 h-4" />
//             : <ChevronLeft className="w-4 h-4" />
//           }
//         </button>
//       </div>

//       {/* Nav Items */}
//       <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
//         {filteredNav.map((item) => {
//           const Icon = ICON_MAP[item.icon]
//           const isActive =
//             pathname === item.href ||
//             pathname.startsWith(item.href + '/')

//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={cn(
//                 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
//                 isActive
//                   ? 'bg-violet-50 text-violet-700'
//                   : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
//               )}
//             >
//               <Icon className={cn(
//                 'w-4 h-4 flex-shrink-0',
//                 isActive ? 'text-violet-600' : 'text-slate-400'
//               )} />
//               {!collapsed && (
//                 <span>{item.label}</span>
//               )}
//               {/* Active indicator dot */}
//               {collapsed && isActive && (
//                 <span className="absolute left-0 w-1 h-6 bg-violet-600 rounded-r-full" />
//               )}
//             </Link>
//           )
//         })}
//       </nav>

//       {/* User + Logout */}
//       <div className="border-t border-slate-100 p-3 space-y-1">
//         {/* User info */}
//         <div className={cn(
//           'flex items-center gap-3 px-2 py-2 rounded-lg',
//           collapsed ? 'justify-center' : ''
//         )}>
//           <div className={cn(
//             'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
//             getAvatarColor(user?.name || 'U')
//           )}>
//             {getInitials(user?.name || 'User')}
//           </div>
//           {!collapsed && (
//             <div className="min-w-0">
//               <p className="text-xs font-medium text-slate-800 truncate">
//                 {user?.name}
//               </p>
//               <p className="text-xs text-slate-400 truncate capitalize">
//                 {user?.role}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Logout */}
//         <button
//           onClick={handleLogout}
//           disabled={isLoggingOut}
//           className={cn(
//             'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all',
//             collapsed ? 'justify-center' : ''
//           )}
//         >
//           <LogOut className="w-4 h-4 flex-shrink-0" />
//           {!collapsed && <span>Logout</span>}
//         </button>
//       </div>
//     </aside>
//   )
// }

// 'use client'

// import Link from 'next/link'
// import { usePathname } from 'next/navigation'

// import {
//   LayoutDashboard, FolderOpen, ListChecks,
//   Kanban, Files, BarChart3, Users, Settings,
//   LogOut, ChevronLeft, ChevronRight
// } from 'lucide-react'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { useAuthStore } from '@/store/auth.store'
// import { authApi } from '@/lib/api/auth.api'
// import { NAV_ITEMS } from '@/constants'
// import { getInitials, getAvatarColor, cn } from '@/utils'

// // const ICON_MAP = {
// //   LayoutDashboard,
// //   FolderOpen,
// //   ListChecks,
// //   LayoutKanban,
// //   Files,
// //   BarChart3,
// //   Users,
// // }

// const ICON_MAP = {
//   LayoutDashboard,
//   FolderOpen,
//   ListChecks,
//   LayoutKanban: Kanban,
//   Files,
//   BarChart3,
//   Users,
//   Settings,
// }

// export function Sidebar() {
//   const pathname = usePathname()
//   const router = useRouter()
//   const { user, clearAuth } = useAuthStore()

//   // OLD
//   // const [collapsed, setCollapsed] = useState(false)
//   // const [isLoggingOut, setIsLoggingOut] = useState(false)

//   // NEW
//   const [collapsed, setCollapsed] = useState(false)
//   const [isLoggingOut, setIsLoggingOut] = useState(false)
//   const [mounted, setMounted] = useState(false)

//   useEffect(() => {
//     setMounted(true)
//   }, [])

//   // Filter nav items based on user role
//   const filteredNav = NAV_ITEMS.filter((item) =>
//     item.roles.includes(user?.role || 'employee')
//   )

//   async function handleLogout() {
//     setIsLoggingOut(true)
//     try {
//       await authApi.logout()
//     } catch {
//       // ignore logout API error
//     } finally {
//       clearAuth()
//       document.cookie =
//         'varadhi_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
//       router.push('/auth/login')
//     }
//   }

//   if (!mounted) return null

//   return (
//     <aside
//       className={cn(
//         'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300',
//         collapsed ? 'w-16' : 'w-60'
//       )}
//     >
//       {/* Logo */}
//       <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
//         <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
//           V
//         </div>
//         {!collapsed && (
//           <div>
//             <p className="text-sm font-semibold text-slate-800 leading-tight">
//               Varadhi
//             </p>
//             <p className="text-xs text-slate-400">Tracker</p>
//           </div>
//         )}
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="ml-auto text-slate-400 hover:text-slate-600 flex-shrink-0"
//         >
//           {collapsed
//             ? <ChevronRight className="w-4 h-4" />
//             : <ChevronLeft className="w-4 h-4" />
//           }
//         </button>
//       </div>

//       {/* Nav Items */}
//       <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
//         {filteredNav.map((item) => {
//           const Icon = ICON_MAP[item.icon]
//           const isActive =
//             pathname === item.href ||
//             pathname.startsWith(item.href + '/')

//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={cn(
//                 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
//                 isActive
//                   ? 'bg-violet-50 text-violet-700'
//                   : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
//               )}
//             >
//               <Icon className={cn(
//                 'w-4 h-4 flex-shrink-0',
//                 isActive ? 'text-violet-600' : 'text-slate-400'
//               )} />
//               {!collapsed && (
//                 <span>{item.label}</span>
//               )}
//               {collapsed && isActive && (
//                 <span className="absolute left-0 w-1 h-6 bg-violet-600 rounded-r-full" />
//               )}
//             </Link>
//           )
//         })}
//       </nav>

//       {/* User + Logout */}
//       <div className="border-t border-slate-100 p-3 space-y-1">
//         <div className={cn(
//           'flex items-center gap-3 px-2 py-2 rounded-lg',
//           collapsed ? 'justify-center' : ''
//         )}>
//           <div className={cn(
//             'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
//             getAvatarColor(user?.name || 'U')
//           )}>
//             {getInitials(user?.name || 'User')}
//           </div>
//           {!collapsed && (
//             <div className="min-w-0">
//               <p className="text-xs font-medium text-slate-800 truncate">
//                 {user?.name}
//               </p>
//               <p className="text-xs text-slate-400 truncate capitalize">
//                 {user?.role}
//               </p>
//             </div>
//           )}
//         </div>

//         <button
//           onClick={handleLogout}
//           disabled={isLoggingOut}
//           className={cn(
//             'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all',
//             collapsed ? 'justify-center' : ''
//           )}
//         >
//           <LogOut className="w-4 h-4 flex-shrink-0" />
//           {!collapsed && <span>Logout</span>}
//         </button>
//       </div>
//     </aside>
//   )
// }

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import {
  LayoutDashboard, FolderOpen, ListChecks,
  Kanban, Files, BarChart3, Users, Settings,
  LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/api/auth.api'
import { NAV_ITEMS } from '@/constants'
import { getInitials, getAvatarColor, cn } from '@/utils'
import { useHasMounted } from '@/hooks/use-has-mounted'

const ICON_MAP = {
  LayoutDashboard,
  FolderOpen,
  ListChecks,
  LayoutKanban: Kanban,
  Files,
  BarChart3,
  Users,
  Settings,
}

// Pass collapsed & setCollapsed as props from AppShell
export function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const mounted = useHasMounted()

  // Filter nav items based on user role
  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.role || 'employee')
  )

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await authApi.logout()
    } catch {
      // ignore logout API error
    } finally {
      clearAuth()
      document.cookie =
        'varadhi_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      router.push('/auth/login')
    }
  }

  // Prevent SSR/hydration mismatch for client-only state
  if (!mounted) return null

  return (
    <aside
      className={cn(
        'fixed rounded-r-2xl left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo Section */}
<div className="flex items-center  px-4 py-5 border-b border-slate-100">
  {/* Logo Container */}
  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 select-none">
    <img
      src="/projectlogo-removebg-preview.png"
      alt="Varadhi Logo"
      className="w-full h-full object-contain pointer-events-none mb-2"
    />
  </div>

  {!collapsed && (
    <div>
      <p className="text-base font-semibold text-slate-800 leading-tight">
        Varadhi
      </p>
      <p className="text-xs text-slate-500 font-medium">Project Tracker 2.0</p>
    </div>
  )}

  <button
    type="button"
    onClick={() => setCollapsed(!collapsed)}
    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    className="ml-auto text-slate-400 hover:text-slate-600 flex-shrink-0 p-1 hover:bg-slate-100 rounded-md transition"
  >
    {collapsed ? (
      <ChevronRight className="w-4 h-4" />
    ) : (
      <ChevronLeft className="w-4 h-4" />
    )}
  </button>
</div>{/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = ICON_MAP[item.icon]
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {Icon && (
                <Icon className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-violet-600' : 'text-slate-400'
                )} />
              )}
              {!collapsed && (
                <span>{item.label}</span>
              )}
              {collapsed && isActive && (
                <span className="absolute left-0 w-1 h-6 bg-violet-600 rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-slate-100 p-3 space-y-1">
        <div className={cn(
          'flex items-center gap-3 px-2 py-2 rounded-lg',
          collapsed ? 'justify-center' : ''
        )}>
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
            getAvatarColor(user?.name || 'U')
          )}>
            {getInitials(user?.name || 'User')}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-400 truncate capitalize">
                {user?.role}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}