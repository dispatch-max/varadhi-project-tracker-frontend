'use client'

import { useState, useEffect } from 'react'
import {
  Search, UserPlus, MoreHorizontal,
  ShieldCheck, Shield, User,
  CheckCircle2, Clock, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteUserModal } from './invite-user-modal'
import { useAuthStore } from '@/store/auth.store'
import { usersApi } from '@/lib/api/users.api'
import {
  USER_ROLE_COLORS, USER_ROLE_LABELS
} from '@/constants'
import {
  getInitials, getAvatarColor,
  formatDate, cn
} from '@/utils'


const ROLE_ICONS = {
  admin: ShieldCheck,
  manager: Shield,
  employee: User,
}


const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-slate-100 text-slate-500',
    icon: XCircle,
  },
  invited: {
    label: 'Invited',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
}


export function UsersList() {
  const { user: currentUser } = useAuthStore()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [actioningId, setActioningId] = useState(null) // disables a row's menu while its API call is in flight

  useEffect(() => {
    setMounted(true)
  }, [])

  async function fetchUsers() {
    setIsLoading(true)
    try {
      const data = await usersApi.getAll()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) fetchUsers()
  }, [mounted])

  // Only admin can see this page
  const isAdmin = currentUser?.role === 'admin'
  // const isAdmin = true

  // Filter users
  const filtered = users.filter((u) => {
    const name = u.name ?? ''
    const email = u.email ?? ''
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase())
    const matchesRole =
      roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Persist role change to the backend, then refetch so UI matches the DB.
  async function handleRoleChange(userId, newRole) {
    setActioningId(userId)
    try {
      await usersApi.updateRole(userId, newRole)
      await fetchUsers()
    } catch (err) {
      alert(
        err?.response?.data?.message ||
        'Failed to update role. Please try again.'
      )
    } finally {
      setActioningId(null)
      setOpenMenuId(null)
    }
  }

  // Backend toggles active <-> inactive itself and returns the updated row.
  async function handleDeactivate(userId) {
    setActioningId(userId)
    try {
      await usersApi.deactivate(userId)
      await fetchUsers()
    } catch (err) {
      alert(
        err?.response?.data?.message ||
        'Failed to update status. Please try again.'
      )
    } finally {
      setActioningId(null)
      setOpenMenuId(null)
    }
  }

  return (
    <div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Total Members',
            value: users.length,
            color: 'text-slate-800',
          },
          {
            label: 'Active',
            value: users.filter((u) => u.status === 'active').length,
            color: 'text-green-600',
          },
          {
            label: 'Managers',
            value: users.filter((u) => u.role === 'manager').length,
            color: 'text-blue-600',
          },
          {
            label: 'Pending Invites',
            value: users.filter((u) => u.status === 'invited').length,
            color: 'text-amber-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 px-4 py-3"
          >
            <p className={cn('text-2xl font-semibold', stat.color)}>
              {stat.value}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white placeholder:text-slate-400"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-700"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>

        {/* Invite Button — admin only */}
        {isAdmin && (
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
                  Member
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                  Tasks
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                  Joined
                </th>
                {isAdmin && (
                  <th className="px-5 py-3 text-xs font-medium text-slate-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role] ?? User
                const statusConfig =
                  STATUS_CONFIG[member.status] ?? STATUS_CONFIG.inactive
                const StatusIcon = statusConfig.icon
                const isCurrentUser = member.id === currentUser?.id
                const isActioning = actioningId === member.id

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Member */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
                          getAvatarColor(member.name)
                        )}>
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-800">
                              {member.name}
                            </p>
                            {isCurrentUser && (
                              <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <RoleIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-md font-medium',
                          USER_ROLE_COLORS[member.role]
                        )}>
                          {USER_ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-md font-medium',
                          statusConfig.color
                        )}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </td>

                    {/* Tasks */}
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-600">
                        {member.tasksCount}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(member.createdAt)}
                      </span>
                    </td>

                    {/* Actions — admin only */}
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === member.id ? null : member.id
                              )
                            }
                            disabled={isCurrentUser || isActioning}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === member.id && (
                            <div className="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">

                              {/* Change Role */}
                              <p className="px-3 py-1.5 text-xs font-medium text-slate-400">
                                Change Role
                              </p>
                              {['employee', 'manager', 'admin'].map((role) => (
                                <button
                                  key={role}
                                  onClick={() =>
                                    handleRoleChange(member.id, role)
                                  }
                                  disabled={isActioning}
                                  className={cn(
                                    'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50',
                                    member.role === role
                                      ? 'text-violet-600 font-medium'
                                      : 'text-slate-700'
                                  )}
                                >
                                  {member.role === role && (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span className={member.role !== role ? 'ml-5' : ''}>
                                    {USER_ROLE_LABELS[role]}
                                  </span>
                                </button>
                              ))}

                              <div className="border-t border-slate-100 my-1" />

                              {/* Activate / Deactivate */}
                              <button
                                onClick={() => handleDeactivate(member.id)}
                                disabled={isActioning}
                                className={cn(
                                  'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50',
                                  member.status === 'active'
                                    ? 'text-red-500'
                                    : 'text-green-600'
                                )}
                              >
                                {member.status === 'active'
                                  ? 'Deactivate User'
                                  : 'Activate User'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              No members found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try a different search or filter
            </p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            fetchUsers()
          }}
        />
      )}

      {/* Close dropdown on outside click */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenuId(null)}
        />
      )}

    </div>
  )
}

