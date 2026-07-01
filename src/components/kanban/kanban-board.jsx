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
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { KANBAN_COLUMNS } from '@/constants'
import { tasksApi } from '@/lib/api/tasks.api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'


// ============================================================
// OLD MOCK DATA — commented out, replaced by real API below
// ============================================================
// const INITIAL_TASKS = [
//   {
//     id: '1',
//     title: 'Build Login Page UI',
//     description: 'Create login form with email, password and validation.',
//     type: 'feature',
//     priority: 'high',
//     status: 'completed',
//     project: { id: '1', name: 'Varadhi Frontend' },
//     assignee: { id: '1', name: 'Suhail H' },
//     dueDate: '2026-06-10',
//   },
//   {
//     id: '2',
//     title: 'Setup MongoDB Schema',
//     description: 'Design all database schemas for the project.',
//     type: 'infra',
//     priority: 'high',
//     status: 'completed',
//     project: { id: '2', name: 'Varadhi Backend' },
//     assignee: { id: '2', name: 'Jagdish D' },
//     dueDate: '2026-06-08',
//   },
//   {
//     id: '3',
//     title: 'Kanban Drag & Drop',
//     description: 'Implement drag and drop using dnd-kit.',
//     type: 'feature',
//     priority: 'high',
//     status: 'in_progress',
//     project: { id: '1', name: 'Varadhi Frontend' },
//     assignee: { id: '1', name: 'Suhail H' },
//     dueDate: '2026-06-20',
//   },
//   {
//     id: '4',
//     title: 'JWT Auth Flow',
//     description: 'Implement JWT login and token refresh.',
//     type: 'feature',
//     priority: 'critical',
//     status: 'in_review',
//     project: { id: '2', name: 'Varadhi Backend' },
//     assignee: { id: '2', name: 'Jagdish D' },
//     dueDate: '2026-06-15',
//   },
//   {
//     id: '5',
//     title: 'File Upload Module',
//     description: 'Build document upload with progress indicator.',
//     type: 'feature',
//     priority: 'medium',
//     status: 'todo',
//     project: { id: '1', name: 'Varadhi Frontend' },
//     assignee: { id: '3', name: 'Arjun R' },
//     dueDate: '2026-07-01',
//   },
//   {
//     id: '6',
//     title: 'Fix Token Expiry Bug',
//     description: 'User stays on page instead of redirecting on expiry.',
//     type: 'bug',
//     priority: 'critical',
//     status: 'in_progress',
//     project: { id: '2', name: 'Varadhi Backend' },
//     assignee: { id: '2', name: 'Jagdish D' },
//     dueDate: '2026-06-05',
//   },
//   {
//     id: '7',
//     title: 'Research DB Hosting',
//     description: 'Compare MongoDB Atlas vs Railway vs Supabase.',
//     type: 'research',
//     priority: 'medium',
//     status: 'todo',
//     project: { id: '2', name: 'Varadhi Backend' },
//     assignee: { id: '3', name: 'Arjun R' },
//     dueDate: '2026-06-25',
//   },
//   {
//     id: '8',
//     title: 'Dashboard Charts UI',
//     description: 'Build burndown chart using Recharts.',
//     type: 'feature',
//     priority: 'medium',
//     status: 'todo',
//     project: { id: '1', name: 'Varadhi Frontend' },
//     assignee: { id: '1', name: 'Suhail H' },
//     dueDate: '2026-07-05',
//   },
// ]


