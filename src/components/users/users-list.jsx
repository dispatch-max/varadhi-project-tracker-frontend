'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

import {
  Search,
  UserPlus,
  MoreHorizontal,
  ShieldCheck,
  Shield,
  User,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InviteUserModal } from './invite-user-modal'

import { useAuthStore } from '@/store/auth.store'
import { usersApi } from '@/lib/api/users.api'

import {
  USER_ROLE_COLORS,
  USER_ROLE_LABELS,
} from '@/constants'

import {
  getInitials,
  getAvatarColor,
  formatDate,
  cn,
} from '@/utils'

/* =========================================================
   ROLE ICONS
========================================================= */

const ROLE_ICONS = {
  admin: ShieldCheck,
  manager: Shield,
  employee: User,
}

/* =========================================================
   STATUS CONFIG
========================================================= */

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },

  inactive: {
    label: 'Inactive',
    color: 'bg-slate-100 text-muted-foreground',
    icon: XCircle,
  },

  invited: {
    label: 'Invited',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
}

/* =========================================================
   USERS LIST
========================================================= */

export function UsersList() {
  const { user: currentUser } = useAuthStore()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState('')

  const [roleFilter, setRoleFilter] = useState(
    searchParams.get('role') || 'all'
  )

  const statusFilter =
    searchParams.get('status') || ''

  const [showInviteModal, setShowInviteModal] =
    useState(false)

  const [mounted, setMounted] =
    useState(false)

  const [users, setUsers] =
    useState([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [openMenuId, setOpenMenuId] =
    useState(null)

  const [actioningId, setActioningId] =
    useState(null)

  /* =======================================================
     MOUNT
  ======================================================= */

  useEffect(() => {
    setMounted(true)
  }, [])

  /* =======================================================
     FETCH USERS
  ======================================================= */

  async function fetchUsers() {
    setIsLoading(true)

    try {
      const data =
        await usersApi.getAll()

      setUsers(
        Array.isArray(data)
          ? data
          : []
      )
    } catch {
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (mounted) {
      fetchUsers()
    }
  }, [mounted])

  /* =======================================================
     ADMIN CHECK
  ======================================================= */

  const isAdmin =
    currentUser?.role === 'admin'

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filtered =
    users.filter((u) => {
      const name =
        u.name ?? ''

      const email =
        u.email ?? ''

      const matchesSearch =
        name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        email
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )

      const matchesRole =
        roleFilter === 'all' ||
        u.role === roleFilter

      const matchesStatus =
        !statusFilter ||
        u.status === statusFilter

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      )
    })

  /* =======================================================
     ROLE CHANGE
  ======================================================= */

  async function handleRoleChange(
    userId,
    newRole
  ) {
    setActioningId(userId)

    try {
      await usersApi.updateRole(
        userId,
        newRole
      )

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

  /* =======================================================
     ACTIVATE / DEACTIVATE
  ======================================================= */

  async function handleDeactivate(
    userId
  ) {
    setActioningId(userId)

    try {
      await usersApi.deactivate(
        userId
      )

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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        w-full
        min-w-0
        flex-col
        overflow-hidden
      "
    >
      {/* ===================================================
          COMPACT STATS ROW
      ==================================================== */}

      <div
        className="
          mb-3
          grid
          grid-cols-2
          gap-2.5
          shrink-0
          lg:grid-cols-4
        "
      >
        {[
          {
            label: 'Total Members',
            value: users.length,
            color: 'text-foreground',
          },
          {
            label: 'Active',
            value:
              users.filter(
                (u) =>
                  u.status === 'active'
              ).length,
            color: 'text-green-600',
          },
          {
            label: 'Managers',
            value:
              users.filter(
                (u) =>
                  u.role === 'manager'
              ).length,
            color: 'text-blue-600',
          },
          {
            label: 'Pending Invites',
            value:
              users.filter(
                (u) =>
                  u.status === 'invited'
              ).length,
            color: 'text-amber-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="
              min-w-0
              rounded-xl
              border
              border-slate-100
              bg-card
              px-4
              py-3
              shadow-sm
              transition
              hover:shadow-md
            "
          >
            <p
              className={cn(
                `
                  text-[18px]
                  font-semibold
                  leading-none
                `,
                stat.color
              )}
            >
              {stat.value}
            </p>

            <p
              className="
                mt-1
                truncate
                text-[10px]
                text-slate-400
              "
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ===================================================
          COMPACT TOOLBAR
      ==================================================== */}

      <div
        className="
          mb-3
          flex
          h-[36px]
          shrink-0
          items-center
          gap-2
        "
      >
        {/* SEARCH */}

        <div
          className="
            relative
            h-full
            min-w-0
            flex-1
          "
        >
          <Search
            className="
              absolute
              left-3
              top-1/2
              h-3.5
              w-3.5
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="
              h-full
              w-full
              rounded-lg
              border
              border-border
              bg-card
              pl-9
              pr-3
              text-[11px]
              outline-none
              placeholder:text-slate-400
              focus:ring-2
              focus:ring-violet-500
            "
          />
        </div>

        {/* =================================================
            ALL ROLES SCROLL
        ================================================== */}

        <div
          className="
            role-scroll
            h-[32px]
            w-[105px]
            shrink-0
            overflow-y-scroll
            overflow-x-hidden
            rounded-lg
            border
            border-slate-200
            bg-white
            p-[3px]
          "
        >
          {[
            {
              value: 'all',
              label: 'All Roles',
            },
            {
              value: 'admin',
              label: 'Admin',
            },
            {
              value: 'manager',
              label: 'Manager',
            },
            {
              value: 'employee',
              label: 'Employee',
            },
          ].map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() =>
                setRoleFilter(
                  role.value
                )
              }
              className={`
                block
                h-[24px]
                w-[88px]
                shrink-0
                rounded-md
                px-2
                text-left
                text-[10px]
                font-semibold
                leading-[24px]

                ${
                  roleFilter === role.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* INVITE */}

        {isAdmin && (
          <Button
            onClick={() =>
              setShowInviteModal(true)
            }
            className="
              h-[32px]
              shrink-0
              gap-1.5
              rounded-lg
              bg-violet-600
              px-3
              text-[10px]
              font-semibold
              text-white
              hover:bg-violet-700
            "
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite Member
          </Button>
        )}
      </div>

      {/* ===================================================
          USERS TABLE
      ==================================================== */}

      <div
        className="
          min-h-0
          w-full
          min-w-0
          flex-1
          overflow-hidden
          rounded-xl
          border
          border-border
          bg-card
        "
      >
        <div
          className="
            h-full
            w-full
            min-w-0
            overflow-hidden
          "
        >
          <table className="w-full table-fixed">

            {/* HEADER */}

            <thead>
              <tr
                className="
                  h-[34px]
                  border-b
                  border-slate-100
                  bg-background
                "
              >
                <th className="w-[39%] px-3 text-left text-[10px] font-medium text-muted-foreground">
                  Member
                </th>

                <th className="w-[18%] px-3 text-left text-[10px] font-medium text-muted-foreground">
                  Role
                </th>

                <th className="w-[16%] px-3 text-left text-[10px] font-medium text-muted-foreground">
                  Status
                </th>

                <th className="w-[8%] px-3 text-left text-[10px] font-medium text-muted-foreground">
                  Tasks
                </th>

                <th className="w-[10%] px-3 text-left text-[10px] font-medium text-muted-foreground">
                  Joined
                </th>

                {isAdmin && (
                  <th className="w-[9%] px-3 text-center text-[10px] font-medium text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* BODY */}

            <tbody className="divide-y divide-slate-100">
              {filtered.map((member) => {
                const RoleIcon =
                  ROLE_ICONS[
                    member.role
                  ] ?? User

                const statusConfig =
                  STATUS_CONFIG[
                    member.status
                  ] ??
                  STATUS_CONFIG.inactive

                const StatusIcon =
                  statusConfig.icon

                const isCurrentUser =
                  member.id ===
                  currentUser?.id

                const isActioning =
                  actioningId ===
                  member.id

                return (
                  <tr
                    key={member.id}
                    className="
                      h-[48px]
                      transition-colors
                      hover:bg-background
                    "
                  >
                    {/* MEMBER */}

                    <td className="px-3 py-1">
                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-2
                        "
                      >
                        <div
                          className={cn(
                            `
                              flex
                              h-7
                              w-7
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              text-[9px]
                              font-semibold
                              text-white
                            `,
                            getAvatarColor(
                              member.name
                            )
                          )}
                        >
                          {getInitials(
                            member.name
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-1">
                            <p
                              className="
                                truncate
                                text-[11px]
                                font-semibold
                                leading-[14px]
                                text-foreground
                              "
                            >
                              {member.name}
                            </p>

                            {isCurrentUser && (
                              <span
                                className="
                                  shrink-0
                                  rounded
                                  bg-violet-100
                                  px-1
                                  py-0.5
                                  text-[8px]
                                  font-medium
                                  text-violet-600
                                "
                              >
                                You
                              </span>
                            )}
                          </div>

                          <p
                            className="
                              mt-0.5
                              truncate
                              text-[9px]
                              leading-[11px]
                              text-slate-400
                            "
                          >
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}

                    <td className="px-3 py-1">
                      <div className="flex items-center gap-1">
                        <RoleIcon className="h-3 w-3 shrink-0 text-slate-400" />

                        <span
                          className={cn(
                            `
                              inline-flex
                              whitespace-nowrap
                              rounded-md
                              px-1.5
                              py-0.5
                              text-[9px]
                              font-medium
                            `,
                            USER_ROLE_COLORS[
                              member.role
                            ]
                          )}
                        >
                          {USER_ROLE_LABELS[
                            member.role
                          ] ??
                            member.role}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-3 py-1">
                      <div className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3 shrink-0 text-slate-400" />

                        <span
                          className={cn(
                            `
                              inline-flex
                              whitespace-nowrap
                              rounded-md
                              px-1.5
                              py-0.5
                              text-[9px]
                              font-medium
                            `,
                            statusConfig.color
                          )}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    </td>

                    {/* TASKS */}

                    <td className="px-3 py-1">
                      <span className="text-[10px] text-muted-foreground">
                        {member.tasksCount ??
                          '—'}
                      </span>
                    </td>

                    {/* JOINED */}

                    <td className="px-3 py-1">
                      <span
                        className="
                          whitespace-nowrap
                          text-[9px]
                          text-muted-foreground
                        "
                      >
                        {formatDate(
                          member.createdAt
                        )}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    {isAdmin && (
                      <td className="px-3 py-1 text-center">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId ===
                                  member.id
                                  ? null
                                  : member.id
                              )
                            }
                            disabled={
                              isCurrentUser ||
                              isActioning
                            }
                            className="
                              rounded-md
                              p-1
                              text-slate-400
                              transition
                              hover:bg-slate-100
                              hover:text-muted-foreground
                              disabled:cursor-not-allowed
                              disabled:opacity-30
                            "
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>

                          {/* DROPDOWN */}

                          {openMenuId ===
                            member.id && (
                            <div
                              className="
                                absolute
                                right-0
                                top-7
                                z-20
                                w-40
                                rounded-lg
                                border
                                border-border
                                bg-card
                                py-1
                                text-left
                                shadow-lg
                              "
                            >
                              <p
                                className="
                                  px-3
                                  py-1
                                  text-[9px]
                                  font-medium
                                  text-slate-400
                                "
                              >
                                Change Role
                              </p>

                              {[
                                'employee',
                                'manager',
                                'admin',
                              ].map(
                                (role) => (
                                  <button
                                    key={role}
                                    type="button"
                                    onClick={() =>
                                      handleRoleChange(
                                        member.id,
                                        role
                                      )
                                    }
                                    disabled={
                                      isActioning
                                    }
                                    className={cn(
                                      `
                                        flex
                                        w-full
                                        items-center
                                        gap-1.5
                                        px-3
                                        py-1.5
                                        text-[10px]
                                        hover:bg-background
                                        disabled:opacity-50
                                      `,
                                      member.role ===
                                        role
                                        ? 'font-medium text-violet-600'
                                        : 'text-foreground'
                                    )}
                                  >
                                    {member.role ===
                                      role && (
                                      <CheckCircle2 className="h-3 w-3" />
                                    )}

                                    <span
                                      className={
                                        member.role !==
                                        role
                                          ? 'ml-[18px]'
                                          : ''
                                      }
                                    >
                                      {
                                        USER_ROLE_LABELS[
                                          role
                                        ]
                                      }
                                    </span>
                                  </button>
                                )
                              )}

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeactivate(
                                    member.id
                                  )
                                }
                                disabled={
                                  isActioning
                                }
                                className={cn(
                                  `
                                    w-full
                                    px-3
                                    py-1.5
                                    text-left
                                    text-[10px]
                                    hover:bg-background
                                    disabled:opacity-50
                                  `,
                                  member.status ===
                                    'active'
                                    ? 'text-red-500'
                                    : 'text-green-600'
                                )}
                              >
                                {member.status ===
                                'active'
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

          {/* =================================================
              EMPTY STATE
          ================================================== */}

          {!isLoading &&
            filtered.length === 0 && (
              <div className="py-8 text-center">
                <div
                  className="
                    mx-auto
                    mb-2
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    bg-slate-100
                  "
                >
                  <Search className="h-4 w-4 text-slate-400" />
                </div>

                <p className="text-xs font-medium text-muted-foreground">
                  No members found
                </p>

                <p className="mt-1 text-[9px] text-slate-400">
                  Try a different search or filter
                </p>
              </div>
            )}
        </div>
      </div>

      {/* ===================================================
          INVITE MODAL
      ==================================================== */}

      {showInviteModal && (
        <InviteUserModal
          onClose={() =>
            setShowInviteModal(false)
          }
          onSuccess={() => {
            setShowInviteModal(false)
            fetchUsers()
          }}
        />
      )}

      {/* ===================================================
          OUTSIDE MENU CLOSE
      ==================================================== */}

      {openMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() =>
            setOpenMenuId(null)
          }
        />
      )}
    </div>
  )
}