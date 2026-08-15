'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Send, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RelativeTime } from '@/components/shared/relative-time'
import { tasksApi } from '@/lib/api/tasks.api'
import { projectsApi } from '@/lib/api/projects.api'
import { getInitials, getAvatarColor, cn } from '@/utils'

/**
 * Task comments + @mentions.
 *
 * Wired to the existing endpoints only — no new backend behaviour:
 *   POST   /tasks/:id/comments            -> returns the full updated task
 *   DELETE /tasks/:id/comments/:commentId -> author-only, server enforced
 *
 * Mention tokens deliberately mirror the backend's parsing rule exactly:
 * `@` followed by [a-zA-Z0-9._-], matched against the *email local-part*
 * (the bit before the @ in someone's address), not their display name.
 * The picker inserts that exact token so a user never has to guess it.
 */

// Same character class the backend uses, anchored to the caret.
const MENTION_IN_PROGRESS = /@([a-zA-Z0-9._-]*)$/
// Same character class again, for highlighting saved comments.
const MENTION_TOKEN = /(@[a-zA-Z0-9._-]+)/g

function localPartOf(email) {
  return String(email || '').split('@')[0].toLowerCase()
}

/** Renders comment text with @mentions visually highlighted. */
function CommentBody({ content, mentionableLocalParts }) {
  const parts = String(content).split(MENTION_TOKEN)
  return (
    <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        const isMention =
          part.startsWith('@') && mentionableLocalParts.has(part.slice(1).toLowerCase())
        return isMention ? (
          <span key={i} className="font-medium text-violet-600">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </p>
  )
}

export function TaskComments({ taskId, projectId, comments = [], currentUserId, onTaskUpdated }) {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)

  // Project participants, used only to power the @ picker.
  const [members, setMembers] = useState([])

  const textareaRef = useRef(null)
  const [mentionQuery, setMentionQuery] = useState(null) // null = picker closed
  const [highlightIndex, setHighlightIndex] = useState(0)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    async function loadMembers() {
      try {
        const project = await projectsApi.getById(projectId)
        if (!cancelled) setMembers(project?.members || [])
      } catch {
        if (!cancelled) setMembers([]) // picker degrades to off; typing still works
      }
    }

    loadMembers()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const mentionableLocalParts = useMemo(
    () => new Set(members.map((m) => localPartOf(m.email))),
    [members]
  )

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    return members
      .filter((m) => m.id !== currentUserId) // backend never notifies you about yourself
      .filter((m) => {
        if (!q) return true
        return (
          localPartOf(m.email).includes(q) || String(m.name || '').toLowerCase().includes(q)
        )
      })
      .slice(0, 6)
  }, [members, mentionQuery, currentUserId])

  function handleContentChange(e) {
    const value = e.target.value
    setContent(value)
    setError(null)

    // Only offer the picker while the caret sits inside an unfinished @token.
    const upToCaret = value.slice(0, e.target.selectionStart)
    const match = upToCaret.match(MENTION_IN_PROGRESS)
    setMentionQuery(match ? match[1] : null)
    setHighlightIndex(0)
  }

  function insertMention(member) {
    const el = textareaRef.current
    const caret = el ? el.selectionStart : content.length
    const before = content.slice(0, caret).replace(MENTION_IN_PROGRESS, '')
    const after = content.slice(caret)
    const token = `@${localPartOf(member.email)} `
    const next = before + token + after

    setContent(next)
    setMentionQuery(null)

    // Put the caret straight after the inserted token.
    requestAnimationFrame(() => {
      if (!el) return
      const pos = (before + token).length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  function handleKeyDown(e) {
    if (mentionQuery !== null && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex((i) => (i + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(suggestions[highlightIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionQuery(null)
        return
      }
    }

    // Ctrl/Cmd+Enter posts, matching common comment-box behaviour.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handlePost()
    }
  }

  async function handlePost() {
    const trimmed = content.trim()
    if (!trimmed || isPosting) return

    setIsPosting(true)
    setError(null)
    try {
      // Returns the full updated task, so the parent can refresh without a second call.
      const updatedTask = await tasksApi.addComment(taskId, trimmed)
      setContent('')
      setMentionQuery(null)
      onTaskUpdated?.(updatedTask)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not post your comment. Try again.')
    } finally {
      setIsPosting(false)
    }
  }

  async function handleDelete(commentId) {
    if (!window.confirm('Delete this comment?')) return

    setDeletingId(commentId)
    setError(null)
    try {
      await tasksApi.deleteComment(taskId, commentId)
      // The delete endpoint returns no body and is author-scoped server-side,
      // so re-read the task rather than assuming the removal happened.
      const refreshed = await tasksApi.getById(taskId)
      onTaskUpdated?.(refreshed?.data ?? refreshed)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not delete the comment. Try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Comments
        {comments.length > 0 && (
          <span className="ml-1.5 text-xs font-normal text-slate-400">
            ({comments.length})
          </span>
        )}
      </h3>

      {/* Existing comments */}
      {comments.length === 0 ? (
        <p className="text-xs text-slate-400 mb-5">
          No comments yet. Start the conversation below.
        </p>
      ) : (
        <div className="space-y-4 mb-5">
          {comments.map((c) => {
            const authorName = c.author?.name || 'Unknown'
            const isOwn = c.author?.id === currentUserId
            return (
              <div key={c.id} className="flex gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                    getAvatarColor(authorName)
                  )}
                >
                  {getInitials(authorName)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{authorName}</span>
                    <RelativeTime date={c.createdAt} className="text-xs text-slate-400" />
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        aria-label="Delete comment"
                        className="ml-auto text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <CommentBody
                    content={c.content}
                    mentionableLocalParts={mentionableLocalParts}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New comment */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          disabled={isPosting}
          rows={3}
          placeholder="Write a comment… type @ to mention someone"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none placeholder:text-slate-400"
        />

        {/* Mention picker */}
        {mentionQuery !== null && suggestions.length > 0 && (
          <div className="absolute left-0 bottom-full mb-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
            {suggestions.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => {
                  // mousedown, not click — keeps focus in the textarea.
                  e.preventDefault()
                  insertMention(m)
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={cn(
                  'w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors',
                  i === highlightIndex ? 'bg-violet-50' : 'hover:bg-slate-50'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                    getAvatarColor(m.name || '?')
                  )}
                >
                  {getInitials(m.name || '?')}
                </div>
                <span className="min-w-0">
                  <span className="block text-sm text-slate-800 truncate">{m.name}</span>
                  <span className="block text-xs text-slate-400 truncate">
                    @{localPartOf(m.email)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-2">
          <Button type="button" onClick={handlePost} disabled={!content.trim() || isPosting}>
            {isPosting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Comment
              </>
            )}
          </Button>

          {error && (
            <p className="text-sm text-destructive" role="status">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
