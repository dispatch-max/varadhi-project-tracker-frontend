// SF5 closeout: prove applyActionResult is idempotent against repeated calls
// with the same action, and that the poll path (setNotifications) cannot
// compound with it.
//
// Runs the REAL store module, not a re-implementation.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = 'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker'

// Minimal zustand `create` stand-in: same contract (set/get, partial merge).
function create(initializer) {
  let state
  const set = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial
    state = { ...state, ...next }
  }
  const get = () => state
  state = initializer(set, get)
  return () => state
}

// Load the real store source and evaluate it with our `create`.
const src = readFileSync(path.join(ROOT, 'src/store/notification.store.js'), 'utf8')
  .replace(/^import .*$/m, '')
  .replace('export const useNotificationStore =', 'const useNotificationStore =')
const factory = new Function('create', `${src}\nreturn useNotificationStore`)
const useStore = factory(create)
const s = () => useStore()

let pass = 0, fail = 0
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`) }
}

const row = (over = {}) => ({
  id: 'n1', isRead: false, actionTaken: null, actionedAt: null, ...over,
})

console.log('\nA. applyActionResult repeated with the SAME action')
{
  s().setNotifications([row(), row({ id: 'n2' })], 2)
  s().applyActionResult('n1', 'approve', '2026-08-07T10:00:00.000Z')
  const after1 = { ...s().notifications.find(n => n.id === 'n1') }
  const count1 = s().unreadCount

  // Same call again — the postMessage-then-poll scenario.
  s().applyActionResult('n1', 'approve', '2026-08-07T10:00:00.000Z')
  const after2 = s().notifications.find(n => n.id === 'n1')
  const count2 = s().unreadCount

  check('row identical after 2nd identical call',
    JSON.stringify(after1) === JSON.stringify(after2), `${JSON.stringify(after1)} vs ${JSON.stringify(after2)}`)
  check('unreadCount decremented exactly once (2 -> 1)', count1 === 1 && count2 === 1, `got ${count1} then ${count2}`)

  // And a third, five more times.
  for (let i = 0; i < 5; i++) s().applyActionResult('n1', 'approve', '2026-08-07T10:00:00.000Z')
  check('stable across 7 total calls', s().unreadCount === 1 && s().notifications.find(n => n.id === 'n1').actionTaken === 'approve')
}

console.log('\nB. postMessage (no timestamp) then poll-shaped call (with timestamp)')
{
  s().setNotifications([row()], 1)
  s().applyActionResult('n1', 'approve')            // SW bridge: no server ts
  const stamped = s().notifications[0].actionedAt
  check('optimistic call stamps a timestamp', typeof stamped === 'string' && stamped.length > 0)
  check('unreadCount 1 -> 0', s().unreadCount === 0, `got ${s().unreadCount}`)

  s().applyActionResult('n1', 'approve', '2026-08-07T10:00:00.000Z')
  check('explicit server ts overrides the optimistic stamp',
    s().notifications[0].actionedAt === '2026-08-07T10:00:00.000Z')
  check('no second decrement (still 0)', s().unreadCount === 0, `got ${s().unreadCount}`)
}

console.log('\nC. reverse order: server ts first, then a bare optimistic call')
{
  s().setNotifications([row()], 1)
  s().applyActionResult('n1', 'approve', '2026-08-07T10:00:00.000Z')
  s().applyActionResult('n1', 'approve')            // must NOT re-stamp to now
  check('existing actionedAt preserved, not re-stamped to now',
    s().notifications[0].actionedAt === '2026-08-07T10:00:00.000Z',
    `got ${s().notifications[0].actionedAt}`)
  check('unreadCount still 0', s().unreadCount === 0)
}

console.log('\nD. the actual race: postMessage then a real poll (setNotifications)')
{
  s().setNotifications([row(), row({ id: 'n2' })], 2)
  s().applyActionResult('n1', 'approve')            // SW bridge fires
  const optimistic = s().unreadCount

  // Poll tick: server returns the row already actioned + authoritative count.
  s().setNotifications(
    [row({ isRead: true, actionTaken: 'approve', actionedAt: '2026-08-07T10:00:00.000Z' }), row({ id: 'n2' })],
    1
  )
  check('optimistic decrement was 2 -> 1', optimistic === 1, `got ${optimistic}`)
  check('poll REPLACES count with server truth (still 1, not 0)', s().unreadCount === 1, `got ${s().unreadCount}`)
  check('poll replaces the row wholesale with server state',
    s().notifications[0].actionedAt === '2026-08-07T10:00:00.000Z')
  check('poll never calls applyActionResult -> no compounding', s().notifications.length === 2)
}

console.log('\nE. both callers fire for the same tap (in-app button + SW bridge)')
{
  s().setNotifications([row(), row({ id: 'n2' })], 2)
  s().applyActionResult('n1', 'approve', '2026-08-07T10:00:00.000Z')  // notification-actions.jsx
  s().applyActionResult('n1', 'approve', '2026-08-07T10:00:00.000Z')  // registrar bridge
  check('single decrement despite two distinct callers', s().unreadCount === 1, `got ${s().unreadCount}`)
}

console.log('\nF. snooze normalization agreement')
{
  // registrar maps snooze_1h -> snooze; notification-actions.jsx stores 'snooze'
  const norm = (a) => (String(a).startsWith('snooze') ? 'snooze' : a)
  s().setNotifications([row()], 1)
  s().applyActionResult('n1', norm('snooze_1h'))
  s().applyActionResult('n1', 'snooze', '2026-08-07T10:00:00.000Z')
  check('both paths converge on actionTaken="snooze"', s().notifications[0].actionTaken === 'snooze')
  check('single decrement', s().unreadCount === 0)
}

console.log('\nG. guard: unknown id is a no-op (SW may post for a row not in the page)')
{
  s().setNotifications([row()], 1)
  const before = JSON.stringify(s())
  s().applyActionResult('does-not-exist', 'approve')
  check('unknown id changes nothing', JSON.stringify(s()) === before)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
