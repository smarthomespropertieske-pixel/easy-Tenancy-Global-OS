// ════════════════════════════════════════════════════════════════════════
//  animBudget.ts — dev-only animation duration auditor (UX directive #6)
//  ─────────────────────────────────────────────────────────────────────
//  Walks the DOM after page paint and warns about any element whose
//  computed animation-duration or transition-duration exceeds the budget
//  (600ms). Marquee/infinite animations are exempt (they don't violate the
//  micro-animation rule — they're decorative loops).
//
//  Production-safe: NO-OP outside dev. Tree-shakes when used as
//  `if (import.meta.env.DEV) auditAnimBudget()`.
// ════════════════════════════════════════════════════════════════════════

const BUDGET_MS  = 600
const EXEMPT_RE  = /(marquee|cloud|halo|orb|pulse)/i  // decorative loops OK

function parseMs(value: string): number {
  // CSS values like "1.4s, 200ms" — take the longest
  if (!value || value === '0s' || value === 'none') return 0
  return value.split(',').reduce((max, v) => {
    const t = v.trim()
    let n = 0
    if (t.endsWith('ms')) n = parseFloat(t)
    else if (t.endsWith('s')) n = parseFloat(t) * 1000
    return Math.max(max, n)
  }, 0)
}

interface Violation {
  selector: string
  duration: number
  property: 'animation' | 'transition'
  iteration: string
}

export function auditAnimBudget(): Violation[] {
  if (typeof window === 'undefined' || typeof document === 'undefined') return []

  const violations: Violation[] = []
  const nodes = document.querySelectorAll<HTMLElement>('body *')

  nodes.forEach((el) => {
    const cs = getComputedStyle(el)
    const animDur = parseMs(cs.animationDuration)
    const transDur = parseMs(cs.transitionDuration)
    const iter = cs.animationIterationCount

    // Exempt: marquees, decorative loops, infinite animations on known classes
    const id  = el.id || ''
    const cls = el.className.toString()
    if (EXEMPT_RE.test(id + ' ' + cls)) return
    if (iter === 'infinite' && animDur < 4000) return  // allow gentle infinite if <4s

    if (animDur > BUDGET_MS) {
      violations.push({
        selector: el.tagName.toLowerCase() + (id ? `#${id}` : '') + (cls ? `.${cls.split(' ')[0]}` : ''),
        duration: animDur,
        property: 'animation',
        iteration: iter,
      })
    }
    if (transDur > BUDGET_MS) {
      violations.push({
        selector: el.tagName.toLowerCase() + (id ? `#${id}` : '') + (cls ? `.${cls.split(' ')[0]}` : ''),
        duration: transDur,
        property: 'transition',
        iteration: '—',
      })
    }
  })

  if (violations.length > 0) {
    /* eslint-disable no-console */
    console.groupCollapsed(
      `%c[anim-budget] ⚠ ${violations.length} violation(s) > ${BUDGET_MS}ms`,
      'color:#f59e0b;font-weight:600',
    )
    violations.slice(0, 12).forEach((v) => {
      console.log(`  ${v.selector} → ${v.duration}ms ${v.property} (${v.iteration})`)
    })
    if (violations.length > 12) console.log(`  …and ${violations.length - 12} more`)
    console.groupEnd()
    /* eslint-enable no-console */
  } else {
    /* eslint-disable-next-line no-console */
    console.log('%c[anim-budget] ✓ all animations within budget', 'color:#34d399')
  }

  return violations
}

// Auto-run on first idle in dev
export function installAnimBudgetWatcher() {
  if (typeof window === 'undefined') return
  if (!import.meta.env.DEV) return

  const run = () => setTimeout(() => auditAnimBudget(), 1500)
  type IdleCb = (cb: () => void, opts?: { timeout: number }) => void
  const w = window as unknown as { requestIdleCallback?: IdleCb }
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, 2000)
}