// 'use client'

// import { useState, useEffect } from 'react'
// import {
//   Search, UserPlus, MoreHorizontal,
//   ShieldCheck, Shield, User,
//   CheckCircle2, Clock, XCircle
// } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { InviteUserModal } from './invite-user-modal'
// import { useAuthStore } from '@/store/auth.store'
// import { usersApi } from '@/lib/api/users.api'
// import {
//   USER_ROLE_COLORS, USER_ROLE_LABELS
// } from '@/constants'
// import {
//   getInitials, getAvatarColor,
//   formatDate, cn
// } from '@/utils'


// const ROLE_ICONS = {
//   admin: ShieldCheck,
//   manager: Shield,
//   employee: User,
// }


// const STATUS_CONFIG = {
//   active: {
//     label: 'Active',
//     color: 'bg-green-100 text-green-700',
//     icon: CheckCircle2,
//   },
//   inactive: {
//     label: 'Inactive',
//     color: 'bg-slate-100 text-slate-500',
//     icon: XCircle,
//   },
//   invited: {
//     label: 'Invited',
//     color: 'bg-amber-100 text-amber-700',
//     icon: Clock,
//   },
// }


// export function UsersList() {
//   const { user: currentUser } = useAuthStore()
//   const [search, setSearch] = useState('')
//   const [roleFilter, setRoleFilter] = useState('all')
//   const [showInviteModal, setShowInviteModal] = useState(false)
//   const [mounted, setMounted] = useState(false)
//   const [users, setUsers] = useState([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [openMenuId, setOpenMenuId] = useState(null)

//   useEffect(() => {
//     setMounted(true)
//   }, [])

//   async function fetchUsers() {
//     setIsLoading(true)
//     try {
//       const data = await usersApi.getAll()
//       setUsers(Array.isArray(data) ? data : [])
//     } catch (err) {
//       setUsers([])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     if (mounted) fetchUsers()
//   }, [mounted])

//   // Only admin can see this page
//   const isAdmin = currentUser?.role === 'admin'
//   // const isAdmin = true

//   // Filter users
//   const filtered = users.filter((u) => {
//     const name = u.name ?? ''
//     const email = u.email ?? ''
//     const matchesSearch =
//       name.toLowerCase().includes(search.toLowerCase()) ||
//       email.toLowerCase().includes(search.toLowerCase())
//     const matchesRole =
//       roleFilter === 'all' || u.role === roleFilter
//     return matchesSearch && matchesRole
//   })

//   function handleRoleChange(userId, newRole) {
//     setUsers((prev) =>
//       prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
//     )
//     setOpenMenuId(null)
//   }

//   function handleDeactivate(userId) {
//     setUsers((prev) =>
//       prev.map((u) =>
//         u.id === userId
//           ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
//           : u
//       )
//     )
//     setOpenMenuId(null)
//   }

//   return (
//     <div>

//       {/* Stats Row */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
//         {[
//           {
//             label: 'Total Members',
//             value: users.length,
//             color: 'text-slate-800',
//           },
//           {
//             label: 'Active',
//             value: users.filter((u) => u.status === 'active').length,
//             color: 'text-green-600',
//           },
//           {
//             label: 'Managers',
//             value: users.filter((u) => u.role === 'manager').length,
//             color: 'text-blue-600',
//           },
//           {
//             label: 'Pending Invites',
//             value: users.filter((u) => u.status === 'invited').length,
//             color: 'text-amber-600',
//           },
//         ].map((stat) => (
//           <div
//             key={stat.label}
//             className="bg-white rounded-xl border border-slate-200 px-4 py-3"
//           >
//             <p className={cn('text-2xl font-semibold', stat.color)}>
//               {stat.value}
//             </p>
//             <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
//           </div>
//         ))}
//       </div>

//       {/* Toolbar */}
//       <div className="flex flex-col sm:flex-row gap-3 mb-5">

//         {/* Search */}
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//           <input
//             type="text"
//             placeholder="Search by name or email..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white placeholder:text-slate-400"
//           />
//         </div>

