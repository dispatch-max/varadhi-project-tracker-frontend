'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { CloudOff, X } from 'lucide-react'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { KANBAN_COLUMNS } from '@/constants'
import { tasksApi } from '@/lib/api/tasks.api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useConnectivityStore } from '@/store/connectivity.store'
import { useAuthStore } from '@/store/auth.store'
import { useOutboxStore } from '@/store/outbox.store'
import { enqueue, OPERATIONS } from '@/lib/outbox'


export function KanbanBoard() {
  // ---- OLD mock state (removed) ----
  // const [tasks, setTasks] = useState(INITIAL_TASKS)
  // const [activeTask, setActiveTask] = useState(null)

  // ---- NEW real API state ----
  const [tasks, setTasks] = useState([])
  const [activeTask, setActiveTask] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  // Why a save can't happen, shown above the board. Inline state rather than a
  // toast because this codebase has no toast primitive and every other error
  // surface here is inline.
  const [saveError, setSaveError] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)

  // Hoisted out of the mount effect so handleDragEnd can also call it to
  // reconcile the board with the backend after a status update.
  async function fetchTasks() {
    try {
      const response = await tasksApi.getAll()
      setTasks(response.data || [])
      setLoadFailed(false)
    } catch (err) {
      // Offline with nothing cached, the SW rejects the request and we land
      // here. Blanking the board would look identical to "you have no tasks",
      // so flag the failure and keep whatever is already on screen.
      setLoadFailed(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // fetchTasks only calls setState after its internal await; same
    // traced-false-positive as notification-bell.jsx's fetchNotifications
    // (plain function referenced by name, not inline, hides that from the linter).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks()
  }, [])


  // Sensors — mouse/touch drag (5px threshold before drag starts)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )


  // Get all tasks for a specific column/status
  function getTasksByStatus(status) {
    return tasks.filter((t) => t.status === status)
  }


  // Find which column a task belongs to
  function findColumnOfTask(taskId) {
    return tasks.find((t) => t.id === taskId)?.status
  }


  function handleDragStart(event) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }


  function handleDragOver(event) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Dragging directly over a column
    const isOverColumn = KANBAN_COLUMNS.some((col) => col.id === overId)

    if (isOverColumn) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overId } : t
        )
      )
      return
    }

    // Dragging over another card
    const activeColumn = findColumnOfTask(activeId)
    const overColumn = findColumnOfTask(overId)

    if (!activeColumn || !overColumn) return

    if (activeColumn !== overColumn) {
      // Move card to different column
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overColumn } : t
        )
      )
    } else {
      // Reorder within same column
      const columnTasks = getTasksByStatus(activeColumn)
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId)
      const newIndex = columnTasks.findIndex((t) => t.id === overId)

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex)
        setTasks((prev) => [
          ...prev.filter((t) => t.status !== activeColumn),
          ...reordered,
        ])
      }
    }
  }


  // ---- OLD handleDragEnd — no backend call (removed) ----
  // function handleDragEnd(event) {
  //   const { active, over } = event
  //   setActiveTask(null)
  //   if (!over) return
  //   const isOverColumn = KANBAN_COLUMNS.some((col) => col.id === over.id)
  //   if (isOverColumn) {
  //     setTasks((prev) =>
  //       prev.map((t) =>
  //         t.id === active.id ? { ...t, status: over.id } : t
  //       )
  //     )
  //   }
  //   // TODO: call tasksApi.updateStatus(active.id, newStatus)
  //   // when Jagdish's backend is ready
  // }

  // ---- NEW handleDragEnd — saves status to backend ----
  async function handleDragEnd(event) {
    const { active, over } = event
    // Snapshot the task's true pre-drag status before clearing it — tasks
    // state itself may have already been optimistically mutated mid-drag by
    // handleDragOver, so it can't be trusted as "the original" by this point.
    const originalStatus = activeTask?.status
    setActiveTask(null)
    if (!over) return

    const isOverColumn = KANBAN_COLUMNS.some((col) => col.id === over.id)
    const newStatus = isOverColumn
      ? over.id
      : findColumnOfTask(over.id)

    // No real status change (dropped back in the same column, or just
    // reordered within it) — skip the API call so it can't spuriously
    // re-fire a status-change notification (e.g. "Review Requested") for
    // something that didn't actually happen.
    if (!newStatus || newStatus === originalStatus) return

    // Offline: queue the change instead of losing it (AC-15). The card keeps
    // its new position, the mutation goes to the IndexedDB outbox, and the sync
    // engine replays it on reconnect. baseUpdatedAt is captured now so the
    // server can detect if someone else moves the task meanwhile.
    if (useConnectivityStore.getState().isOffline) {
      const moved = tasks.find((t) => t.id === active.id)
      const queued = await enqueue({
        userId: useAuthStore.getState().user?.id,
        operation: OPERATIONS.TASK_STATUS,
        entityId: active.id,
        payload: { status: newStatus },
        baseUpdatedAt: moved?.updatedAt || null,
      })

      if (queued) {
        // Keep the optimistic move — it is now backed by a durable record.
        setTasks((prev) =>
          prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t))
        )
        useOutboxStore.getState().refresh(useAuthStore.getState().user?.id)
        setSaveError(null)
      } else {
        // No IndexedDB (private mode, storage disabled) — nothing can be
        // durably queued, so don't pretend it was saved.
        setSaveError(
          "You're offline and this browser can't save changes for later. Reconnect and try again."
        )
        fetchTasks()
      }
      return
    }

    setSaveError(null)

    // Optimistic update — update UI immediately
    setTasks((prev) =>
      prev.map((t) =>
        t.id === active.id ? { ...t, status: newStatus } : t
      )
    )
    // Save the new status through the same endpoint every other status-change
    // UI uses (tasks.controller.js#updateTaskStatus), so notifications, the
    // audit trail, and milestone checks fire exactly as they would anywhere
    // else — no separate Kanban-only notification path.
    try {
      // Send the version we last saw so a simultaneous edit by someone else
      // is detected rather than silently overwritten (AC-15 requirement 5).
      const moved = tasks.find((t) => t.id === active.id)
      await tasksApi.updateStatus(active.id, newStatus, moved?.updatedAt || null)
    } catch (err) {
      // The refetch below silently reverts the card, so without a message the
      // move just undoes itself. Distinguish a dropped connection from a real
      // rejection (403 on someone else's task, 409, 500) — the user can act on
      // the first and needs to understand the second.
      setSaveError(
        !err.response
          ? "You're offline — that change can't be saved yet."
          : err.response?.data?.message || "That change couldn't be saved."
      )
    } finally {
      // Reconcile with the backend either way — confirms the optimistic
      // update on success, and corrects the board if the call failed.
      fetchTasks()
    }
  }


  // Show spinner while tasks are loading
  if (isLoading) return <LoadingSpinner text="Loading board..." />


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Why the last drag didn't stick. Dismissible, and cleared automatically
          by the next successful move. The global offline banner explains the
          general state; this explains the specific action that just failed. */}
      {saveError && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="flex-1 text-sm text-slate-700">{saveError}</p>
          <button
            onClick={() => setSaveError(null)}
            aria-label="Dismiss"
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* The board couldn't be refreshed — say so instead of rendering an
          empty board that reads as "no tasks". */}
      {loadFailed && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
        >
          Couldn&apos;t load the latest board. Showing what was last saved on
          this device.
        </div>
      )}

      {/* Board — horizontal scroll on small screens */}
      <div className="flex gap-5 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
          />
        ))}
      </div>

      {/* Drag Overlay — shows floating card while dragging */}
      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-95">
            <KanbanCard task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

