/*
 * Module 2/3 final audit — regression tests for the four defects the source
 * audit found and fixed.
 *
 * Each test drives the REAL source (parsed or evaluated), not a description of
 * it, so a later edit that reintroduces the defect fails here.
 */
import { readFileSync } from 'node:fs'

const ROOT = 'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker'
const read = (p) => readFileSync(`${ROOT}/${p}`, 'utf8')

/**
 * Strip comments before any ordering assertion.
 *
 * Two traps in this codebase, both real:
 *  - sidebar.jsx and others keep a large commented-out EARLIER VERSION of the
 *    file above the live code (documented in CLAUDE.md). A naive regex matches
 *    the dead copy first and reports the wrong ordering.
 *  - Explanatory comments mention the very calls being ordered ("if router.push
 *    won the race..."), so a raw indexOf finds the comment, not the statement.
 */
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')

const live = (p) => stripComments(read(p))

let pass = 0, fail = 0
const check = (n, c, e = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${e}`)) }

// ---------------------------------------------------------------------------
console.log('\n1. Offline login shows a connectivity error, not "wrong password"')
{
  // Extract the catch block and evaluate its branching against both error
  // shapes, rather than pattern-matching the source.
  const src = read('src/components/auth/login-form.jsx')
  const m = src.match(/} catch \(err\) \{([\s\S]*?)\n {4}} finally/)
  check('catch block located', Boolean(m))

  let captured = null
  const setError = (v) => { captured = v }
  const body = m[1]
  const run = (err) => {
    captured = null
    new Function('err', 'setError', body)(err, setError)
    return captured
  }

  // Offline / DNS failure / server down: axios gives no `response`.
  const offlineMsg = run(new Error('Network Error'))
  check('offline -> connectivity message',
    /reach the server|connection/i.test(offlineMsg), JSON.stringify(offlineMsg))
  check('offline -> does NOT blame credentials',
    !/password|invalid email/i.test(offlineMsg), JSON.stringify(offlineMsg))

  // Genuine bad credentials: server responded 401 with a message.
  const badCreds = run({ response: { data: { message: 'Invalid credentials.' } } })
  check('401 -> server message preserved', badCreds === 'Invalid credentials.', JSON.stringify(badCreds))

  // Server responded but with no message body.
  const noMsg = run({ response: { data: {} } })
  check('response without message -> credentials fallback',
    /invalid email or password/i.test(noMsg), JSON.stringify(noMsg))
}

// ---------------------------------------------------------------------------
console.log('\n2. /notifications page reflects actions taken elsewhere (AC-9)')
{
  const src = read('src/app/notifications/page.jsx')

  check('page subscribes to the store notifications array',
    /useNotificationStore\(\(s\) => s\.notifications\)/.test(src))
  check('merge is derived, not an effect (no setItems sync loop)',
    /const rows = useMemo/.test(src) && !/setItems\(\(prev\) => \{[\s\S]*?fromStore/.test(src))

  // Render path must consume the merged list, not raw items.
  check('list render uses rows', /rows\.map\(\(n\) => \{/.test(src))
  check('empty state uses rows', /rows\.length === 0/.test(src))
  check('unread flag uses rows', /rows\.some\(\(n\) => !n\.isRead\)/.test(src))

  // Execute the merge logic itself.
  const mm = src.match(/const rows = useMemo\(\(\) => \{([\s\S]*?)\n {2}\}, \[items, storeNotifications\]\)/)
  check('merge body located', Boolean(mm))
  const merge = new Function('items', 'storeNotifications', mm[1])

  const items = [
    { id: 'a', actionTaken: null, actionedAt: null, isRead: false },
    { id: 'b', actionTaken: null, actionedAt: null, isRead: false },
  ]
  // A push action landed on 'a' while this page was open.
  const store = [{ id: 'a', actionTaken: 'approve', actionedAt: '2026-08-07T10:00:00.000Z' }]
  const out = merge(items, store)

  check('actioned row picks up actionTaken from the store', out[0].actionTaken === 'approve')
  check('actioned row picks up actionedAt', out[0].actionedAt === '2026-08-07T10:00:00.000Z')
  check('actioned row marked read', out[0].isRead === true)
  check('untouched row is referentially identical', out[1] === items[1])
  check('empty store returns the original array', merge(items, []) === items)
  check('store row without actionTaken changes nothing',
    merge(items, [{ id: 'a', actionTaken: null }])[0] === items[0])
  check('already-matching action is a no-op (no churn)',
    merge([{ id: 'a', actionTaken: 'approve' }], [{ id: 'a', actionTaken: 'approve' }])[0].actionTaken === 'approve')
}

// ---------------------------------------------------------------------------
console.log('\n3. Logout releases the push subscription before clearing auth')
{
  const src = read('src/components/layout/sidebar.jsx')
  check('disablePush imported', /import \{ disablePush \} from '@\/lib\/push'/.test(src))

  // Comments stripped first — sidebar.jsx keeps a commented-out earlier copy of
  // handleLogout above the live one, and it lacks every call under test here.
  const liveSrc = live('src/components/layout/sidebar.jsx')
  const fn = liveSrc.match(/async function handleLogout\(\)[\s\S]*?\n {2}\}/)[0]
  check('matched the LIVE handleLogout, not the commented copy',
    fn.includes('disablePush') && fn.length < 1200, `len=${fn.length}`)
  check('handleLogout calls disablePush', /await disablePush\(\)/.test(fn))

  const iPush = fn.indexOf('disablePush')
  const iClear = fn.indexOf('clearAuth()')
  const iCache = fn.indexOf('clearOfflineCaches')
  const iPushRouter = fn.indexOf('router.push')

  // Ordering is the whole point: DELETE /push/subscribe is authenticated.
  check('disablePush runs BEFORE clearAuth (token still present)',
    iPush > -1 && iClear > -1 && iPush < iClear, `push@${iPush} clearAuth@${iClear}`)
  check('cache clear still awaited before redirect',
    iCache > -1 && iCache < iPushRouter && /await clearOfflineCaches\(\)/.test(fn),
    `cache@${iCache} router@${iPushRouter}`)
  check('disablePush failure cannot block logout',
    /await disablePush\(\)\s*\}\s*catch/.test(fn))
}

// ---------------------------------------------------------------------------
console.log('\n4. Offline page retry re-requests the URL the user asked for')
{
  const page = read('src/app/offline/page.jsx')
  const btn = read('src/components/shared/offline-retry-button.jsx')

  check('page no longer hardcodes /dashboard as the retry target',
    !/href="\/dashboard"/.test(page), 'still hardcoded')
  check('page renders OfflineRetryButton', /<OfflineRetryButton \/>/.test(page))
  check('page stays force-static', /export const dynamic = 'force-static'/.test(page))
  check('page still does NOT mount AppShell',
    !/<AppShell/.test(page) && !/from '@\/components\/layout\/app-shell'/.test(page))

  check('button is a client component', /^'use client'/.test(btn))
  check('retry reloads the current URL', /window\.location\.reload\(\)/.test(btn))
  check('no-JS fallback targets the current URL', /href="\."/.test(btn))
  check('does not use a Next router push (dead network)', !/useRouter|router\.push/.test(btn))
}

// ---------------------------------------------------------------------------
console.log('\n5. SF6 invariants preserved by these edits')
{
  // Comments stripped: login-form.jsx's own explanation of this invariant
  // mentions router.push, which a raw indexOf finds BEFORE the real statement.
  const login = live('src/components/auth/login-form.jsx')
  const iClear = login.indexOf('await clearOfflineCaches()')
  const iPush = login.indexOf('router.push')
  check('login-side cache clear still awaited before router.push',
    iClear > -1 && iPush > -1 && iClear < iPush, `clear@${iClear} push@${iPush}`)
  check('login clear still has its .catch', /await clearOfflineCaches\(\)\.catch\(\(\) => \{\}\)/.test(login))

  const sw = read('public/sw.js')
  check('never-cache patterns intact',
    /NEVER_CACHE_PATTERNS = \[\/\\\/auth\(\\\/\|\$\)\/, \/\\\/notifications\\\/push\(\\\/\|\$\)\/\]/.test(sw) ||
    (/\/auth\(/.test(sw) && /notifications\\\/push/.test(sw)))
  check('non-GET guard intact', /request\.method !== 'GET'/.test(sw))
  // Matched against the guard's meaning rather than one exact expression: the
  // single-line form was expanded to also reject redirected responses, which
  // strengthens this invariant rather than relaxing it.
  check('opaque + non-200 guard intact',
    /response\.status !== 200/.test(sw) && /response\.type === 'opaque'/.test(sw))
  check('redirected responses never cached', /response\.redirected/.test(sw))
  check('push handler intact', /self\.addEventListener\('push'/.test(sw))
  check('notificationclick handler intact', /self\.addEventListener\('notificationclick'/.test(sw))
  check('iOS maxActions guard intact', /typeof Notification\.maxActions === 'number'/.test(sw))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