//         {/* Role Filter */}
//         <select
//           value={roleFilter}
//           onChange={(e) => setRoleFilter(e.target.value)}
//           className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-700"
//         >
//           <option value="all">All Roles</option>
//           <option value="admin">Admin</option>
//           <option value="manager">Manager</option>
//           <option value="employee">Employee</option>
//         </select>

//         {/* Invite Button — admin only */}
//         {isAdmin && (
//           <Button
//             onClick={() => setShowInviteModal(true)}
//             className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
//           >
//             <UserPlus className="w-4 h-4 mr-2" />
//             Invite Member
//           </Button>
//         )}
//       </div>

//       {/* Users Table */}
//       <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-slate-100 bg-slate-50">
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
//                   Member
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
//                   Role
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
//                   Status
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
//                   Tasks
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
//                   Joined
//                 </th>
//                 {isAdmin && (
//                   <th className="px-5 py-3 text-xs font-medium text-slate-500">
//                     Actions
//                   </th>
//                 )}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {filtered.map((member) => {
//                 const RoleIcon = ROLE_ICONS[member.role] ?? User
//                 const statusConfig =
//                   STATUS_CONFIG[member.status] ?? STATUS_CONFIG.inactive
//                 const StatusIcon = statusConfig.icon
//                 const isCurrentUser = member.id === currentUser?.id

//                 return (
//                   <tr
//                     key={member.id}
//                     className="hover:bg-slate-50 transition-colors"
//                   >
//                     {/* Member */}
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-3">
//                         <div className={cn(
//                           'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
//                           getAvatarColor(member.name)
//                         )}>
//                           {getInitials(member.name)}
//                         </div>
//                         <div>
//                           <div className="flex items-center gap-1.5">
//                             <p className="text-sm font-medium text-slate-800">
//                               {member.name}
//                             </p>
//                             {isCurrentUser && (
//                               <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-medium">
//                                 You
//                               </span>
//                             )}
//                           </div>
//                           <p className="text-xs text-slate-400">
//                             {member.email}
//                           </p>
//                         </div>
//                       </div>
//                     </td>

//                     {/* Role */}
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-1.5">
//                         <RoleIcon className="w-3.5 h-3.5 text-slate-400" />
//                         <span className={cn(
//                           'text-xs px-2 py-0.5 rounded-md font-medium',
//                           USER_ROLE_COLORS[member.role]
//                         )}>
//                           {USER_ROLE_LABELS[member.role] ?? member.role}
//                         </span>
//                       </div>
//                     </td>

//                     {/* Status */}
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-1.5">
//                         <StatusIcon className="w-3.5 h-3.5 text-slate-400" />
//                         <span className={cn(
//                           'text-xs px-2 py-0.5 rounded-md font-medium',
//                           statusConfig.color
//                         )}>
//                           {statusConfig.label}
//                         </span>
//                       </div>
//                     </td>

//                     {/* Tasks */}
//                     <td className="px-5 py-3">
//                       <span className="text-sm text-slate-600">
//                         {member.tasksCount}
//                       </span>
//                     </td>

//                     {/* Joined */}
//                     <td className="px-5 py-3">
//                       <span className="text-xs text-slate-500 whitespace-nowrap">
//                         {formatDate(member.createdAt)}
//                       </span>
//                     </td>

//                     {/* Actions — admin only */}
//                     {isAdmin && (
//                       <td className="px-5 py-3">
//                         <div className="relative">
//                           <button
//                             onClick={() =>
//                               setOpenMenuId(
//                                 openMenuId === member.id ? null : member.id
//                               )
//                             }
//                             disabled={isCurrentUser}
//                             className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
//                           >
//                             <MoreHorizontal className="w-4 h-4" />
//                           </button>

//                           {/* Dropdown Menu */}
//                           {openMenuId === member.id && (
//                             <div className="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">

//                               {/* Change Role */}
//                               <p className="px-3 py-1.5 text-xs font-medium text-slate-400">
//                                 Change Role
//                               </p>
//                               {['employee', 'manager', 'admin'].map((role) => (
//                                 <button
//                                   key={role}
//                                   onClick={() =>
//                                     handleRoleChange(member.id, role)
//                                   }
//                                   className={cn(
//                                     'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2',
//                                     member.role === role
//                                       ? 'text-violet-600 font-medium'
//                                       : 'text-slate-700'
//                                   )}
//                                 >
//                                   {member.role === role && (
//                                     <CheckCircle2 className="w-3.5 h-3.5" />
//                                   )}
//                                   <span className={member.role !== role ? 'ml-5' : ''}>
//                                     {USER_ROLE_LABELS[role]}
//                                   </span>
//                                 </button>
//                               ))}

//                               <div className="border-t border-slate-100 my-1" />

