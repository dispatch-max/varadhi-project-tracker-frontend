'use client'

import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/*
 * The "you're about to be signed out" modal (requirement 6).
 *
 * Deliberately NOT dismissible by the usual means — no overlay click, no Escape
 * key, no close button. Those all resolve to "cancel", and there is no cancel
 * here: the two real options are to stay signed in or to sign out now. A modal
 * that vanishes on a stray Escape press would leave the countdown running
 * invisibly and sign the user out with no warning at all, which is the exact
 * failure this dialog exists to prevent.
 *
 * Note that dismissing it is also not the same as staying signed in: only
 * `onStayLoggedIn` resets the shared activity clock.
 */
export function InactivityWarningModal({
  open,
  secondsRemaining,
  onStayLoggedIn,
  onLogoutNow,
}) {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const countdown = `${minutes}:${String(seconds).padStart(2, '0')}`

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>Still there?</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            You&apos;ve been inactive for a while. For security, you&apos;ll be
            signed out automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Signing out in
          </p>
          {/* tabular-nums stops the countdown jittering as digits change width */}
          <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-foreground">
            {countdown}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onLogoutNow}>
            Log out now
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            onClick={onStayLoggedIn}
            autoFocus
          >
            Stay logged in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