export function KanbanBoard() {
  // ---- OLD mock state (removed) ----
  // const [tasks, setTasks] = useState(INITIAL_TASKS)
  // const [activeTask, setActiveTask] = useState(null)

  // ---- NEW real API state ----
  const [tasks, setTasks] = useState([])
  const [activeTask, setActiveTask] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // ---- NEW fetch tasks from backend on mount ----
  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await tasksApi.getAll()
        setTasks(response.data || [])
      } catch (err) {
        setTasks([])
      } finally {
        setIsLoading(false)
      }
    }
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
    setActiveTask(null)
    if (!over) return

    const isOverColumn = KANBAN_COLUMNS.some((col) => col.id === over.id)
    const newStatus = isOverColumn
      ? over.id
      : findColumnOfTask(over.id)

    if (newStatus) {
      // Optimistic update — update UI immediately
      setTasks((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, status: newStatus } : t
        )
      )
      // Save new status to backend
      try {
        await tasksApi.updateStatus(active.id, newStatus)
      } catch (err) {
        console.error('Failed to update task status:', err)
      }
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

// 'use client'

// import { useState } from 'react'
// import {
//   DndContext,
//   DragOverlay,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   closestCorners,
// } from '@dnd-kit/core'
// import { arrayMove } from '@dnd-kit/sortable'
// import { KanbanColumn } from './kanban-column'
// import { KanbanCard } from './kanban-card'
// import { KANBAN_COLUMNS } from '@/constants'

// // Mock tasks — same as tasks page
// const INITIAL_TASKS = [
//   {
//     id: '1',
//     title: 'Build Login Page UI',
//     description: 'Create login form with email, password and validation.',
//     type: 'feature',
//     priority: 'high',
//     status: 'completed',
//     project: { id: '1', name: 'Varadhi Frontend' },
//     assignee: { id: '1', name: 'Suhail H' },
//     dueDate: '2026-06-10',
//   },
//   {
//     id: '2',
//     title: 'Setup MongoDB Schema',
//     description: 'Design all database schemas for the project.',
//     type: 'infra',
//     priority: 'high',
//     status: 'completed',
//     project: { id: '2', name: 'Varadhi Backend' },
//     assignee: { id: '2', name: 'Jagdish D' },
//     dueDate: '2026-06-08',
//   },
//   {
//     id: '3',
//     title: 'Kanban Drag & Drop',
//     description: 'Implement drag and drop using dnd-kit.',
//     type: 'feature',
//     priority: 'high',
//     status: 'in_progress',
//     project: { id: '1', name: 'Varadhi Frontend' },
//     assignee: { id: '1', name: 'Suhail H' },
//     dueDate: '2026-06-20',
//   },
//   {
//     id: '4',
//     title: 'JWT Auth Flow',
//     description: 'Implement JWT login and token refresh.',
//     type: 'feature',
//     priority: 'critical',
//     status: 'in_review',
//     project: { id: '2', name: 'Varadhi Backend' },
//     assignee: { id: '2', name: 'Jagdish D' },
//     dueDate: '2026-06-15',
//   },
//   {
//     id: '5',
//     title: 'File Upload Module',
//     description: 'Build document upload with progress indicator.',
//     type: 'feature',
//     priority: 'medium',
//     status: 'todo',
//     project: { id: '1', name: 'Varadhi Frontend' },
//     assignee: { id: '3', name: 'Arjun R' },
//     dueDate: '2026-07-01',
//   },
//   {
//     id: '6',
//     title: 'Fix Token Expiry Bug',
//     description: 'User stays on page instead of redirecting on expiry.',
//     type: 'bug',
//     priority: 'critical',
//     status: 'in_progress',
//     project: { id: '2', name: 'Varadhi Backend' },
//     assignee: { id: '2', name: 'Jagdish D' },
//     dueDate: '2026-06-05',
//   },
//   {
//     id: '7',
//     title: 'Research DB Hosting',
//     description: 'Compare MongoDB Atlas vs Railway vs Supabase.',
//     type: 'research',
//     priority: 'medium',
//     status: 'todo',
//     project: { id: '2', name: 'Varadhi Backend' },
//     assignee: { id: '3', name: 'Arjun R' },
//     dueDate: '2026-06-25',
//   },
//   {
//     id: '8',
//     title: 'Dashboard Charts UI',
//     description: 'Build burndown chart using Recharts.',
//     type: 'feature',
//     priority: 'medium',
//     status: 'todo',
//     project: { id: '1', name: 'Varadhi Frontend' },
//     assignee: { id: '1', name: 'Suhail H' },
//     dueDate: '2026-07-05',
//   },
// ]