//                               {/* Activate / Deactivate */}
//                               <button
//                                 onClick={() => handleDeactivate(member.id)}
//                                 className={cn(
//                                   'w-full text-left px-3 py-2 text-sm hover:bg-slate-50',
//                                   member.status === 'active'
//                                     ? 'text-red-500'
//                                     : 'text-green-600'
//                                 )}
//                               >
//                                 {member.status === 'active'
//                                   ? 'Deactivate User'
//                                   : 'Activate User'}
//                               </button>
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                     )}
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Empty state */}
//         {filtered.length === 0 && (
//           <div className="text-center py-16">
//             <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
//               <Search className="w-5 h-5 text-slate-400" />
//             </div>
//             <p className="text-sm font-medium text-slate-600">
//               No members found
//             </p>
//             <p className="text-xs text-slate-400 mt-1">
//               Try a different search or filter
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Invite Modal */}
//       {showInviteModal && (
//         <InviteUserModal
//           onClose={() => setShowInviteModal(false)}
//           onSuccess={() => setShowInviteModal(false)}
//         />
//       )}

//       {/* Close dropdown on outside click */}
//       {openMenuId && (
//         <div
//           className="fixed inset-0 z-0"
//           onClick={() => setOpenMenuId(null)}
//         />
//       )}

//     </div>
//   )
// }


// 'use client'

// import { useState, useEffect } from 'react'
// import {
//   Search, UserPlus, MoreHorizontal,
//   ShieldCheck, Shield, User,
//   CheckCircle2, Clock, XCircle
// } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { InviteUserModal } from './invite-user-modal'
// import { useAuthStore } from '@/store/auth.store'
// import { usersApi } from '@/lib/api/users.api'
// import {
//   USER_ROLE_COLORS, USER_ROLE_LABELS
// } from '@/constants'
// import {
//   getInitials, getAvatarColor,
//   formatDate, cn
// } from '@/utils'


// // Mock users
// const MOCK_USERS = [
//   {
//     id: '1',
//     name: 'Suhail H',
//     email: 'suhail@varadhi.com',
//     role: 'employee',
//     status: 'active',
//     createdAt: '2026-01-15T00:00:00Z',
//     tasksCount: 5,
//   },
//   {
//     id: '2',
//     name: 'Jagdish D',
//     email: 'jagdish@varadhi.com',
//     role: 'manager',
//     status: 'active',
//     createdAt: '2026-01-10T00:00:00Z',
//     tasksCount: 8,
//   },
//   {
//     id: '3',
//     name: 'Arjun R',
//     email: 'arjun@varadhi.com',
//     role: 'employee',
//     status: 'active',
//     createdAt: '2026-02-01T00:00:00Z',
//     tasksCount: 4,
//   },
//   {
//     id: '4',
//     name: 'Priya S',
//     email: 'priya@varadhi.com',
//     role: 'employee',
//     status: 'active',
//     createdAt: '2026-02-10T00:00:00Z',
//     tasksCount: 3,
//   },
//   {
//     id: '5',
//     name: 'Rahul K',
//     email: 'rahul@varadhi.com',
//     role: 'manager',
//     status: 'inactive',
//     createdAt: '2026-01-20T00:00:00Z',
//     tasksCount: 0,
//   },
//   {
//     id: '6',
//     name: 'Divya M',
//     email: 'divya@varadhi.com',
//     role: 'employee',
//     status: 'invited',
//     createdAt: '2026-06-01T00:00:00Z',
//     tasksCount: 0,
//   },
// ]


// const ROLE_ICONS = {
//   admin: ShieldCheck,
//   manager: Shield,
//   employee: User,
// }


// const STATUS_CONFIG = {
//   active: {
//     label: 'Active',
//     color: 'bg-green-100 text-green-700',
//     icon: CheckCircle2,
//   },
//   inactive: {
//     label: 'Inactive',
//     color: 'bg-slate-100 text-slate-500',
//     icon: XCircle,
//   },
//   invited: {
//     label: 'Invited',
//     color: 'bg-amber-100 text-amber-700',
//     icon: Clock,
//   },
// }


// export function UsersList() {
//   const { user: currentUser } = useAuthStore()
//   const [search, setSearch] = useState('')
//   const [roleFilter, setRoleFilter] = useState('all')
//   const [showInviteModal, setShowInviteModal] = useState(false)
//   const [mounted, setMounted] = useState(false)
//   const [users, setUsers] = useState([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [openMenuId, setOpenMenuId] = useState(null)

//   useEffect(() => {
//     setMounted(true)
//   }, [])

//   async function fetchUsers() {
//     setIsLoading(true)
//     try {
//       const data = await usersApi.getAll()
//       setUsers(data)
//     } catch (err) {
//       setUsers([])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     if (mounted) fetchUsers()
//   }, [mounted])

