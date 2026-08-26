'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { TaskTabs } from './task-tabs'
import { Button } from '@/components/ui/button'
import { CreateTaskModal } from './create-task-modal'

import {
  StatusBadge,
  PriorityBadge,
  TypeBadge,
} from './task-badge'

import { useAuthStore } from '@/store/auth.store'
import { tasksApi } from '@/lib/api/tasks.api'

import {
  formatDate,
  isOverdue,
  getInitials,
  getAvatarColor,
  cn,
} from '@/utils'

import { useHasMounted } from '@/hooks/use-has-mounted'

/* =========================================================
   LOADING ROW
========================================================= */

function TaskRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-3 py-1.5">
        <div className="h-2.5 w-40 rounded bg-slate-100" />
      </td>

      <td className="px-3 py-1.5">
        <div className="h-2.5 w-20 rounded bg-slate-100" />
      </td>

      <td className="px-3 py-1.5">
        <div className="h-4 w-14 rounded bg-slate-100" />
      </td>

      <td className="px-3 py-1.5">
        <div className="h-4 w-14 rounded bg-slate-100" />
      </td>

      <td className="px-3 py-1.5">
        <div className="h-4 w-16 rounded bg-slate-100" />
      </td>

      <td className="px-3 py-1.5">
        <div className="h-4 w-14 rounded bg-slate-100" />
      </td>

      <td className="px-3 py-1.5">
        <div className="h-2.5 w-14 rounded bg-slate-100" />
      </td>

      <td className="px-3 py-1.5" />
    </tr>
  )
}

/* =========================================================
   TASK ACTIONS MENU
========================================================= */

