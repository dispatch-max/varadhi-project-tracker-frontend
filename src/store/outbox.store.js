import { create } from 'zustand'

import { listForUser, listConflicts, MUTATION_STATUS } from '@/lib/outbox'

/**
 * UI-facing view of the offline outbox (AC-15).
 *
 * IndexedDB is the source of truth; this store is a cache of it so components
 * can render a pending count without each one opening a transaction. Always
 * refreshed FROM IndexedDB via `refresh()` — never written to independently,
 * so the two cannot drift.
 */
export const useOutboxStore = create((set, get) => ({
  pending: [],
  conflicts: [],
  isSyncing: false,
  lastSyncAt: null,
  lastResult: null,

  /** Re-read everything for the current user. */
  refresh: async (userId) => {
    if (!userId) {
      set({ pending: [], conflicts: [] })
      return
    }
    const all = await listForUser(userId)
    set({
      pending: all.filter((m) => m.status !== MUTATION_STATUS.CONFLICT),
      conflicts: all.filter((m) => m.status === MUTATION_STATUS.CONFLICT),
    })
  },

  setSyncing: (isSyncing) => set({ isSyncing }),

  setResult: (lastResult) =>
    set({ lastResult, lastSyncAt: new Date().toISOString(), isSyncing: false }),

  /** Cleared on logout / user switch so nothing bleeds between sessions. */
  reset: () =>
    set({ pending: [], conflicts: [], isSyncing: false, lastSyncAt: null, lastResult: null }),

  pendingCount: () => get().pending.length,
  conflictCount: () => get().conflicts.length,
}))