//   // Only admin can see this page
//   const isAdmin = currentUser?.role === 'admin'
//   // const isAdmin = true

//   // Filter users
//   const filtered = users.filter((u) => {
//     const matchesSearch =
//       u.name.toLowerCase().includes(search.toLowerCase()) ||
//       u.email.toLowerCase().includes(search.toLowerCase())
//     const matchesRole =
//       roleFilter === 'all' || u.role === roleFilter
//     return matchesSearch && matchesRole
//   })

//   function handleRoleChange(userId, newRole) {
//     setUsers((prev) =>
//       prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
//     )
//     setOpenMenuId(null)
//   }

//   function handleDeactivate(userId) {
//     setUsers((prev) =>
//       prev.map((u) =>
//         u.id === userId
//           ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
//           : u
//       )
//     )
//     setOpenMenuId(null)
//   }

//   return (
//     <div>

//       {/* Stats Row */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
//         {[
//           {
//             label: 'Total Members',
//             value: users.length,
//             color: 'text-slate-800',
//           },
//           {
//             label: 'Active',
//             value: users.filter((u) => u.status === 'active').length,
//             color: 'text-green-600',
//           },
//           {
//             label: 'Managers',
//             value: users.filter((u) => u.role === 'manager').length,
//             color: 'text-blue-600',
//           },
//           {
//             label: 'Pending Invites',
//             value: users.filter((u) => u.status === 'invited').length,
//             color: 'text-amber-600',
//           },
//         ].map((stat) => (
//           <div
//             key={stat.label}
//             className="bg-white rounded-xl border border-slate-200 px-4 py-3"
//           >
//             <p className={cn('text-2xl font-semibold', stat.color)}>
//               {stat.value}
//             </p>
//             <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
//           </div>
//         ))}
//       </div>

//       {/* Toolbar */}
//       <div className="flex flex-col sm:flex-row gap-3 mb-5">

//         {/* Search */}
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//           <input
//             type="text"
//             placeholder="Search by name or email..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white placeholder:text-slate-400"
//           />
//         </div>

//         {/* Role Filter */}
//         <select
//           value={roleFilter}
//           onChange={(e) => setRoleFilter(e.target.value)}
//           className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-700"
//         >
//           <option value="all">All Roles</option>
//           <option value="admin">Admin</option>
//           <option value="manager">Manager</option>
//           <option value="employee">Employee</option>
//         </select>

//         {/* Invite Button — admin only */}
//         {isAdmin && (
//           <Button
//             onClick={() => setShowInviteModal(true)}
//             className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
//           >
//             <UserPlus className="w-4 h-4 mr-2" />
//             Invite Member
//           </Button>
//         )}
//       </div>

//       {/* Users Table */}
//       <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-slate-100 bg-slate-50">
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
//                   Member
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
//                   Role
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
//                   Status
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
//                   Tasks
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
//                   Joined
//                 </th>
//                 {isAdmin && (
//                   <th className="px-5 py-3 text-xs font-medium text-slate-500">
//                     Actions
//                   </th>
//                 )}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {filtered.map((member) => {
//                 const RoleIcon = ROLE_ICONS[member.role]
//                 const statusConfig = STATUS_CONFIG[member.status]
//                 const StatusIcon = statusConfig.icon
//                 const isCurrentUser = member.id === currentUser?.id

//                 return (
//                   <tr
//                     key={member.id}
//                     className="hover:bg-slate-50 transition-colors"
//                   >
//                     {/* Member */}
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-3">
//                         <div className={cn(
//                           'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
//                           getAvatarColor(member.name)
//                         )}>
//                           {getInitials(member.name)}
//                         </div>
//                         <div>
//                           <div className="flex items-center gap-1.5">
//                             <p className="text-sm font-medium text-slate-800">
//                               {member.name}
//                             </p>
//                             {isCurrentUser && (
//                               <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-medium">
//                                 You
//                               </span>
//                             )}
//                           </div>
//                           <p className="text-xs text-slate-400">
//                             {member.email}
//                           </p>
//                         </div>
//                       </div>
//                     </td>

//                     {/* Role */}
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-1.5">
//                         <RoleIcon className="w-3.5 h-3.5 text-slate-400" />
//                         <span className={cn(
//                           'text-xs px-2 py-0.5 rounded-md font-medium',
//                           USER_ROLE_COLORS[member.role]
//                         )}>
//                           {USER_ROLE_LABELS[member.role]}
//                         </span>
//                       </div>
//                     </td>

//                     {/* Status */}
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-1.5">
//                         <StatusIcon className="w-3.5 h-3.5 text-slate-400" />
//                         <span className={cn(
//                           'text-xs px-2 py-0.5 rounded-md font-medium',
//                           statusConfig.color
//                         )}>
//                           {statusConfig.label}
//                         </span>
//                       </div>
//                     </td>

