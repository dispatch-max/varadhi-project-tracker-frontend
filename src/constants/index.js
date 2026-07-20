// ─── Task Status ───────────────────────────────────────────────────────────────
export const TASK_STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  completed: 'Completed',
}

export const TASK_STATUS_COLORS = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-700',
  in_review: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

// ─── Task Priority ─────────────────────────────────────────────────────────────
export const TASK_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const TASK_PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

// ─── Task Type ─────────────────────────────────────────────────────────────────
export const TASK_TYPE_LABELS = {
  feature: 'Feature',
  bug: 'Bug',
  infra: 'Infra',
  research: 'Research',
  design: 'Design',
}

export const TASK_TYPE_COLORS = {
  feature: 'bg-violet-100 text-violet-700',
  bug: 'bg-red-100 text-red-700',
  infra: 'bg-green-100 text-green-700',
  research: 'bg-amber-100 text-amber-700',
  design: 'bg-pink-100 text-pink-700',
}

// ─── Project Status ────────────────────────────────────────────────────────────
export const PROJECT_STATUS_LABELS = {
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
}

export const PROJECT_STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-slate-100 text-slate-600',
}

// ─── User Roles ────────────────────────────────────────────────────────────────
export const USER_ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
}

export const USER_ROLE_COLORS = {
  admin: 'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  employee: 'bg-slate-100 text-slate-700',
}

// ─── Navigation ────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',  icon: 'LayoutDashboard', roles: ['admin', 'manager', 'employee'] },
  { label: 'Projects',   href: '/projects',   icon: 'FolderOpen',      roles: ['admin', 'manager', 'employee'] },
  { label: 'Tasks',      href: '/tasks',       icon: 'ListChecks',      roles: ['admin', 'manager', 'employee'] },
  { label: 'Kanban',     href: '/kanban',      icon: 'LayoutKanban',    roles: ['admin', 'manager', 'employee'] },
  { label: 'Documents',  href: '/documents',   icon: 'Files',           roles: ['admin', 'manager', 'employee'] },
  { label: 'Reports',    href: '/reports',     icon: 'BarChart3',       roles: ['admin', 'manager'] },
  { label: 'Users',      href: '/users',       icon: 'Users',           roles: ['admin'] },
  { label: 'Settings',   href: '/settings',    icon: 'Settings',        roles: ['admin', 'manager', 'employee'] },
]

// ─── Kanban Columns ────────────────────────────────────────────────────────────
export const KANBAN_COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: 'bg-slate-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-amber-400' },
  { id: 'in_review',   label: 'In Review',   color: 'bg-blue-400'  },
  { id: 'completed',   label: 'Completed',   color: 'bg-green-400' },
]

// ─── File Upload ───────────────────────────────────────────────────────────────
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ALLOWED_FILE_TYPES = [
  'application/pdf',

  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  'image/png',
  'image/jpeg',

  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
]

// ─── App ───────────────────────────────────────────────────────────────────────
export const APP_NAME = 'Varadhi Tracker'
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'