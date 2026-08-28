/*
 * Offline-write feedback + future-proofing invariants.
 *
 * Offline writes are deliberately NOT queued (AC-15 out of scope). That is a
 * valid product decision only if the UI says so — a silent revert is a data-loss
 * bug from the user's point of view. These tests hold that line, and pin the
 * architectural invariants that must survive future edits.
 */
import { readFileSync } from 'node:fs'

const ROOT = 'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker'
const read = (p) => readFileSync(`${ROOT}/${p}`, 'utf8')
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')

let pass = 0, fail = 0
const check = (n, c, e = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${e}`)) }

// ---------------------------------------------------------------------------
console.log('\n1. Kanban refuses offline drags and explains why')
{
  const src = read('src/components/kanban/kanban-board.jsx')
  const live = stripComments(src)

  check('reads connectivity from the shared store (no second source of truth)',
    /useConnectivityStore\.getState\(\)\.isOffline/.test(live))
  check('does not maintain its own navigator.onLine state',
    !/navigator\.onLine/.test(live))

  const fn = live.match(/async function handleDragEnd\(event\)[\s\S]*?\n {2}\}/)[0]
  const iGuard = fn.indexOf('isOffline')
  const iOptimistic = fn.indexOf('setTasks((prev)')
  const iApi = fn.indexOf('tasksApi.updateStatus')

  // The guard must precede the optimistic move, or the card visibly jumps and
  // then snaps back — the exact behaviour this fix removes.
  check('offline guard runs BEFORE the optimistic update',
    iGuard > -1 && iOptimistic > -1 && iGuard < iOptimistic, `guard@${iGuard} optimistic@${iOptimistic}`)
  check('offline guard runs BEFORE the API call',
    iGuard > -1 && iApi > -1 && iGuard < iApi)
  check('offline path returns early (no request attempted)',
    /isOffline\)\s*\{[\s\S]*?return\s*\n?\s*\}/.test(fn))
  check('no silent console.error-only failure path remains',
    !/catch \(err\) \{\s*console\.error[^}]*\}\s*finally/.test(fn))
  check('failure sets a user-visible message', /setSaveError\(/.test(fn))
  check('reconcile refetch still runs in finally', /finally \{[\s\S]*?fetchTasks\(\)/.test(fn))
}

console.log('\n2. Save-failure message distinguishes offline from rejection')
{
  // Anchor to handleDragEnd's catch specifically — fetchTasks has one too, and
  // a loose match grabs the wrong block.
  const src = stripComments(read('src/components/kanban/kanban-board.jsx'))
  const fn = src.match(/async function handleDragEnd\(event\)[\s\S]*?\n {2}\}/)[0]
  const m = fn.match(/catch \(err\) \{([\s\S]*?)\n {4}\} finally/)
  check('handleDragEnd catch block located', Boolean(m))

  let captured = null
  const run = (err) => {
    captured = null
    new Function('err', 'setSaveError', m[1])(err, (v) => { captured = v })
    return captured
  }

  // Assert INTENT, not exact wording — the copy is allowed to change, but it
  // must always tell the user this was a connectivity problem and that the
  // change was not saved.
  const network = run(new Error('Network Error'))
  check('transport failure -> blames connectivity',
    /offline|reach the server|connection/i.test(network), JSON.stringify(network))
  check('transport failure -> says it was not saved',
    /can't be saved|couldn't be saved|wasn't saved|not saved/i.test(network), JSON.stringify(network))
  check('transport failure does not invent a server reason',
    !/not authorized|permission/i.test(network))

  const forbidden = run({ response: { data: { message: 'You are not authorized to update this task.' } } })
  check('server rejection -> server message shown',
    forbidden === 'You are not authorized to update this task.', JSON.stringify(forbidden))

  const bare = run({ response: { data: {} } })
  check('server error without message -> generic save failure',
    /couldn't be saved/i.test(bare), JSON.stringify(bare))
}

console.log('\n3. Failed board load is not rendered as "no tasks"')
{
  const src = stripComments(read('src/components/kanban/kanban-board.jsx'))
  const fn = src.match(/async function fetchTasks\(\)[\s\S]*?\n {2}\}/)[0]
  check('load failure no longer blanks the board', !/catch \(err\) \{\s*setTasks\(\[\]\)/.test(fn))
  check('load failure raises a flag', /setLoadFailed\(true\)/.test(fn))
  check('successful load clears the flag', /setLoadFailed\(false\)/.test(fn))
  check('flag is rendered', /loadFailed && \(/.test(src))
}

console.log('\n4. Offline UX matches reality — writes ARE queued (AC-15)')
{
  // This section asserted the opposite before AC-15 shipped. The contract is
  // inverted, not relaxed: the UI must promise syncing ONLY because an
  // IndexedDB outbox and a replay engine now genuinely back that promise.
  const banner = read('src/components/shared/offline-banner.jsx')
  check('global banner promises the change is saved locally',
    /saved here|saved on this device/i.test(banner))
  check('global banner promises it will sync on reconnect',
    /sync automatically|will sync/i.test(banner))
  check('global banner no longer claims changes are lost',
    !/won&apos;t be saved|won't be saved/.test(banner))

  const kanban = stripComments(read('src/components/kanban/kanban-board.jsx'))
  check('kanban queues offline drags instead of refusing them',
    /enqueue\(\{/.test(kanban) && /OPERATIONS\.TASK_STATUS/.test(kanban))
  check('kanban still refuses honestly when IndexedDB is unavailable',
    /can't save changes for later/.test(kanban))
}

console.log('\n5. Future-proofing invariants (must survive later edits)')
{
  const sw = read('public/sw.js')
  const login = stripComments(read('src/components/auth/login-form.jsx'))
  const sidebar = stripComments(read('src/components/layout/sidebar.jsx'))

  // Cache-safety contract
  check('non-GET never intercepted', /request\.method !== 'GET'/.test(sw))
  check('auth + push excluded from cache',
    /\/auth\(/.test(sw) && /notifications\\\/push/.test(sw))
  // See audit-fixes.test.mjs: the guard was expanded from one expression into
  // explicit rejections (adding `redirected`), so match on its parts.
  check('non-200 and opaque excluded',
    /response\.status !== 200/.test(sw) && /response\.type === 'opaque'/.test(sw))
  check('cache reads ignore Vary but NOT search params',
    /ignoreVary: true/.test(sw) && !/ignoreSearch/.test(sw))

  // Push handlers untouched
  check('push handler present', /addEventListener\('push'/.test(sw))
  check('notificationclick handler present', /addEventListener\('notificationclick'/.test(sw))
  check('iOS maxActions guard present', /typeof Notification\.maxActions === 'number'/.test(sw))
  check('fetch handler added last (push handlers not restructured)',
    sw.indexOf("addEventListener('push'") < sw.indexOf("addEventListener('fetch'"))

  // Cross-user isolation
  const iClear = login.indexOf('await clearOfflineCaches()')
  const iPush = login.indexOf('router.push')
  check('login cache clear awaited before redirect', iClear > -1 && iClear < iPush)
  check('logout releases push before clearing auth',
    sidebar.indexOf('disablePush') < sidebar.indexOf('clearAuth()'))
  check('cache clear is prefix-based (sweeps old SW versions)',
    /startsWith\(CACHE_PREFIX\)/.test(read('src/lib/offline-cache.js')))

  // Single source of truth for notification state
  const page = read('src/app/notifications/page.jsx')
  check('notifications page derives from the store, not a second poll',
    /useNotificationStore\(\(s\) => s\.notifications\)/.test(page) && !/setInterval/.test(page))
}

console.log('\n6. SW cache coverage matches the routes that read those APIs')
{
  const sw = read('public/sw.js')
  const m = sw.match(/return \/\^\\\/\((.*?)\)\(/)
  check('cacheable API list located', Boolean(m))
  const cached = m[1].split('|')
  // /kanban and /dashboard both read these APIs, so both work offline even
  // though neither path is named in the SW.
  for (const p of ['tasks', 'projects', 'dashboard']) {
    check(`/${p} API cached (backs offline dashboard + kanban)`, cached.includes(p))
  }
  check('kanban reads the cached /tasks API',
    /tasksApi\.getAll\(\)/.test(read('src/components/kanban/kanban-board.jsx')))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