//                     {/* Tasks */}
//                     <td className="px-5 py-3">
//                       <span className="text-sm text-slate-600">
//                         {member.tasksCount}
//                       </span>
//                     </td>

//                     {/* Joined */}
//                     <td className="px-5 py-3">
//                       <span className="text-xs text-slate-500 whitespace-nowrap">
//                         {formatDate(member.createdAt)}
//                       </span>
//                     </td>

//                     {/* Actions — admin only */}
//                     {isAdmin && (
//                       <td className="px-5 py-3">
//                         <div className="relative">
//                           <button
//                             onClick={() =>
//                               setOpenMenuId(
//                                 openMenuId === member.id ? null : member.id
//                               )
//                             }
//                             disabled={isCurrentUser}
//                             className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
//                           >
//                             <MoreHorizontal className="w-4 h-4" />
//                           </button>

//                           {/* Dropdown Menu */}
//                           {openMenuId === member.id && (
//                             <div className="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">

//                               {/* Change Role */}
//                               <p className="px-3 py-1.5 text-xs font-medium text-slate-400">
//                                 Change Role
//                               </p>
//                               {['employee', 'manager', 'admin'].map((role) => (
//                                 <button
//                                   key={role}
//                                   onClick={() =>
//                                     handleRoleChange(member.id, role)
//                                   }
//                                   className={cn(
//                                     'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2',
//                                     member.role === role
//                                       ? 'text-violet-600 font-medium'
//                                       : 'text-slate-700'
//                                   )}
//                                 >
//                                   {member.role === role && (
//                                     <CheckCircle2 className="w-3.5 h-3.5" />
//                                   )}
//                                   <span className={member.role !== role ? 'ml-5' : ''}>
//                                     {USER_ROLE_LABELS[role]}
//                                   </span>
//                                 </button>
//                               ))}

//                               <div className="border-t border-slate-100 my-1" />

//                               {/* Activate / Deactivate */}
//                               <button
//                                 onClick={() => handleDeactivate(member.id)}
//                                 className={cn(
//                                   'w-full text-left px-3 py-2 text-sm hover:bg-slate-50',
//                                   member.status === 'active'
//                                     ? 'text-red-500'
//                                     : 'text-green-600'
//                                 )}
//                               >
//                                 {member.status === 'active'
//                                   ? 'Deactivate User'
//                                   : 'Activate User'}
//                               </button>
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                     )}
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Empty state */}
//         {filtered.length === 0 && (
//           <div className="text-center py-16">
//             <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
//               <Search className="w-5 h-5 text-slate-400" />
//             </div>
//             <p className="text-sm font-medium text-slate-600">
//               No members found
//             </p>
//             <p className="text-xs text-slate-400 mt-1">
//               Try a different search or filter
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Invite Modal */}
//       {showInviteModal && (
//         <InviteUserModal
//           onClose={() => setShowInviteModal(false)}
//           onSuccess={() => setShowInviteModal(false)}
//         />
//       )}

//       {/* Close dropdown on outside click */}
//       {openMenuId && (
//         <div
//           className="fixed inset-0 z-0"
//           onClick={() => setOpenMenuId(null)}
//         />
//       )}

//     </div>
//   )
// }
// 'use client'

// import { useState } from 'react'
// import {
//   Search, UserPlus, MoreHorizontal,
//   ShieldCheck, Shield, User,
//   CheckCircle2, Clock, XCircle
// } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { InviteUserModal } from './invite-user-modal'
// import { useAuthStore } from '@/store/auth.store'
// import {
//   USER_ROLE_COLORS, USER_ROLE_LABELS
// } from '@/constants'
// import {
//   getInitials, getAvatarColor,
//   formatDate, cn
// } from '@/utils'

// // Mock users
// const MOCK_USERS = [
//   {
//     id: '1',
//     name: 'Suhail H',
//     email: 'suhail@varadhi.com',
//     role: 'employee',
//     status: 'active',
//     createdAt: '2026-01-15T00:00:00Z',
//     tasksCount: 5,
//   },
//   {
//     id: '2',
//     name: 'Jagdish D',
//     email: 'jagdish@varadhi.com',
//     role: 'manager',
//     status: 'active',
//     createdAt: '2026-01-10T00:00:00Z',
//     tasksCount: 8,
//   },
//   {
//     id: '3',
//     name: 'Arjun R',
//     email: 'arjun@varadhi.com',
//     role: 'employee',
//     status: 'active',
//     createdAt: '2026-02-01T00:00:00Z',
//     tasksCount: 4,
//   },
//   {
//     id: '4',
//     name: 'Priya S',
//     email: 'priya@varadhi.com',
//     role: 'employee',
//     status: 'active',
//     createdAt: '2026-02-10T00:00:00Z',
//     tasksCount: 3,
//   },
//   {
//     id: '5',
//     name: 'Rahul K',
//     email: 'rahul@varadhi.com',
//     role: 'manager',
//     status: 'inactive',
//     createdAt: '2026-01-20T00:00:00Z',
//     tasksCount: 0,
//   },
//   {
//     id: '6',
//     name: 'Divya M',
//     email: 'divya@varadhi.com',
//     role: 'employee',
//     status: 'invited',
//     createdAt: '2026-06-01T00:00:00Z',
//     tasksCount: 0,
//   },
// ]