function TaskActionsMenu({
  task,
  onDeleted,
  onEdit,
  openUp = false,
}) {
  const router = useRouter()
  const { user } = useAuthStore()

  const canManageTask =
    user?.role === 'admin' ||
    user?.role === 'manager'

  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function handleView() {
    setOpen(false)
    router.push(`/tasks/${task.id}`)
  }

  function handleEdit() {
    setOpen(false)

    if (onEdit) {
      onEdit(task)
    } else {
      router.push(`/tasks/${task.id}?edit=true`)
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${task.title}"? This can't be undone.`
      )
    ) {
      setOpen(false)
      return
    }

    setIsDeleting(true)

    try {
      await tasksApi.delete(task.id)

      setOpen(false)
      onDeleted?.()
    } catch {
      window.alert(
        'Failed to delete the task. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="Task actions"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((value) => !value)
        }}
        className="
          rounded
          p-0.5
          text-slate-400
          transition
          hover:bg-slate-100
          hover:text-muted-foreground
        "
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpen(false)
            }}
          />

          <div
            className={cn(
              `
                absolute
                right-0
                z-[9999]
                w-40
                rounded-lg
                border
                border-border
                bg-card
                py-1
                shadow-lg
              `,
              openUp
                ? 'bottom-full mb-2'
                : 'top-full mt-2'
            )}
          >
            <button
              type="button"
              onClick={handleView}
              className="
                flex
                w-full
                items-center
                gap-2
                px-3
                py-1.5
                text-left
                text-xs
                text-foreground
                hover:bg-background
              "
            >
              <Eye className="h-3 w-3 text-slate-400" />
              View Task
            </button>

            <button
              type="button"
              onClick={handleEdit}
              className="
                flex
                w-full
                items-center
                gap-2
                px-3
                py-1.5
                text-left
                text-xs
                text-foreground
                hover:bg-background
              "
            >
              <Pencil className="h-3 w-3 text-slate-400" />
              Edit Task
            </button>

            {canManageTask && (
              <>
                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={cn(
                    `
                      flex
                      w-full
                      items-center
                      gap-2
                      px-3
                      py-1.5
                      text-left
                      text-xs
                      text-red-500
                      hover:bg-red-50
                    `,
                    isDeleting &&
                      'cursor-not-allowed opacity-50'
                  )}
                >
                  <Trash2 className="h-3 w-3" />

                  {isDeleting
                    ? 'Deleting…'
                    : 'Delete Task'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* =========================================================
   TASKS LIST
========================================================= */

export function TasksList() {
  const { user } = useAuthStore()
  const mounted = useHasMounted()
  const searchParams = useSearchParams()

  const canCreateTask =
    mounted &&
    ['admin', 'manager'].includes(user?.role)

  /* =======================================================
     STATE
  ======================================================= */

  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState(
    searchParams.get('search') || ''
  )

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [priorityFilter, setPriorityFilter] =
    useState('all')

  const [scope, setScope] =
    useState('all')

  const [showCreateModal, setShowCreateModal] =
    useState(false)

  /* =======================================================
     PAGINATION
  ======================================================= */

  const TASKS_PER_PAGE = 10

  const [currentPage, setCurrentPage] =
    useState(1)

  const [totalTasks, setTotalTasks] =
    useState(0)

  const [totalPages, setTotalPages] =
    useState(1)

  /* =======================================================
     TOPBAR SEARCH
  ======================================================= */

  useEffect(() => {
    setSearch(
      searchParams.get('search') || ''
    )

    setCurrentPage(1)
  }, [searchParams])

  /* =======================================================
     FETCH TASKS
  ======================================================= */

  async function fetchTasks() {
    setIsLoading(true)
    setError(null)

    try {
      const filters = {}

      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }

      if (priorityFilter !== 'all') {
        filters.priority = priorityFilter
      }

      if (search) {
        filters.search = search
      }

      if (
        scope === 'mine' &&
        user?.id
      ) {
        filters.assigneeId = user.id
      }

      const response =
        await tasksApi.getAll(
          filters,
          currentPage,
          TASKS_PER_PAGE
        )

      let list = []

      if (Array.isArray(response)) {
        list = response
      } else if (
        Array.isArray(response?.tasks)
      ) {
        list = response.tasks
      } else if (
        Array.isArray(response?.data)
      ) {
        list = response.data
      } else if (
        Array.isArray(response?.rows)
      ) {
        list = response.rows
      } else if (
        Array.isArray(response?.items)
      ) {
        list = response.items
      }

      setTasks(list)

      const total =
        response?.total ??
        response?.totalCount ??
        response?.count ??
        response?.pagination?.total ??
        response?.pagination?.totalCount ??
        response?.meta?.total ??
        response?.meta?.totalCount ??
        list.length

      setTotalTasks(total)

      const pagesFromApi =
        response?.totalPages ??
        response?.pagination?.totalPages ??
        response?.pagination?.pages ??
        response?.meta?.totalPages ??
        response?.meta?.pages

      const calculatedPages =
        Math.ceil(
          total / TASKS_PER_PAGE
        )

      setTotalPages(
        Math.max(
          1,
          Number(
            pagesFromApi ??
              calculatedPages
          ) || 1
        )
      )
    } catch (err) {
      console.error(
        'Failed to fetch tasks:',
        err
      )

      setError(
        'Failed to load tasks.'
      )

      setTasks([])
      setTotalTasks(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  /* =======================================================
     FETCH ON CHANGE
  ======================================================= */

  useEffect(() => {
    const timer =
      setTimeout(
        fetchTasks,
        300
      )

    return () =>
      clearTimeout(timer)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    search,
    statusFilter,
    priorityFilter,
    scope,
    user?.id,
  ])

  /* =======================================================
     CURRENT PAGE DATA
  ======================================================= */

  const currentTasks = tasks

  const showingStart =
    totalTasks === 0 ||
    currentTasks.length === 0
      ? 0
      : (currentPage - 1) *
          TASKS_PER_PAGE +
        1

  const showingEnd =
    totalTasks === 0 ||
    currentTasks.length === 0
      ? 0
      : Math.min(
          showingStart +
            currentTasks.length -
            1,
          totalTasks
        )

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="w-full min-w-0">

      {/* ===================================================
          TOP CONTROLS
      ==================================================== */}

      <div
        className="
          mb-2
          flex
          h-[44px]
          w-full
          min-w-0
          items-center
          gap-2
          overflow-hidden
          rounded-xl
          border
          border-border
          bg-card
          px-3
          shadow-sm
        "
      >
        {/* TABS */}

        <TaskTabs
          active={scope}
          onChange={(next) => {
            setScope(next)
            setCurrentPage(1)
          }}
        />

        {/* FLEX SPACE */}

        <div className="min-w-0 flex-1" />

        {/* RIGHT CONTROLS */}

        <div
          className="
            ml-auto
            flex
            shrink-0
            items-center
            gap-1.5
          "
        >
          {/* STATUS FILTER */}

          <div
            className="
              custom-scrollbar
              h-[30px]
              w-[105px]
              shrink-0
              overflow-y-auto
              overflow-x-hidden
              rounded-lg
              border
              border-slate-200
              bg-white
              p-1
            "
          >
            <div className="flex flex-col gap-1">
              {[
                {
                  value: 'all',
                  label: 'All Status',
                },
                {
                  value: 'todo',
                  label: 'To Do',
                },
                {
                  value: 'in_progress',
                  label: 'In Progress',
                },
                {
                  value: 'in_review',
                  label: 'In Review',
                },
                {
                  value: 'completed',
                  label: 'Completed',
                },
              ].map((status) => (
                <button
                  type="button"
                  key={status.value}
                  onClick={() => {
                    setStatusFilter(
                      status.value
                    )

                    setCurrentPage(1)
                  }}
                  className={cn(
                    `
                      w-full
                      shrink-0
                      rounded-md
                      px-2
                      py-1
                      text-left
                      text-[9px]
                      font-medium
                      leading-[12px]
                      transition-colors
                    `,
                    statusFilter ===
                      status.value
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRIORITY FILTER */}

          <div
            className="
              custom-scrollbar
              h-[30px]
              w-[105px]
              shrink-0
              overflow-y-auto
              overflow-x-hidden
              rounded-lg
              border
              border-slate-200
              bg-white
              p-1
            "
          >
            <div className="flex flex-col gap-1">
              {[
                {
                  value: 'all',
                  label: 'All Priority',
                },
                {
                  value: 'low',
                  label: 'Low',
                },
                {
                  value: 'medium',
                  label: 'Medium',
                },
                {
                  value: 'high',
                  label: 'High',
                },
                {
                  value: 'critical',
                  label: 'Critical',
                },
              ].map((priority) => (
                <button
                  type="button"
                  key={priority.value}
                  onClick={() => {
                    setPriorityFilter(
                      priority.value
                    )

                    setCurrentPage(1)
                  }}
                  className={cn(
                    `
                      w-full
                      shrink-0
                      rounded-md
                      px-2
                      py-1
                      text-left
                      text-[9px]
                      font-medium
                      leading-[12px]
                      transition-colors
                    `,
                    priorityFilter ===
                      priority.value
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* NEW TASK */}

          {canCreateTask && (
            <Button
              type="button"
              onClick={() =>
                setShowCreateModal(true)
              }
              className="
                h-[30px]
                shrink-0
                gap-1
                rounded-lg
                bg-violet-600
                px-2.5
                text-[9px]
                font-semibold
                text-white
                hover:bg-violet-700
              "
            >
              <Plus className="h-3 w-3" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* ===================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          className="
            mb-2
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-3
            py-2
            text-xs
            text-red-600
          "
        >
          {error} —{' '}

          <button
            type="button"
            onClick={fetchTasks}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ===================================================
          RESULT COUNT
      ==================================================== */}

      {!isLoading && (
        <p
          className="
            mb-1.5
            text-[10px]
            text-slate-400
          "
        >
          Showing {showingStart}-{showingEnd} of{' '}
          {totalTasks} tasks
        </p>
      )}

      {/* ===================================================
          TABLE CARD
      ==================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-xl
          border
          border-border
          bg-card
        "
      >
        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
          "
        >
          <table className="w-full min-w-[860px]">

            {/* =================================================
                HEADER
            ================================================== */}

            <thead>
              <tr
                className="
                  border-b
                  border-slate-100
                  bg-background
                "
              >
                <th className="w-full px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                  Task
                </th>

                <th className="whitespace-nowrap px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                  Project
                </th>

                <th className="whitespace-nowrap px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                  Type
                </th>

                <th className="whitespace-nowrap px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                  Priority
                </th>

                <th className="whitespace-nowrap px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                  Status
                </th>

                <th className="whitespace-nowrap px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                  Assignee
                </th>

                <th className="whitespace-nowrap px-3 py-1.5 text-left text-[10px] font-medium text-muted-foreground">
                  Due Date
                </th>

                <th className="px-3 py-1.5" />
              </tr>
            </thead>

            {/* =================================================
                BODY
            ================================================== */}

            <tbody className="divide-y divide-slate-100">

              {isLoading ? (
                Array.from({
                  length: 5,
                }).map((_, index) => (
                  <TaskRowSkeleton
                    key={index}
                  />
                ))
              ) : currentTasks.length > 0 ? (
                currentTasks.map(
                  (task, index) => {
                    const overdue =
                      task.dueDate &&
                      task.status !==
                        'completed' &&
                      isOverdue(
                        task.dueDate
                      )

                    return (
                      <tr
                        key={task.id}
                        className="
                          transition-colors
                          hover:bg-background
                        "
                      >
                        {/* TASK */}

                        <td className="px-3 py-1.5">
                          <p
                            className="
                              max-w-sm
                              truncate
                              text-[11px]
                              font-semibold
                              text-foreground
                            "
                          >
                            {task.title}
                          </p>
                        </td>

                        {/* PROJECT */}

                        <td className="px-3 py-1.5">
                          <span
                            className="
                              whitespace-nowrap
                              text-[10px]
                              text-muted-foreground
                            "
                          >
                            {task.project?.name || '—'}
                          </span>
                        </td>

                        {/* TYPE */}

                        <td className="px-3 py-1.5">
                          <TypeBadge
                            type={task.type}
                          />
                        </td>

                        {/* PRIORITY */}

                        <td className="px-3 py-1.5">
                          <PriorityBadge
                            priority={task.priority}
                          />
                        </td>

                        {/* STATUS */}

                        <td className="px-3 py-1.5">
                          <StatusBadge
                            status={task.status}
                          />
                        </td>

                        {/* ASSIGNEE */}

                        <td className="px-3 py-1.5">
                          {task.assignee ? (
                            <div
                              className="
                                flex
                                min-w-0
                                items-center
                                gap-1.5
                              "
                            >
                              <div
                                className={cn(
                                  `
                                    flex
                                    h-5
                                    w-5
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    text-[9px]
                                    font-semibold
                                    text-white
                                  `,
                                  getAvatarColor(
                                    task.assignee.name
                                  )
                                )}
                              >
                                {getInitials(
                                  task.assignee.name
                                )}
                              </div>

                              <span
                                className="
                                  max-w-[90px]
                                  truncate
                                  whitespace-nowrap
                                  text-[10px]
                                  text-muted-foreground
                                "
                              >
                                {task.assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* DUE DATE */}

                        <td className="px-3 py-1.5">
                          {task.dueDate ? (
                            <div
                              className={cn(
                                `
                                  flex
                                  items-center
                                  gap-1
                                  whitespace-nowrap
                                  text-[10px]
                                `,
                                overdue
                                  ? 'text-red-500'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {overdue && (
                                <AlertTriangle className="h-2.5 w-2.5" />
                              )}

                              <Calendar className="h-2.5 w-2.5" />

                              {formatDate(
                                task.dueDate,
                                'MMM dd'
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              —
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-3 py-1.5">
                          <TaskActionsMenu
                            task={task}
                            onDeleted={
                              fetchTasks
                            }
                            openUp={
                              index >=
                              currentTasks.length -
                                2
                            }
                          />
                        </td>
                      </tr>
                    )
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center"
                  >
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
                      No tasks found
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                      Try changing your filters or create a new task
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =================================================
            PAGINATION
        ================================================== */}

        {!isLoading && totalTasks > 0 && (
          <div
            className="
              flex
              w-full
              min-w-0
              items-center
              border-t
              border-border
              bg-white
              px-3
              py-1.5
            "
          >
            <p
              className="
                min-w-0
                flex-1
                truncate
                text-[10px]
                text-muted-foreground
              "
            >
              Showing {showingStart} to{' '}
              {showingEnd} of {totalTasks} tasks
            </p>

            <div
              className="
                ml-auto
                flex
                shrink-0
                items-center
                justify-end
                gap-1.5
              "
            >
              {/* PREVIOUS */}

              <button
                type="button"
                aria-label="Previous page"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1
                      )
                  )
                }
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  border
                  border-slate-200
                  bg-white
                  text-slate-500
                  transition
                  hover:bg-slate-50
                  hover:text-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-35
                "
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {/* PAGE NUMBER */}

              <span
                className="
                  min-w-[36px]
                  shrink-0
                  whitespace-nowrap
                  text-center
                  text-[10px]
                  font-medium
                  text-slate-700
                "
              >
                {currentPage} / {totalPages}
              </span>

              {/* NEXT */}

              <button
                type="button"
                aria-label="Next page"
                disabled={
                  currentPage >=
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                  )
                }
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  border
                  border-slate-200
                  bg-white
                  text-slate-500
                  transition
                  hover:bg-slate-50
                  hover:text-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-35
                "
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================
          CREATE TASK MODAL
      ==================================================== */}

      {showCreateModal && (
        <CreateTaskModal
          onClose={() =>
            setShowCreateModal(false)
          }
          onSuccess={() => {
            setShowCreateModal(false)

            if (currentPage === 1) {
              fetchTasks()
            } else {
              setCurrentPage(1)
            }
          }}
        />
      )}
    </div>
  )
}