// export function KanbanBoard() {
//   const [tasks, setTasks] = useState(INITIAL_TASKS)
//   const [activeTask, setActiveTask] = useState(null)

//   // Sensors — mouse/touch drag
//   const sensors = useSensors(
//     useSensor(PointerSensor, {
//       activationConstraint: {
//         distance: 5, // need to move 5px before drag starts
//       },
//     })
//   )

//   // Get tasks for a specific column
//   function getTasksByStatus(status) {
//     return tasks.filter((t) => t.status === status)
//   }

//   // Find which column a task belongs to
//   function findColumnOfTask(taskId) {
//     return tasks.find((t) => t.id === taskId)?.status
//   }

//   function handleDragStart(event) {
//     const task = tasks.find((t) => t.id === event.active.id)
//     setActiveTask(task || null)
//   }

//   function handleDragOver(event) {
//     const { active, over } = event
//     if (!over) return

//     const activeId = active.id
//     const overId = over.id

//     // Check if dragging over a column directly
//     const isOverColumn = KANBAN_COLUMNS.some((col) => col.id === overId)

//     if (isOverColumn) {
//       setTasks((prev) =>
//         prev.map((t) =>
//           t.id === activeId ? { ...t, status: overId } : t
//         )
//       )
//       return
//     }

//     // Dragging over another card
//     const activeColumn = findColumnOfTask(activeId)
//     const overColumn = findColumnOfTask(overId)

//     if (!activeColumn || !overColumn) return

//     if (activeColumn !== overColumn) {
//       // Move to different column
//       setTasks((prev) =>
//         prev.map((t) =>
//           t.id === activeId ? { ...t, status: overColumn } : t
//         )
//       )
//     } else {
//       // Reorder within same column
//       const columnTasks = getTasksByStatus(activeColumn)
//       const oldIndex = columnTasks.findIndex((t) => t.id === activeId)
//       const newIndex = columnTasks.findIndex((t) => t.id === overId)

//       if (oldIndex !== newIndex) {
//         const reordered = arrayMove(columnTasks, oldIndex, newIndex)
//         setTasks((prev) => [
//           ...prev.filter((t) => t.status !== activeColumn),
//           ...reordered,
//         ])
//       }
//     }
//   }

//   function handleDragEnd(event) {
//     const { active, over } = event
//     setActiveTask(null)

//     if (!over) return

//     // If dropped on column
//     const isOverColumn = KANBAN_COLUMNS.some((col) => col.id === over.id)
//     if (isOverColumn) {
//       setTasks((prev) =>
//         prev.map((t) =>
//           t.id === active.id ? { ...t, status: over.id } : t
//         )
//       )
//     }

//     // TODO: call tasksApi.updateStatus(active.id, newStatus)
//     // when Jagdish's backend is ready
//   }

//   return (
//     <DndContext
//       sensors={sensors}
//       collisionDetection={closestCorners}
//       onDragStart={handleDragStart}
//       onDragOver={handleDragOver}
//       onDragEnd={handleDragEnd}
//     >
//       {/* Board — horizontal scroll on small screens */}
//       <div className="flex gap-5 overflow-x-auto pb-4">
//         {KANBAN_COLUMNS.map((column) => (
//           <KanbanColumn
//             key={column.id}
//             column={column}
//             tasks={getTasksByStatus(column.id)}
//           />
//         ))}
//       </div>

//       {/* Drag Overlay — shows floating card while dragging */}
//       <DragOverlay>
//         {activeTask && (
//           <div className="rotate-2 opacity-95">
//             <KanbanCard task={activeTask} />
//           </div>
//         )}
//       </DragOverlay>
//     </DndContext>
//   )
// }