// const ROLE_ICONS = {
//   admin: ShieldCheck,
//   manager: Shield,
//   employee: User,
// }

// const STATUS_CONFIG = {
//   active: {
//     label: 'Active',
//     color: 'bg-green-100 text-green-700',
//     icon: CheckCircle2,
//   },
//   inactive: {
//     label: 'Inactive',
//     color: 'bg-slate-100 text-slate-500',
//     icon: XCircle,
//   },
//   invited: {
//     label: 'Invited',
//     color: 'bg-amber-100 text-amber-700',
//     icon: Clock,
//   },
// }

// export function UsersList() {
//   const { user: currentUser } = useAuthStore()
//   const [search, setSearch] = useState('')
//   const [roleFilter, setRoleFilter] = useState('all')
//   const [showInviteModal, setShowInviteModal] = useState(false)
//   const [users, setUsers] = useState(MOCK_USERS)
//   const [openMenuId, setOpenMenuId] = useState(null)

//   // Only admin can see this page
//   const isAdmin = currentUser?.role === 'admin'
// // const isAdmin = true

//   // Filter users
//   const filtered = users.filter((u) => {
//     const matchesSearch =
//       u.name.toLowerCase().includes(search.toLowerCase()) ||
//       u.email.toLowerCase().includes(search.toLowerCase())
//     const matchesRole =
//       roleFilter === 'all' || u.role === roleFilter
//     return matchesSearch && matchesRole
//   })

//   function handleRoleChange(userId, newRole) {
//     setUsers((prev) =>
//       prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
//     )
//     setOpenMenuId(null)
//   }

//   function handleDeactivate(userId) {
//     setUsers((prev) =>
//       prev.map((u) =>
//         u.id === userId
//           ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
//           : u
//       )
//     )
//     setOpenMenuId(null)
//   }

//   return (
//     <div>

//       {/* Stats Row */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
//         {[
//           {
//             label: 'Total Members',
//             value: users.length,
//             color: 'text-slate-800',
//           },
//           {
//             label: 'Active',
//             value: users.filter((u) => u.status === 'active').length,
//             color: 'text-green-600',
//           },
//           {
//             label: 'Managers',
//             value: users.filter((u) => u.role === 'manager').length,
//             color: 'text-blue-600',
//           },
//           {
//             label: 'Pending Invites',
//             value: users.filter((u) => u.status === 'invited').length,
//             color: 'text-amber-600',
//           },
//         ].map((stat) => (
//           <div
//             key={stat.label}
//             className="bg-white rounded-xl border border-slate-200 px-4 py-3"
//           >
//             <p className={cn('text-2xl font-semibold', stat.color)}>
//               {stat.value}
//             </p>
//             <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
//           </div>
//         ))}
//       </div>

//       {/* Toolbar */}
//       <div className="flex flex-col sm:flex-row gap-3 mb-5">

//         {/* Search */}
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//           <input
//             type="text"
//             placeholder="Search by name or email..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white placeholder:text-slate-400"
//           />
//         </div>

//         {/* Role Filter */}
//         <select
//           value={roleFilter}
//           onChange={(e) => setRoleFilter(e.target.value)}
//           className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-700"
//         >
//           <option value="all">All Roles</option>
//           <option value="admin">Admin</option>
//           <option value="manager">Manager</option>
//           <option value="employee">Employee</option>
//         </select>

//         {/* Invite Button — admin only */}
//         {isAdmin && (
//           <Button
//             onClick={() => setShowInviteModal(true)}
//             className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
//           >
//             <UserPlus className="w-4 h-4 mr-2" />
//             Invite Member
//           </Button>
//         )}
//       </div>

//       {/* Users Table */}
//       <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-slate-100 bg-slate-50">
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
//                   Member
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
//                   Role
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
//                   Status
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
//                   Tasks
//                 </th>
//                 <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
//                   Joined
//                 </th>
//                 {isAdmin && (
//                   <th className="px-5 py-3 text-xs font-medium text-slate-500">
//                     Actions
//                   </th>
//                 )}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {filtered.map((member) => {
//                 const RoleIcon = ROLE_ICONS[member.role]
//                 const statusConfig = STATUS_CONFIG[member.status]
//                 const StatusIcon = statusConfig.icon
//                 const isCurrentUser = member.id === currentUser?.id

