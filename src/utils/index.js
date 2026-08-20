// import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns'

// // ─── Tailwind class merging ────────────────────────────────────────────────────
// export function cn(...classes) {
//   return classes.filter(Boolean).join(' ')
// }

// // ─── Date utils ───────────────────────────────────────────────────────────────
// export function formatDate(date, pattern = 'MMM dd, yyyy') {
//   return format(typeof date === 'string' ? parseISO(date) : date, pattern)
// }

// export function formatRelativeTime(date) {
//   return formatDistanceToNow(
//     typeof date === 'string' ? parseISO(date) : date,
//     { addSuffix: true }
//   )
// }

// export function isOverdue(dueDate) {
//   return isAfter(new Date(), parseISO(dueDate))
// }

// // ─── String utils ─────────────────────────────────────────────────────────────
// export function getInitials(name) {
//   return name
//     .split(' ')
//     .map((n) => n[0])
//     .join('')
//     .toUpperCase()
//     .slice(0, 2)
// }

// export function truncate(str, maxLength) {
//   if (str.length <= maxLength) return str
//   return str.slice(0, maxLength) + '...'
// }

// // ─── File utils ───────────────────────────────────────────────────────────────
// export function formatFileSize(bytes) {
//   if (bytes < 1024) return bytes + ' B'
//   if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
//   return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
// }

// // ─── Number utils ─────────────────────────────────────────────────────────────
// export function calcProgress(completed, total) {
//   if (total === 0) return 0
//   return Math.round((completed / total) * 100)
// }

// // ─── Avatar color ─────────────────────────────────────────────────────────────
// const AVATAR_COLORS = [
//   'bg-violet-500',
//   'bg-blue-500',
//   'bg-green-500',
//   'bg-amber-500',
//   'bg-pink-500',
//   'bg-teal-500',
//   'bg-indigo-500',
//   'bg-rose-500',
// ]

// export function getAvatarColor(name) {
//   const index = name.charCodeAt(0) % AVATAR_COLORS.length
//   return AVATAR_COLORS[index]
// }

// // ─── LocalStorage ─────────────────────────────────────────────────────────────
// export function getFromStorage(key) {
//   if (typeof window === 'undefined') return null
//   try {
//     const item = localStorage.getItem(key)
//     return item ? JSON.parse(item) : null
//   } catch {
//     return null
//   }
// }

// export function saveToStorage(key, value) {
//   if (typeof window === 'undefined') return
//   try {
//     localStorage.setItem(key, JSON.stringify(value))
//   } catch {
//     console.error('Failed to save to localStorage')
//   }
// }

// export function removeFromStorage(key) {
//   if (typeof window === 'undefined') return
//   localStorage.removeItem(key)
// }


import { format, isAfter, isValid, parseISO, toDate } from 'date-fns'

// ─── Tailwind class merging ────────────────────────────────────────────────────
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// ─── Date utils ───────────────────────────────────────────────────────────────

// Single source of truth for date parsing: returns a valid Date or null.
// Handles strings (ISO), Date objects, numeric timestamps, null, undefined,
// empty strings, and unparseable values — none of which will ever reach a formatter.
function toValidDate(value) {
  if (value == null || value === '') return null
  const parsed = typeof value === 'string' ? parseISO(value) : toDate(value)
  return isValid(parsed) ? parsed : null
}

export function formatDate(date, pattern = 'MMM dd, yyyy', fallback = '—') {
  const parsed = toValidDate(date)
  return parsed ? format(parsed, pattern) : fallback
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Fine-grained "time ago" — date-fns's formatDistanceToNow never says
// "X seconds ago" (it rounds anything under a minute to "less than a minute
// ago"), so this is a small custom implementation instead. Falls back to an
// absolute date past a week old, where "23 days ago" stops being useful.
export function formatRelativeTime(date, fallback = '—') {
  const parsed = toValidDate(date)
  if (!parsed) return fallback

  const diffMs = Date.now() - parsed.getTime()
  if (diffMs < 0) return formatDate(parsed) // clock skew / future timestamp — show the date, don't guess

  if (diffMs < SECOND) return 'just now'
  if (diffMs < MINUTE) {
    const n = Math.floor(diffMs / SECOND)
    return `${n} second${n === 1 ? '' : 's'} ago`
  }
  if (diffMs < HOUR) {
    const n = Math.floor(diffMs / MINUTE)
    return `${n} minute${n === 1 ? '' : 's'} ago`
  }
  if (diffMs < DAY) {
    const n = Math.floor(diffMs / HOUR)
    return `${n} hour${n === 1 ? '' : 's'} ago`
  }
  if (diffMs < 7 * DAY) {
    const n = Math.floor(diffMs / DAY)
    return `${n} day${n === 1 ? '' : 's'} ago`
  }
  return formatDate(parsed)
}

// Exact timestamp for tooltips ("correct exact timestamps when needed"),
// paired with formatRelativeTime everywhere relative time is displayed.
export function formatExactTime(date, fallback = '—') {
  const parsed = toValidDate(date)
  return parsed ? format(parsed, "MMM dd, yyyy 'at' hh:mm a") : fallback
}

export function isOverdue(dueDate) {
  const parsed = toValidDate(dueDate)
  if (!parsed) return false // no/invalid due date is treated as "not overdue"
  return isAfter(new Date(), parsed)
}

// ─── String utils ─────────────────────────────────────────────────────────────
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str, maxLength) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

// ─── File utils ───────────────────────────────────────────────────────────────
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ─── Number utils ─────────────────────────────────────────────────────────────
export function calcProgress(completed, total) {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

// ─── Avatar color ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
]

export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0]
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

// ─── LocalStorage ─────────────────────────────────────────────────────────────
export function getFromStorage(key) {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

export function saveToStorage(key, value) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error('Failed to save to localStorage')
  }
}

export function removeFromStorage(key) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}
