// ════════════════════════════════════════════════════════════════════
//  LazySection — IntersectionObserver-gated React.lazy renderer
//  ───────────────────────────────────────────────────────────────────
//  Wraps a lazy chunk and only triggers its load when the placeholder
//  enters (or approaches) the viewport. Reserves space ahead of time
//  to prevent CLS (layout shift). Falls back to a skeleton during the
//  brief load window.
//
//  Tier 1 deliverable for v4.6 bundle-budget fix.
//
//  Usage:
//    const RegionalPricing = lazy(() => import('./RegionalPricing'))
//    <LazySection minHeight={520} rootMargin="240px">
//      <RegionalPricing />
//    </LazySection>
// ════════════════════════════════════════════════════════════════════

import React, {
  Suspense, useEffect, useRef, useState, type ReactNode, Component,
} from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any) {
    console.warn('LazySection: Caught module/render error:', error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="p-6 my-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 font-sans text-xs">
          <p className="text-amber-400 font-semibold mb-2">
            Section temporarily unavailable or updating.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false })
              if (typeof window !== 'undefined') window.location.reload()
            }}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
          >
            Reload Section
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface Props {
  children: ReactNode
  /** Reserved height while waiting — prevents CLS. */
  minHeight?: number | string
  /** IO rootMargin — when to start loading. Default: 240px before viewport. */
  rootMargin?: string
  /** Optional fallback skeleton; defaults to a subtle pulse strip. */
  fallback?: ReactNode
  /** Optional id for anchor scroll-spy interop. */
  id?: string
  /** Optional className passthrough. */
  className?: string
}

export default function LazySection({
  children,
  minHeight = 480,
  rootMargin = '240px 0px',
  fallback,
  id,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // SSR / no-IO fallback — render immediately
    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldRender(true)
            io.disconnect()
            break
          }
        }
      },
      { rootMargin, threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={{ minHeight: shouldRender ? undefined : minHeight }}
    >
      {shouldRender ? (
        <SectionErrorBoundary fallback={fallback}>
          <Suspense fallback={fallback ?? <SectionSkeleton minHeight={minHeight} />}>
            {children}
          </Suspense>
        </SectionErrorBoundary>
      ) : (
        fallback ?? <SectionSkeleton minHeight={minHeight} />
      )}
    </div>
  )
}

// ── Default fallback ─────────────────────────────────────────────────
function SectionSkeleton({ minHeight }: { minHeight: number | string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.4,
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.015), rgba(255,255,255,0.005))',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '2px solid rgba(57,191,246,0.20)',
          borderTopColor: 'rgba(57,191,246,0.7)',
          animation: 'lazySpinner 800ms linear infinite',
        }}
      />
      <style>{`
        @keyframes lazySpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