//                 return (
//                   <tr
//                     key={member.id}
//                     className="hover:bg-slate-50 transition-colors"
//                   >
//                     {/* Member */}
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-3">
//                         <div className={cn(
//                           'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
//                           getAvatarColor(member.name)
//                         )}>
//                           {getInitials(member.name)}
//                         </div>
//                         <div>
//                           <div className="flex items-center gap-1.5">
//                             <p className="text-sm font-medium text-slate-800">
//                               {member.name}
//                             </p>
//                             {isCurrentUser && (
//                               <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-medium">
//                                 You
//                               </span>
//                             )}
//                           </div>
//                           <p className="text-xs text-slate-400">
//                             {member.email}
//                           </p>
//                         </div>
//                       </div>
//                     </td>

//                     {/* Role */}
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-1.5">
//                         <RoleIcon className="w-3.5 h-3.5 text-slate-400" />
//                         <span className={cn(
//                           'text-xs px-2 py-0.5 rounded-md font-medium',
//                           USER_ROLE_COLORS[member.role]
//                         )}>
//                           {USER_ROLE_LABELS[member.role]}
//                         </span>
//                       </div>
//                     </td>

//                     {/* Status */}
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-1.5">
//                         <StatusIcon className="w-3.5 h-3.5 text-slate-400" />
//                         <span className={cn(
//                           'text-xs px-2 py-0.5 rounded-md font-medium',
//                           statusConfig.color
//                         )}>
//                           {statusConfig.label}
//                         </span>
//                       </div>
//                     </td>

//                     {/* Tasks */}
//                     <td className="px-5 py-3">
//                       <span className="text-sm text-slate-600">
//                         {member.tasksCount}
//                       </span>
//                     </td>

//                     {/* Joined */}
//                     <td className="px-5 py-3">
//                       <span className="text-xs text-slate-500 whitespace-nowrap">
//                         {formatDate(member.createdAt)}
//                       </span>
//                     </td>

//                     {/* Actions — admin only */}
//                     {isAdmin && (
//                       <td className="px-5 py-3">
//                         <div className="relative">
//                           <button
//                             onClick={() =>
//                               setOpenMenuId(
//                                 openMenuId === member.id ? null : member.id
//                               )
//                             }
//                             disabled={isCurrentUser}
//                             className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
//                           >
//                             <MoreHorizontal className="w-4 h-4" />
//                           </button>

//                           {/* Dropdown Menu */}
//                           {openMenuId === member.id && (
//                             <div className="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">

//                               {/* Change Role */}
//                               <p className="px-3 py-1.5 text-xs font-medium text-slate-400">
//                                 Change Role
//                               </p>
//                               {['employee', 'manager', 'admin'].map((role) => (
//                                 <button
//                                   key={role}
//                                   onClick={() =>
//                                     handleRoleChange(member.id, role)
//                                   }
//                                   className={cn(
//                                     'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2',
//                                     member.role === role
//                                       ? 'text-violet-600 font-medium'
//                                       : 'text-slate-700'
//                                   )}
//                                 >
//                                   {member.role === role && (
//                                     <CheckCircle2 className="w-3.5 h-3.5" />
//                                   )}
//                                   <span className={member.role !== role ? 'ml-5' : ''}>
//                                     {USER_ROLE_LABELS[role]}
//                                   </span>
//                                 </button>
//                               ))}

//                               <div className="border-t border-slate-100 my-1" />

//                               {/* Activate / Deactivate */}
//                               <button
//                                 onClick={() => handleDeactivate(member.id)}
//                                 className={cn(
//                                   'w-full text-left px-3 py-2 text-sm hover:bg-slate-50',
//                                   member.status === 'active'
//                                     ? 'text-red-500'
//                                     : 'text-green-600'
//                                 )}
//                               >
//                                 {member.status === 'active'
//                                   ? 'Deactivate User'
//                                   : 'Activate User'}
//                               </button>
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                     )}
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Empty state */}
//         {filtered.length === 0 && (
//           <div className="text-center py-16">
//             <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
//               <Search className="w-5 h-5 text-slate-400" />
//             </div>
//             <p className="text-sm font-medium text-slate-600">
//               No members found
//             </p>
//             <p className="text-xs text-slate-400 mt-1">
//               Try a different search or filter
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Invite Modal */}
//       {showInviteModal && (
//         <InviteUserModal
//           onClose={() => setShowInviteModal(false)}
//           onSuccess={() => setShowInviteModal(false)}
//         />
//       )}

//       {/* Close dropdown on outside click */}
//       {openMenuId && (
//         <div
//           className="fixed inset-0 z-0"
//           onClick={() => setOpenMenuId(null)}
//         />
//       )}

//     </div>
//   )
// }